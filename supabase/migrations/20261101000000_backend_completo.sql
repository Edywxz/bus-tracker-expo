-- ==============================================================================
-- VanEscolar GPS — Migração do back-end completo
-- Rode DEPOIS de supabase/schema.sql (SQL Editor do Supabase ou `supabase db push`).
-- Idempotente: pode ser executada mais de uma vez.
-- Atores: apenas Responsável e Transportador. A escola é só o destino da rota
-- (campos escola_nome / escola_endereco do aluno), não um usuário.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Transição de escopo: remove a Instituição de Ensino de bancos criados com o
--    schema antigo (no-op num banco novo)
-- ------------------------------------------------------------------------------
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS escola_nome VARCHAR(150);
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS escola_endereco TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'calendario_escolar' AND column_name = 'instituicao_id') THEN
    DROP TABLE public.calendario_escolar;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'instituicoes_ensino') THEN
    UPDATE public.alunos a SET escola_nome = COALESCE(a.escola_nome, i.razao_social),
                               escola_endereco = COALESCE(a.escola_endereco, i.endereco)
    FROM public.instituicoes_ensino i WHERE i.id = a.instituicao_id;
  END IF;
END $$;
ALTER TABLE public.alunos DROP COLUMN IF EXISTS instituicao_id;
DROP TABLE IF EXISTS public.instituicoes_ensino CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'tipo_usuario_enum' AND e.enumlabel = 'INSTITUICAO') THEN
    IF EXISTS (SELECT 1 FROM public.perfis WHERE tipo_usuario::text = 'INSTITUICAO') THEN
      RAISE EXCEPTION 'Existem contas de instituição em perfis; remova-as (Authentication → Users) antes de migrar';
    END IF;
    ALTER TYPE public.tipo_usuario_enum RENAME TO tipo_usuario_enum_old;
    CREATE TYPE public.tipo_usuario_enum AS ENUM ('RESPONSAVEL', 'TRANSPORTADOR');
    ALTER TABLE public.perfis ALTER COLUMN tipo_usuario TYPE public.tipo_usuario_enum
      USING tipo_usuario::text::public.tipo_usuario_enum;
    DROP TYPE public.tipo_usuario_enum_old;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 1. Cadastro em duas etapas: o app cria a conta primeiro e completa os dados depois
-- ------------------------------------------------------------------------------
ALTER TABLE public.perfis               ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.perfis               ALTER COLUMN telefone DROP NOT NULL;
ALTER TABLE public.responsaveis         ALTER COLUMN endereco_residencial DROP NOT NULL;
ALTER TABLE public.transportadores      ALTER COLUMN cnh DROP NOT NULL;
ALTER TABLE public.transportadores      ALTER COLUMN categoria_cnh DROP NOT NULL;
ALTER TABLE public.transportadores      ALTER COLUMN alvara_autonomo DROP NOT NULL;

-- Código de convite: o transportador compartilha; os pais usam para se vincular
ALTER TABLE public.transportadores
  ADD COLUMN IF NOT EXISTS codigo_convite VARCHAR(8) UNIQUE
    DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  ADD COLUMN IF NOT EXISTS valor_mensalidade_padrao NUMERIC(10,2) DEFAULT 350.00,
  ADD COLUMN IF NOT EXISTS dia_vencimento_padrao INT DEFAULT 10 CHECK (dia_vencimento_padrao BETWEEN 1 AND 28);

UPDATE public.transportadores SET codigo_convite = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)) WHERE codigo_convite IS NULL;

-- ------------------------------------------------------------------------------
-- 2. Novas tabelas: notificações, chat, calendário (dias sem serviço do transportador)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('CHEGANDO','EMBARQUE','PAGAMENTO','EMERGENCIA','AVISO')),
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON public.notificacoes(usuario_id, criado_em DESC);

-- Canal de conversa = um por transportador (ele e os pais dos seus alunos)
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    remetente_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    remetente_nome VARCHAR(150) NOT NULL,
    origem VARCHAR(10) NOT NULL CHECK (origem IN ('PAIS','MOTORISTA')),
    texto TEXT NOT NULL CHECK (length(trim(texto)) > 0),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mensagens_canal ON public.mensagens(transportador_id, criado_em);
