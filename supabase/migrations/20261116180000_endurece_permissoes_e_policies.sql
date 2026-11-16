-- Auditoria de segurança do banco (2026-11-16). O papel `authenticated` tinha INSERT/UPDATE/DELETE/TRUNCATE em todas as tabelas e
-- várias policies `FOR ALL ... TO public` eram permissivas demais (policies permissivas se somam com OR). Principais furos:
--   * pagamentos: o responsável podia inserir/alterar pagamentos (forjar CONFIRMADO/recibo) sem passar por registrar_pagamento;
--   * contratos_servico / mensalidades: as partes podiam mudar valor, status e dono por UPDATE direto;
--   * registros_embarque_desembarque, eventos_rota, comunicados_ausencia: a policy ALL deixava gravar para aluno/viagem de outro usuário;
--   * localizacoes_gps / viagens: dava para gravar posições em viagem de outro transportador ou usar veículo alheio;
--   * transportadores.codigo_convite editável por UPDATE; funções de trigger executáveis por anon/authenticated.
-- Estratégia: (1) privilégios mínimos por tabela/coluna, (2) todas as policies recriadas (uma por comando, só `authenticated`,
-- com `(select auth.uid())` para não reavaliar por linha), (3) EXECUTE revogado de anon e das funções internas.

-- ---------------------------------------------------------------- 1. Privilégios de tabela
REVOKE ALL ON public.perfis, public.responsaveis, public.transportadores, public.enderecos_responsavel, public.alunos,
              public.pessoas_autorizadas, public.comunicados_ausencia, public.veiculos, public.viagens, public.localizacoes_gps,
              public.registros_embarque_desembarque, public.eventos_rota, public.calendario_escolar, public.contratos_servico,
              public.mensalidades, public.pagamentos, public.mensagens, public.notificacoes, public.push_tokens
  FROM anon, authenticated;

GRANT SELECT ON public.perfis, public.responsaveis, public.transportadores, public.enderecos_responsavel, public.alunos,
                public.pessoas_autorizadas, public.comunicados_ausencia, public.veiculos, public.viagens, public.localizacoes_gps,
                public.registros_embarque_desembarque, public.eventos_rota, public.calendario_escolar, public.contratos_servico,
                public.mensalidades, public.pagamentos, public.mensagens, public.notificacoes, public.push_tokens
  TO authenticated;

-- Escritas que o app realmente faz direto (todo o resto passa por funções SECURITY DEFINER)
GRANT INSERT ON public.enderecos_responsavel, public.pessoas_autorizadas, public.comunicados_ausencia, public.veiculos,
                public.viagens, public.localizacoes_gps, public.registros_embarque_desembarque, public.eventos_rota,
                public.calendario_escolar, public.mensagens
  TO authenticated;
GRANT DELETE ON public.enderecos_responsavel, public.pessoas_autorizadas, public.calendario_escolar, public.push_tokens TO authenticated;

GRANT UPDATE (nome, telefone, cpf) ON public.perfis TO authenticated;
GRANT UPDATE (cnh, categoria_cnh, numero_credencial, alvara_autonomo, foto_url,
              valor_mensalidade_padrao, dia_vencimento_padrao, chave_pix) ON public.transportadores TO authenticated; -- sem id nem codigo_convite
GRANT UPDATE (rotulo, endereco_texto, latitude, longitude, precisao, origem, ajustado_manual, geocodificado_em)
  ON public.enderecos_responsavel TO authenticated;
GRANT UPDATE (nome, data_nascimento, documento, turma, turno, escola_nome, escola_endereco, observacoes_medicas,
              foto_url, endereco_busca, endereco_entrega, ativo) ON public.alunos TO authenticated;
GRANT UPDATE (nome, cpf, telefone, grau_parentesco, foto_url, ativo) ON public.pessoas_autorizadas TO authenticated;
GRANT UPDATE ON public.veiculos TO authenticated;       -- upsert por placa atualiza todas as colunas enviadas; a RLS trava o dono
GRANT UPDATE (status, data_hora_fim, km_percorrido) ON public.viagens TO authenticated;
GRANT UPDATE (data, titulo, tipo, descricao) ON public.calendario_escolar TO authenticated;
GRANT UPDATE (lida) ON public.notificacoes TO authenticated;

-- ---------------------------------------------------------------- 2. Policies (recriadas do zero)
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename <> 'spatial_ref_sys' LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- perfis
CREATE POLICY perfis_select ON public.perfis FOR SELECT TO authenticated USING (public.relacionado_com(id));
CREATE POLICY perfis_update_proprio ON public.perfis FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

