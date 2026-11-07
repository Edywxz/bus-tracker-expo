-- Endereços pertencem ao RESPONSÁVEL (dado do adulto, informado por ele). O aluno apenas aponta para eles.
-- Coordenadas vêm de geocodificação única (Edge Function geocode-endereco) ou de pino ajustado à mão.

CREATE TABLE IF NOT EXISTS public.enderecos_responsavel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsavel_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  rotulo VARCHAR(40),
  endereco_texto TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  precisao VARCHAR(10) CHECK (precisao IN ('NUMERO','RUA','CEP','MANUAL')),
  origem VARCHAR(15) CHECK (origem IN ('GEOAPIFY','CEP','MANUAL')),
  ajustado_manual BOOLEAN NOT NULL DEFAULT FALSE, -- pino confirmado pelo responsável: nunca sobrescrever
  geocodificado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT enderecos_coord_par CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CONSTRAINT enderecos_coord_faixa CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_enderecos_resp_texto ON public.enderecos_responsavel (responsavel_id, lower(btrim(endereco_texto)));

ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS endereco_busca_id UUID REFERENCES public.enderecos_responsavel(id) ON DELETE SET NULL;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS endereco_entrega_id UUID REFERENCES public.enderecos_responsavel(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_alunos_endereco_busca ON public.alunos(endereco_busca_id);
CREATE INDEX IF NOT EXISTS idx_alunos_endereco_entrega ON public.alunos(endereco_entrega_id);
-- as coordenadas não ficam mais no aluno
ALTER TABLE public.alunos DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude,
                          DROP COLUMN IF EXISTS entrega_latitude, DROP COLUMN IF EXISTS entrega_longitude;

ALTER TABLE public.enderecos_responsavel ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enderecos_select" ON public.enderecos_responsavel;
CREATE POLICY "enderecos_select" ON public.enderecos_responsavel FOR SELECT USING (
  auth.uid() = responsavel_id
  OR EXISTS (SELECT 1 FROM public.alunos a WHERE a.transportador_id = auth.uid()
             AND (a.endereco_busca_id = enderecos_responsavel.id OR a.endereco_entrega_id = enderecos_responsavel.id))
);
DROP POLICY IF EXISTS "enderecos_insert" ON public.enderecos_responsavel;
CREATE POLICY "enderecos_insert" ON public.enderecos_responsavel FOR INSERT WITH CHECK (auth.uid() = responsavel_id);
DROP POLICY IF EXISTS "enderecos_update" ON public.enderecos_responsavel;
CREATE POLICY "enderecos_update" ON public.enderecos_responsavel FOR UPDATE USING (auth.uid() = responsavel_id) WITH CHECK (auth.uid() = responsavel_id);
DROP POLICY IF EXISTS "enderecos_delete" ON public.enderecos_responsavel;
CREATE POLICY "enderecos_delete" ON public.enderecos_responsavel FOR DELETE USING (auth.uid() = responsavel_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enderecos_responsavel TO authenticated;

-- cadastrar_aluno agora aceita os ids dos endereços do responsável (opcionais)
DROP FUNCTION IF EXISTS public.cadastrar_aluno(TEXT, DATE, TEXT, TEXT, public.turno_enum, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.cadastrar_aluno(
  p_nome TEXT, p_data_nascimento DATE, p_documento TEXT, p_turma TEXT, p_turno public.turno_enum,
  p_endereco_busca TEXT, p_endereco_entrega TEXT, p_observacoes TEXT,
  p_codigo_transportador TEXT, p_escola_nome TEXT DEFAULT NULL, p_escola_endereco TEXT DEFAULT NULL,
  p_endereco_busca_id UUID DEFAULT NULL, p_endereco_entrega_id UUID DEFAULT NULL
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
  IF (p_endereco_busca_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.enderecos_responsavel WHERE id = p_endereco_busca_id AND responsavel_id = v_resp))
     OR (p_endereco_entrega_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.enderecos_responsavel WHERE id = p_endereco_entrega_id AND responsavel_id = v_resp)) THEN
    RAISE EXCEPTION 'Endereço inválido' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_transp FROM public.transportadores WHERE codigo_convite = upper(trim(p_codigo_transportador));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código do transportador inválido' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.alunos (responsavel_id, transportador_id, escola_nome, escola_endereco, nome, data_nascimento, documento,
                             turma, turno, endereco_busca, endereco_entrega, endereco_busca_id, endereco_entrega_id, observacoes_medicas)
  VALUES (v_resp, v_transp.id, NULLIF(trim(p_escola_nome), ''), NULLIF(trim(p_escola_endereco), ''), p_nome, p_data_nascimento, COALESCE(NULLIF(p_documento, ''), '-'),
          p_turma, p_turno, p_endereco_busca, p_endereco_entrega, p_endereco_busca_id, p_endereco_entrega_id, NULLIF(p_observacoes, ''))
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
GRANT EXECUTE ON FUNCTION public.cadastrar_aluno(TEXT, DATE, TEXT, TEXT, public.turno_enum, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;

-- Edge Functions usam service_role (ignora RLS, mas precisa de privilégio na tabela).
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.alunos, public.calendario_escolar, public.comunicados_ausencia, public.contratos_servico, public.eventos_rota,
  public.localizacoes_gps, public.mensagens, public.mensalidades, public.notificacoes, public.pagamentos, public.perfis,
  public.pessoas_autorizadas, public.registros_embarque_desembarque, public.responsaveis, public.transportadores,
  public.veiculos, public.viagens, public.enderecos_responsavel
TO service_role;