DELETE FROM public.mensagens WHERE origem NOT IN ('PAIS','MOTORISTA');
ALTER TABLE public.mensagens DROP CONSTRAINT IF EXISTS mensagens_origem_check;
ALTER TABLE public.mensagens ADD CONSTRAINT mensagens_origem_check CHECK (origem IN ('PAIS','MOTORISTA'));
-- Conversa privada: cada thread é entre o motorista e UM responsável (um responsável nunca lê a conversa de outro).
ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE;
DELETE FROM public.mensagens WHERE responsavel_id IS NULL; -- mensagens do antigo canal em grupo não têm dono
ALTER TABLE public.mensagens ALTER COLUMN responsavel_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mensagens_thread ON public.mensagens(transportador_id, responsavel_id, criado_em);
-- Coordenadas opcionais do aluno (casa e entrega), usadas para indicar a chegada ao endereço mais próximo.
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS entrega_latitude DOUBLE PRECISION;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS entrega_longitude DOUBLE PRECISION;

-- Calendário do transportador: feriados, recessos e dias sem aula em que a van não roda (RF019)

CREATE TABLE IF NOT EXISTS public.calendario_escolar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    tipo VARCHAR(10) NOT NULL DEFAULT 'EVENTO' CHECK (tipo IN ('LETIVO','FERIADO','RECESSO','EVENTO')),
    descricao TEXT
);
CREATE INDEX IF NOT EXISTS idx_calendario_transportador ON public.calendario_escolar(transportador_id, data);