-- responsaveis / transportadores (escrita só pela função de cadastro e pelo UPDATE de colunas liberadas)
CREATE POLICY responsaveis_select ON public.responsaveis FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id OR EXISTS (SELECT 1 FROM public.alunos a WHERE a.responsavel_id = responsaveis.id AND a.transportador_id = (SELECT auth.uid())));
CREATE POLICY transportadores_select ON public.transportadores FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id OR EXISTS (SELECT 1 FROM public.alunos a WHERE a.transportador_id = transportadores.id AND a.responsavel_id = (SELECT auth.uid())));
CREATE POLICY transportadores_update_proprio ON public.transportadores FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

-- enderecos_responsavel
CREATE POLICY enderecos_select ON public.enderecos_responsavel FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = responsavel_id OR EXISTS (SELECT 1 FROM public.alunos a WHERE a.transportador_id = (SELECT auth.uid())
         AND (a.endereco_busca_id = enderecos_responsavel.id OR a.endereco_entrega_id = enderecos_responsavel.id)));
CREATE POLICY enderecos_insert ON public.enderecos_responsavel FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = responsavel_id);
CREATE POLICY enderecos_update ON public.enderecos_responsavel FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = responsavel_id) WITH CHECK ((SELECT auth.uid()) = responsavel_id);
CREATE POLICY enderecos_delete ON public.enderecos_responsavel FOR DELETE TO authenticated USING ((SELECT auth.uid()) = responsavel_id);

-- alunos (nasce em cadastrar_aluno; vínculo muda em vincular_aluno/desvincular_aluno)
CREATE POLICY alunos_select ON public.alunos FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = responsavel_id OR (SELECT auth.uid()) = transportador_id);
CREATE POLICY alunos_update_responsavel ON public.alunos FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = responsavel_id) WITH CHECK ((SELECT auth.uid()) = responsavel_id);

-- pessoas_autorizadas
CREATE POLICY pessoas_select ON public.pessoas_autorizadas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = pessoas_autorizadas.aluno_id
         AND ((SELECT auth.uid()) = a.responsavel_id OR (SELECT auth.uid()) = a.transportador_id)));
CREATE POLICY pessoas_insert ON public.pessoas_autorizadas FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = pessoas_autorizadas.aluno_id AND a.responsavel_id = (SELECT auth.uid())));
CREATE POLICY pessoas_update ON public.pessoas_autorizadas FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = pessoas_autorizadas.aluno_id AND a.responsavel_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = pessoas_autorizadas.aluno_id AND a.responsavel_id = (SELECT auth.uid())));
CREATE POLICY pessoas_delete ON public.pessoas_autorizadas FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = pessoas_autorizadas.aluno_id AND a.responsavel_id = (SELECT auth.uid())));

-- comunicados_ausencia (só inserção: aluno do próprio responsável e transportador coerente)
CREATE POLICY ausencia_select ON public.comunicados_ausencia FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = responsavel_id OR (SELECT auth.uid()) = transportador_id);
CREATE POLICY ausencia_insert_responsavel ON public.comunicados_ausencia FOR INSERT TO authenticated
  WITH CHECK (responsavel_id = (SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = comunicados_ausencia.aluno_id
         AND a.responsavel_id = (SELECT auth.uid()) AND a.transportador_id = comunicados_ausencia.transportador_id));

-- veiculos
CREATE POLICY veiculos_select ON public.veiculos FOR SELECT TO authenticated USING (public.vinculado_ao_transportador(transportador_id));
CREATE POLICY veiculos_insert ON public.veiculos FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = transportador_id);
CREATE POLICY veiculos_update ON public.veiculos FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = transportador_id) WITH CHECK ((SELECT auth.uid()) = transportador_id);

-- viagens (o veículo tem de ser do próprio transportador)
CREATE POLICY viagens_select ON public.viagens FOR SELECT TO authenticated USING (public.vinculado_ao_transportador(transportador_id));
CREATE POLICY viagens_insert ON public.viagens FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = transportador_id AND EXISTS (SELECT 1 FROM public.veiculos v WHERE v.id = viagens.veiculo_id AND v.transportador_id = (SELECT auth.uid())));
CREATE POLICY viagens_update ON public.viagens FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = transportador_id) WITH CHECK ((SELECT auth.uid()) = transportador_id);

-- localizacoes_gps / eventos_rota: só na viagem do próprio transportador
CREATE POLICY gps_select ON public.localizacoes_gps FOR SELECT TO authenticated USING (public.vinculado_ao_transportador(transportador_id));
CREATE POLICY gps_insert_transportador ON public.localizacoes_gps FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = transportador_id AND EXISTS (SELECT 1 FROM public.viagens v WHERE v.id = localizacoes_gps.viagem_id AND v.transportador_id = (SELECT auth.uid())));
CREATE POLICY eventos_rota_select ON public.eventos_rota FOR SELECT TO authenticated USING (public.vinculado_ao_transportador(transportador_id));
CREATE POLICY eventos_rota_insert ON public.eventos_rota FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = transportador_id AND EXISTS (SELECT 1 FROM public.viagens v WHERE v.id = eventos_rota.viagem_id AND v.transportador_id = (SELECT auth.uid())));