ALTER TABLE public.notificacoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_escolar ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. Funções auxiliares (SECURITY DEFINER evita recursão de RLS)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vinculado_ao_transportador(p_transportador UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_transportador = auth.uid() OR EXISTS (
    SELECT 1 FROM public.alunos a
    WHERE a.transportador_id = p_transportador
      AND a.ativo
      AND a.responsavel_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.relacionado_com(p_outro UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_outro = auth.uid() OR EXISTS (
    SELECT 1 FROM public.alunos a
    WHERE (a.responsavel_id = auth.uid()   AND p_outro = a.transportador_id)
       OR (a.transportador_id = auth.uid() AND p_outro = a.responsavel_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.notificar(p_usuario UUID, p_tipo TEXT, p_titulo TEXT, p_mensagem TEXT)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem)
  VALUES (p_usuario, p_tipo, p_titulo, p_mensagem);
$$;
REVOKE ALL ON FUNCTION public.notificar(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4. Criação automática do perfil ao cadastrar (usa raw_user_meta_data do app)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_tipo public.tipo_usuario_enum :=
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'tipo_usuario', ''), 'RESPONSAVEL')::public.tipo_usuario_enum;
  v_nome TEXT := COALESCE(NULLIF(NEW.raw_user_meta_data->>'nome', ''), split_part(NEW.email, '@', 1));
BEGIN
  INSERT INTO public.perfis (id, nome, email, telefone, tipo_usuario)
  VALUES (NEW.id, v_nome, NEW.email, NULLIF(NEW.raw_user_meta_data->>'telefone', ''), v_tipo);

  IF v_tipo = 'RESPONSAVEL' THEN
    INSERT INTO public.responsaveis (id) VALUES (NEW.id);
  ELSE
    INSERT INTO public.transportadores (id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5. RPCs chamadas pelo app
-- ------------------------------------------------------------------------------

-- Pais confirmam "Tio Marcos" antes de se vincular
CREATE OR REPLACE FUNCTION public.buscar_transportador_por_codigo(p_codigo TEXT)
RETURNS TABLE (id UUID, nome TEXT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT t.id, p.nome::TEXT
  FROM public.transportadores t JOIN public.perfis p ON p.id = t.id
  WHERE t.codigo_convite = upper(trim(p_codigo)) AND p.ativo AND auth.uid() IS NOT NULL;
$$;

-- Cadastra o aluno (com a escola que frequenta), vincula ao transportador,
-- cria o contrato e gera as mensalidades do ano.
DROP FUNCTION IF EXISTS public.cadastrar_aluno(TEXT, DATE, TEXT, TEXT, public.turno_enum, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.cadastrar_aluno(
  p_nome TEXT, p_data_nascimento DATE, p_documento TEXT, p_turma TEXT, p_turno public.turno_enum,
  p_endereco_busca TEXT, p_endereco_entrega TEXT, p_observacoes TEXT,
  p_codigo_transportador TEXT, p_escola_nome TEXT DEFAULT NULL, p_escola_endereco TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_resp UUID := auth.uid();
  v_transp public.transportadores%ROWTYPE;
  v_aluno UUID;
  v_contrato UUID;
  v_ano INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.responsaveis WHERE id = v_resp) THEN
    RAISE EXCEPTION 'Apenas responsáveis podem cadastrar alunos' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_transp FROM public.transportadores WHERE codigo_convite = upper(trim(p_codigo_transportador));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código do transportador inválido' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.alunos (responsavel_id, transportador_id, escola_nome, escola_endereco, nome, data_nascimento, documento,
                             turma, turno, endereco_busca, endereco_entrega, observacoes_medicas)
  VALUES (v_resp, v_transp.id, NULLIF(trim(p_escola_nome), ''), NULLIF(trim(p_escola_endereco), ''), p_nome, p_data_nascimento, COALESCE(NULLIF(p_documento, ''), '-'),
          p_turma, p_turno, p_endereco_busca, p_endereco_entrega, NULLIF(p_observacoes, ''))
  RETURNING id INTO v_aluno;

  INSERT INTO public.contratos_servico (numero_contrato, transportador_id, responsavel_id, aluno_id,
                                        valor_mensalidade, dia_vencimento, data_inicio, data_termino, termos_condicoes)
  VALUES ('VE-' || v_ano || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
          v_transp.id, v_resp, v_aluno, v_transp.valor_mensalidade_padrao, v_transp.dia_vencimento_padrao,
          CURRENT_DATE, make_date(v_ano, 12, 31),
          'Prestação de serviço de transporte escolar conforme combinado entre as partes. Mensalidade com vencimento mensal; atraso sujeito a multa e juros.')
  RETURNING id INTO v_contrato;

  INSERT INTO public.mensalidades (contrato_id, responsavel_id, transportador_id, mes_referencia, ano_referencia, valor, data_vencimento)
  SELECT v_contrato, v_resp, v_transp.id, m, v_ano, v_transp.valor_mensalidade_padrao,
         make_date(v_ano, m, v_transp.dia_vencimento_padrao)
  FROM generate_series(EXTRACT(MONTH FROM CURRENT_DATE)::INT, 12) AS m;

  PERFORM public.notificar(v_transp.id, 'AVISO', 'Novo aluno vinculado',
                           p_nome || ' foi adicionado à sua rota.');
  RETURN v_aluno;
END;
$$;

-- Pagamento em duas etapas (sem gateway):
--   1) o responsável INFORMA o pagamento  -> registrar_pagamento  (fica PENDENTE)
--   2) o transportador CONFIRMA o recebimento -> confirmar_recebimento (mensalidade vira PAGO)
-- Assim ninguém marca uma mensalidade como paga sem o recebedor confirmar.
-- Para cobrança automática, chame confirmar a partir do webhook do seu PSP (service role).
CREATE OR REPLACE FUNCTION public.registrar_pagamento(
  p_mensalidade UUID, p_metodo public.metodo_pagamento_enum, p_transacao TEXT, p_detalhes JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  m public.mensalidades%ROWTYPE;
  v_pagamento UUID;
BEGIN
  SELECT * INTO m FROM public.mensalidades WHERE id = p_mensalidade FOR UPDATE;
  IF NOT FOUND OR m.responsavel_id <> auth.uid() THEN
    RAISE EXCEPTION 'Mensalidade não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF m.status = 'PAGO' THEN
    RAISE EXCEPTION 'Mensalidade já paga' USING ERRCODE = '23505';
  END IF;
  IF EXISTS (SELECT 1 FROM public.pagamentos WHERE mensalidade_id = m.id AND status = 'PENDENTE') THEN
    RAISE EXCEPTION 'Já existe um pagamento aguardando confirmação' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.pagamentos (mensalidade_id, metodo, valor_pago, transacao_id, detalhes_metodo, status)
  VALUES (m.id, p_metodo, m.valor + COALESCE(m.valor_multa_juros, 0), p_transacao, p_detalhes, 'PENDENTE')
  RETURNING id INTO v_pagamento;

  PERFORM public.notificar(m.transportador_id, 'PAGAMENTO', 'Pagamento informado',
    'Mensalidade ' || lpad(m.mes_referencia::TEXT, 2, '0') || '/' || m.ano_referencia
    || ' (' || p_metodo || '). Confirme o recebimento em Financeiro.');
  RETURN v_pagamento;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirmar_recebimento(p_pagamento UUID, p_aceitar BOOLEAN DEFAULT TRUE)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  pg public.pagamentos%ROWTYPE;
  m public.mensalidades%ROWTYPE;
BEGIN
  SELECT * INTO pg FROM public.pagamentos WHERE id = p_pagamento FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pagamento não encontrado' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO m FROM public.mensalidades WHERE id = pg.mensalidade_id FOR UPDATE;
  IF m.transportador_id <> auth.uid() THEN
    RAISE EXCEPTION 'Apenas o transportador pode confirmar' USING ERRCODE = '42501';
  END IF;
  IF pg.status <> 'PENDENTE' THEN
    RAISE EXCEPTION 'Pagamento já processado' USING ERRCODE = '23505';
  END IF;

  IF p_aceitar THEN
    UPDATE public.pagamentos SET status = 'CONFIRMADO' WHERE id = pg.id;
    UPDATE public.mensalidades SET status = 'PAGO' WHERE id = m.id;
    PERFORM public.notificar(m.responsavel_id, 'PAGAMENTO', 'Pagamento confirmado',
      'Mensalidade ' || lpad(m.mes_referencia::TEXT, 2, '0') || '/' || m.ano_referencia || ' confirmada. Obrigado!');
  ELSE
    UPDATE public.pagamentos SET status = 'ESTORNADO' WHERE id = pg.id;
    PERFORM public.notificar(m.responsavel_id, 'PAGAMENTO', 'Pagamento não identificado',
      'Não localizamos o pagamento de ' || lpad(m.mes_referencia::TEXT, 2, '0') || '/' || m.ano_referencia || '. Fale com o transportador.');
  END IF;
END;
$$;

-- Marca vencidas as mensalidades em atraso (chame via pg_cron diariamente, ver README)
CREATE OR REPLACE FUNCTION public.atualizar_mensalidades_vencidas()
RETURNS INT LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  WITH x AS (
    UPDATE public.mensalidades SET status = 'VENCIDO'
    WHERE status = 'PENDENTE' AND data_vencimento < CURRENT_DATE RETURNING 1
  ) SELECT count(*)::INT FROM x;
$$;
REVOKE ALL ON FUNCTION public.atualizar_mensalidades_vencidas() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.buscar_transportador_por_codigo(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cadastrar_aluno(TEXT, DATE, TEXT, TEXT, public.turno_enum, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_pagamento(UUID, public.metodo_pagamento_enum, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_recebimento(UUID, BOOLEAN) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. Notificações automáticas (gatilhos)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_notificar_embarque() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE a public.alunos%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.alunos WHERE id = NEW.aluno_id;
  PERFORM public.notificar(a.responsavel_id, 'EMBARQUE',
    CASE NEW.tipo WHEN 'EMBARQUE' THEN 'Embarque confirmado' ELSE 'Desembarque concluído' END,
    a.nome || CASE NEW.tipo WHEN 'EMBARQUE' THEN ' embarcou na van às ' ELSE ' chegou ao destino às ' END
      || to_char(NEW.data_hora AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') || '.');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_embarque_notifica ON public.registros_embarque_desembarque;
CREATE TRIGGER trg_embarque_notifica AFTER INSERT ON public.registros_embarque_desembarque
  FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_embarque();

CREATE OR REPLACE FUNCTION public.trg_notificar_evento_rota() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r UUID;
BEGIN
  FOR r IN SELECT DISTINCT responsavel_id FROM public.alunos
           WHERE transportador_id = NEW.transportador_id AND ativo LOOP
    PERFORM public.notificar(r, CASE WHEN NEW.severidade IN ('ALTA','EMERGENCIA') THEN 'EMERGENCIA' ELSE 'AVISO' END,
      'Alerta de rota: ' || NEW.tipo, NEW.descricao);
  END LOOP;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_evento_rota_notifica ON public.eventos_rota;
CREATE TRIGGER trg_evento_rota_notifica AFTER INSERT ON public.eventos_rota
  FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_evento_rota();

CREATE OR REPLACE FUNCTION public.trg_notificar_viagem() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r UUID;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('EM_ANDAMENTO','CONCLUIDA') THEN
    FOR r IN SELECT DISTINCT responsavel_id FROM public.alunos WHERE transportador_id = NEW.transportador_id AND ativo LOOP
      PERFORM public.notificar(r, 'AVISO',
        CASE NEW.status WHEN 'EM_ANDAMENTO' THEN 'Rota iniciada' ELSE 'Rota concluída' END,
        CASE NEW.status WHEN 'EM_ANDAMENTO' THEN 'O transportador iniciou o trajeto. Acompanhe a van em tempo real.'
                        ELSE 'O trajeto foi finalizado com segurança.' END);
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_viagem_notifica ON public.viagens;
CREATE TRIGGER trg_viagem_notifica AFTER UPDATE ON public.viagens
  FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_viagem();

CREATE OR REPLACE FUNCTION public.trg_notificar_ausencia() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_nome TEXT;
BEGIN
  SELECT nome INTO v_nome FROM public.alunos WHERE id = NEW.aluno_id;
  PERFORM public.notificar(NEW.transportador_id, 'AVISO', 'Falta comunicada',
    v_nome || ' não utilizará o transporte (' || NEW.periodo || '). ' || COALESCE(NEW.motivo, ''));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_ausencia_notifica ON public.comunicados_ausencia;
CREATE TRIGGER trg_ausencia_notifica AFTER INSERT ON public.comunicados_ausencia
  FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_ausencia();

-- ------------------------------------------------------------------------------
-- 7. Políticas RLS (substitui as permissivas do schema.sql)
-- ------------------------------------------------------------------------------
-- perfis: o próprio usuário edita; vê nome de quem está vinculado a ele
DROP POLICY IF EXISTS "Perfis visiveis pelos proprios usuarios" ON public.perfis;
DROP POLICY IF EXISTS "perfis_select" ON public.perfis;
DROP POLICY IF EXISTS "perfis_update_proprio" ON public.perfis;
CREATE POLICY "perfis_select" ON public.perfis FOR SELECT USING (public.relacionado_com(id));
CREATE POLICY "perfis_update_proprio" ON public.perfis FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- especializações: somente o dono
DROP POLICY IF EXISTS "responsaveis_proprio" ON public.responsaveis;
CREATE POLICY "responsaveis_proprio" ON public.responsaveis FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "transportadores_proprio" ON public.transportadores;
CREATE POLICY "transportadores_proprio" ON public.transportadores FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- alunos: cadastro só via RPC cadastrar_aluno
DROP POLICY IF EXISTS "Acesso de alunos por responsavel ou transportador" ON public.alunos;
DROP POLICY IF EXISTS "alunos_select" ON public.alunos;
CREATE POLICY "alunos_select" ON public.alunos FOR SELECT
  USING (auth.uid() IN (responsavel_id, transportador_id));
DROP POLICY IF EXISTS "alunos_update_responsavel" ON public.alunos;
CREATE POLICY "alunos_update_responsavel" ON public.alunos FOR UPDATE
  USING (auth.uid() = responsavel_id) WITH CHECK (auth.uid() = responsavel_id);

DROP POLICY IF EXISTS "pessoas_autorizadas_responsavel" ON public.pessoas_autorizadas;
CREATE POLICY "pessoas_autorizadas_responsavel" ON public.pessoas_autorizadas FOR ALL
  USING (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.responsavel_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.responsavel_id = auth.uid()));
DROP POLICY IF EXISTS "pessoas_autorizadas_transportador" ON public.pessoas_autorizadas;
CREATE POLICY "pessoas_autorizadas_transportador" ON public.pessoas_autorizadas FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.transportador_id = auth.uid()));

DROP POLICY IF EXISTS "ausencia_insert_responsavel" ON public.comunicados_ausencia;
CREATE POLICY "ausencia_insert_responsavel" ON public.comunicados_ausencia FOR INSERT
  WITH CHECK (responsavel_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.responsavel_id = auth.uid()
                AND a.transportador_id = comunicados_ausencia.transportador_id));
DROP POLICY IF EXISTS "ausencia_select" ON public.comunicados_ausencia;
CREATE POLICY "ausencia_select" ON public.comunicados_ausencia FOR SELECT
  USING (auth.uid() IN (responsavel_id, transportador_id));

-- frota e viagens
DROP POLICY IF EXISTS "veiculos_transportador" ON public.veiculos;
CREATE POLICY "veiculos_transportador" ON public.veiculos FOR ALL
  USING (auth.uid() = transportador_id) WITH CHECK (auth.uid() = transportador_id);
DROP POLICY IF EXISTS "veiculos_vinculados_select" ON public.veiculos;
CREATE POLICY "veiculos_vinculados_select" ON public.veiculos FOR SELECT USING (public.vinculado_ao_transportador(transportador_id));

DROP POLICY IF EXISTS "Viagens visiveis pelo transportador ou responsavel" ON public.viagens;
DROP POLICY IF EXISTS "viagens_select" ON public.viagens;
CREATE POLICY "viagens_select" ON public.viagens FOR SELECT USING (public.vinculado_ao_transportador(transportador_id));
DROP POLICY IF EXISTS "viagens_escrita_transportador" ON public.viagens;
CREATE POLICY "viagens_escrita_transportador" ON public.viagens FOR ALL
  USING (auth.uid() = transportador_id) WITH CHECK (auth.uid() = transportador_id);

DROP POLICY IF EXISTS "Rastreamento GPS autorizado" ON public.localizacoes_gps;
DROP POLICY IF EXISTS "gps_select" ON public.localizacoes_gps;
CREATE POLICY "gps_select" ON public.localizacoes_gps FOR SELECT USING (public.vinculado_ao_transportador(transportador_id));
DROP POLICY IF EXISTS "gps_insert_transportador" ON public.localizacoes_gps;
CREATE POLICY "gps_insert_transportador" ON public.localizacoes_gps FOR INSERT WITH CHECK (auth.uid() = transportador_id);

DROP POLICY IF EXISTS "embarque_insert_transportador" ON public.registros_embarque_desembarque;
CREATE POLICY "embarque_insert_transportador" ON public.registros_embarque_desembarque FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.viagens v WHERE v.id = viagem_id AND v.transportador_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id AND a.transportador_id = auth.uid()));
DROP POLICY IF EXISTS "embarque_select" ON public.registros_embarque_desembarque;
CREATE POLICY "embarque_select" ON public.registros_embarque_desembarque FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = aluno_id
                 AND auth.uid() IN (a.responsavel_id, a.transportador_id)));

DROP POLICY IF EXISTS "eventos_rota_insert" ON public.eventos_rota;
CREATE POLICY "eventos_rota_insert" ON public.eventos_rota FOR INSERT WITH CHECK (auth.uid() = transportador_id);
DROP POLICY IF EXISTS "eventos_rota_select" ON public.eventos_rota;
CREATE POLICY "eventos_rota_select" ON public.eventos_rota FOR SELECT USING (public.vinculado_ao_transportador(transportador_id));

-- financeiro: pais NÃO atualizam mensalidade diretamente (só via registrar_pagamento)
DROP POLICY IF EXISTS "Mensalidades seguras" ON public.mensalidades;
DROP POLICY IF EXISTS "mensalidades_select" ON public.mensalidades;
CREATE POLICY "mensalidades_select" ON public.mensalidades FOR SELECT USING (auth.uid() IN (responsavel_id, transportador_id));
DROP POLICY IF EXISTS "mensalidades_update_transportador" ON public.mensalidades;
CREATE POLICY "mensalidades_update_transportador" ON public.mensalidades FOR UPDATE
  USING (auth.uid() = transportador_id) WITH CHECK (auth.uid() = transportador_id);

DROP POLICY IF EXISTS "contratos_select" ON public.contratos_servico;
CREATE POLICY "contratos_select" ON public.contratos_servico FOR SELECT USING (auth.uid() IN (responsavel_id, transportador_id));

DROP POLICY IF EXISTS "pagamentos_select" ON public.pagamentos;
CREATE POLICY "pagamentos_select" ON public.pagamentos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.mensalidades m WHERE m.id = mensalidade_id
                 AND auth.uid() IN (m.responsavel_id, m.transportador_id)));

-- novas tabelas
DROP POLICY IF EXISTS "notificacoes_proprias_select" ON public.notificacoes;
CREATE POLICY "notificacoes_proprias_select" ON public.notificacoes FOR SELECT USING (auth.uid() = usuario_id);
DROP POLICY IF EXISTS "notificacoes_proprias_update" ON public.notificacoes;
CREATE POLICY "notificacoes_proprias_update" ON public.notificacoes FOR UPDATE
  USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "mensagens_select" ON public.mensagens;
CREATE POLICY "mensagens_select" ON public.mensagens FOR SELECT USING (auth.uid() = transportador_id OR auth.uid() = responsavel_id);
DROP POLICY IF EXISTS "mensagens_insert" ON public.mensagens;
CREATE POLICY "mensagens_insert" ON public.mensagens FOR INSERT WITH CHECK (
  remetente_id = auth.uid() AND (
    (origem = 'MOTORISTA' AND transportador_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.responsavel_id = mensagens.responsavel_id AND a.transportador_id = auth.uid()))
    OR (origem = 'PAIS' AND responsavel_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.responsavel_id = auth.uid() AND a.transportador_id = mensagens.transportador_id))
  )
);

DROP POLICY IF EXISTS "calendario_select" ON public.calendario_escolar;
CREATE POLICY "calendario_select" ON public.calendario_escolar FOR SELECT
  USING (public.vinculado_ao_transportador(transportador_id));