-- registros_embarque_desembarque: viagem e aluno do próprio transportador
CREATE POLICY embarque_select ON public.registros_embarque_desembarque FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = registros_embarque_desembarque.aluno_id
         AND ((SELECT auth.uid()) = a.responsavel_id OR (SELECT auth.uid()) = a.transportador_id)));
CREATE POLICY embarque_insert_transportador ON public.registros_embarque_desembarque FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.viagens v WHERE v.id = registros_embarque_desembarque.viagem_id AND v.transportador_id = (SELECT auth.uid()))
          AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = registros_embarque_desembarque.aluno_id AND a.transportador_id = (SELECT auth.uid())));

-- calendario_escolar
CREATE POLICY calendario_select ON public.calendario_escolar FOR SELECT TO authenticated USING (public.vinculado_ao_transportador(transportador_id));
CREATE POLICY calendario_insert ON public.calendario_escolar FOR INSERT TO authenticated WITH CHECK (transportador_id = (SELECT auth.uid()));
CREATE POLICY calendario_update ON public.calendario_escolar FOR UPDATE TO authenticated
  USING (transportador_id = (SELECT auth.uid())) WITH CHECK (transportador_id = (SELECT auth.uid()));
CREATE POLICY calendario_delete ON public.calendario_escolar FOR DELETE TO authenticated USING (transportador_id = (SELECT auth.uid()));

-- financeiro: só leitura direta; escrita pelas funções (cadastrar/vincular_aluno, registrar_pagamento, confirmar_recebimento, cron)
CREATE POLICY contratos_select ON public.contratos_servico FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = responsavel_id OR (SELECT auth.uid()) = transportador_id);
CREATE POLICY mensalidades_select ON public.mensalidades FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = responsavel_id OR (SELECT auth.uid()) = transportador_id);
CREATE POLICY pagamentos_select ON public.pagamentos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mensalidades m WHERE m.id = pagamentos.mensalidade_id
         AND ((SELECT auth.uid()) = m.responsavel_id OR (SELECT auth.uid()) = m.transportador_id)));

-- mensagens
CREATE POLICY mensagens_select ON public.mensagens FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = transportador_id OR (SELECT auth.uid()) = responsavel_id);
CREATE POLICY mensagens_insert ON public.mensagens FOR INSERT TO authenticated
  WITH CHECK (remetente_id = (SELECT auth.uid()) AND (
    (origem = 'MOTORISTA' AND transportador_id = (SELECT auth.uid())
       AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.responsavel_id = mensagens.responsavel_id AND a.transportador_id = (SELECT auth.uid())))
    OR
    (origem = 'PAIS' AND responsavel_id = (SELECT auth.uid())
       AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.responsavel_id = (SELECT auth.uid()) AND a.transportador_id = mensagens.transportador_id))));

-- notificacoes / push_tokens
CREATE POLICY notificacoes_select ON public.notificacoes FOR SELECT TO authenticated USING ((SELECT auth.uid()) = usuario_id);
CREATE POLICY notificacoes_update ON public.notificacoes FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = usuario_id) WITH CHECK ((SELECT auth.uid()) = usuario_id);
CREATE POLICY push_tokens_select ON public.push_tokens FOR SELECT TO authenticated USING ((SELECT auth.uid()) = usuario_id);
CREATE POLICY push_tokens_delete ON public.push_tokens FOR DELETE TO authenticated USING ((SELECT auth.uid()) = usuario_id);

-- ---------------------------------------------------------------- 3. Funções: ninguém anônimo executa; internas só do sistema
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig, p.proname FROM pg_proc p
           WHERE p.pronamespace = 'public'::regnamespace AND p.prokind = 'f'
             AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e') -- ignora funções do PostGIS
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
    -- RPCs do app e funções usadas dentro das policies (a policy roda com o privilégio de quem consulta)
    IF f.proname IN ('buscar_transportador_por_codigo', 'cadastrar_aluno', 'confirmar_recebimento', 'dados_recebimento',
                     'registrar_pagamento', 'registrar_push_token', 'renovar_codigo_convite', 'desvincular_aluno',
                     'vincular_aluno', 'excluir_minha_conta', 'relacionado_com', 'vinculado_ao_transportador') THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
    END IF;
  END LOOP;
END $$;