DROP POLICY IF EXISTS "calendario_escrita_escola" ON public.calendario_escolar;
DROP POLICY IF EXISTS "calendario_escrita_transportador" ON public.calendario_escolar;
CREATE POLICY "calendario_escrita_transportador" ON public.calendario_escolar FOR ALL
  USING (transportador_id = auth.uid()) WITH CHECK (transportador_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 8. Tempo real
-- ------------------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['notificacoes','mensagens','viagens','registros_embarque_desembarque','localizacoes_gps','pagamentos'] LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 9. Dados de recebimento do transportador (chave PIX visível só para quem é vinculado)
-- ------------------------------------------------------------------------------
ALTER TABLE public.transportadores ADD COLUMN IF NOT EXISTS chave_pix TEXT;

CREATE OR REPLACE FUNCTION public.dados_recebimento(p_transportador UUID)
RETURNS TABLE (nome TEXT, chave_pix TEXT, valor_mensalidade NUMERIC, dia_vencimento INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.nome::TEXT, t.chave_pix, t.valor_mensalidade_padrao, t.dia_vencimento_padrao
  FROM public.transportadores t JOIN public.perfis p ON p.id = t.id
  WHERE t.id = p_transportador AND public.vinculado_ao_transportador(p_transportador);
$$;
GRANT EXECUTE ON FUNCTION public.dados_recebimento(UUID) TO authenticated;

-- O papel authenticated precisa de privilégios nas tabelas; a RLS (ligada em todas) decide as linhas.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.alunos, public.calendario_escolar, public.comunicados_ausencia, public.contratos_servico, public.eventos_rota,
  public.localizacoes_gps, public.mensagens, public.mensalidades, public.notificacoes, public.pagamentos, public.perfis,
  public.pessoas_autorizadas, public.registros_embarque_desembarque, public.responsaveis, public.transportadores,
  public.veiculos, public.viagens
TO authenticated;
