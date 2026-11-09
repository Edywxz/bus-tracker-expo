-- ==============================================================================
-- VANESCOLAR GPS — SNAPSHOT DO SCHEMA (SUPABASE/POSTGRESQL)
-- Espelha o banco real (projeto VanEscolar) em 09/11/2026.
-- Referência de leitura: a fonte de verdade são as migrations em supabase/migrations/.
-- Não inclui GRANTs (ver migrations *_grants_*.sql).
-- ==============================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_net;          -- chamada HTTP do push (trg_notificacao_push)
CREATE EXTENSION IF NOT EXISTS supabase_vault;  -- segredos push_function_url / push_webhook_secret

-- 2. Enums
CREATE TYPE tipo_usuario_enum       AS ENUM ('RESPONSAVEL', 'TRANSPORTADOR');
CREATE TYPE turno_enum              AS ENUM ('MANHA', 'TARDE', 'INTEGRAL', 'NOITE');
CREATE TYPE tipo_viagem_enum        AS ENUM ('IDA', 'VOLTA');
CREATE TYPE status_viagem_enum      AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');
CREATE TYPE tipo_embarque_enum      AS ENUM ('EMBARQUE', 'DESEMBARQUE');
CREATE TYPE status_contrato_enum    AS ENUM ('ATIVO', 'SUSPENSO', 'CANCELADO', 'ENCERRADO');
CREATE TYPE status_mensalidade_enum AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO');
CREATE TYPE metodo_pagamento_enum   AS ENUM ('PIX', 'CARTAO', 'BOLETO');
CREATE TYPE periodo_ausencia_enum   AS ENUM ('IDA', 'VOLTA', 'AMBOS');

-- ==============================================================================
-- 3. USUÁRIOS E PERFIS (RF001, RF010, RF014, RF021)
-- ==============================================================================

CREATE TABLE public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    tipo_usuario tipo_usuario_enum NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.responsaveis (
    id UUID PRIMARY KEY REFERENCES public.perfis(id) ON DELETE CASCADE,
    endereco_residencial TEXT
);

CREATE TABLE public.transportadores (
    id UUID PRIMARY KEY REFERENCES public.perfis(id) ON DELETE CASCADE,
    cnh VARCHAR(20),
    categoria_cnh VARCHAR(5),
    numero_credencial VARCHAR(50),
    alvara_autonomo VARCHAR(50),
    foto_url TEXT,
    codigo_convite VARCHAR(8) UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
    valor_mensalidade_padrao NUMERIC(10,2) DEFAULT 350.00,
    dia_vencimento_padrao INT DEFAULT 10 CHECK (dia_vencimento_padrao BETWEEN 1 AND 28),
    chave_pix TEXT
);

-- Endereços do RESPONSÁVEL (dado do adulto); o aluno aponta para eles
CREATE TABLE public.enderecos_responsavel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    responsavel_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    rotulo VARCHAR(40),
    endereco_texto TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    precisao VARCHAR(10) CHECK (precisao IN ('NUMERO', 'RUA', 'CEP', 'MANUAL')),
    origem VARCHAR(15) CHECK (origem IN ('GEOAPIFY', 'CEP', 'MANUAL')),
    ajustado_manual BOOLEAN NOT NULL DEFAULT FALSE,
    geocodificado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((latitude IS NULL) = (longitude IS NULL)),
    CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);
CREATE UNIQUE INDEX uq_enderecos_resp_texto ON public.enderecos_responsavel (responsavel_id, lower(btrim(endereco_texto)));

-- ==============================================================================
-- 4. ALUNOS E SEGURANÇA (RF002, RF009, RF017, RF018)
-- ==============================================================================

CREATE TABLE public.alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE RESTRICT,
    nome VARCHAR(150) NOT NULL,
    data_nascimento DATE NOT NULL,
    documento VARCHAR(20) NOT NULL,
    turma VARCHAR(50),
    turno turno_enum NOT NULL,
    endereco_busca TEXT NOT NULL,
    endereco_entrega TEXT NOT NULL,
    observacoes_medicas TEXT,
    foto_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    -- escola é só o destino da rota, não um usuário do sistema
    escola_nome VARCHAR(150),
    escola_endereco TEXT,
    endereco_busca_id UUID REFERENCES public.enderecos_responsavel(id) ON DELETE SET NULL,
    endereco_entrega_id UUID REFERENCES public.enderecos_responsavel(id) ON DELETE SET NULL
);
CREATE INDEX idx_alunos_endereco_busca ON public.alunos (endereco_busca_id);
CREATE INDEX idx_alunos_endereco_entrega ON public.alunos (endereco_entrega_id);

CREATE TABLE public.pessoas_autorizadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    grau_parentesco VARCHAR(50) NOT NULL,
    foto_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.comunicados_ausencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    periodo periodo_ausencia_enum NOT NULL,
    motivo TEXT,
    notificado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TRANSPORTE, ROTAS E TELEMETRIA (RF003, RF007, RF011, RF013, RF019, RF020)
-- ==============================================================================

CREATE TABLE public.veiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    placa VARCHAR(10) NOT NULL UNIQUE,
    modelo VARCHAR(100) NOT NULL,
    ano INT NOT NULL,
    capacidade_assentos INT NOT NULL,
    renavam VARCHAR(20) NOT NULL,
    numero_alvara VARCHAR(50) NOT NULL,
    validade_vistoria DATE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.viagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE RESTRICT,
    tipo_viagem tipo_viagem_enum NOT NULL,
    turno turno_enum NOT NULL,
    data_hora_inicio TIMESTAMPTZ,
    data_hora_fim TIMESTAMPTZ,
    status status_viagem_enum DEFAULT 'AGENDADA',
    km_percorrido NUMERIC(6,2),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.localizacoes_gps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    viagem_id UUID NOT NULL REFERENCES public.viagens(id) ON DELETE CASCADE,
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    posicao GEOMETRY(Point, 4326) NOT NULL,
    velocidade NUMERIC(5,2),
    direcao NUMERIC(5,2),
    precisao_metros NUMERIC(5,2),
    "timestamp" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_localizacoes_gps_posicao ON public.localizacoes_gps USING GIST (posicao);
CREATE INDEX idx_localizacoes_gps_viagem ON public.localizacoes_gps (viagem_id, "timestamp" DESC);

CREATE TABLE public.registros_embarque_desembarque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    viagem_id UUID NOT NULL REFERENCES public.viagens(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    tipo tipo_embarque_enum NOT NULL,
    data_hora TIMESTAMPTZ DEFAULT NOW(),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    registrado_offline BOOLEAN DEFAULT FALSE,
    sincronizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.eventos_rota (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    viagem_id UUID NOT NULL REFERENCES public.viagens(id) ON DELETE CASCADE,
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    severidade VARCHAR(20) DEFAULT 'MEDIA',
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    data_hora TIMESTAMPTZ DEFAULT NOW()
);

-- Calendário escolar (RF019): um registro por dia marcado pelo transportador
CREATE TABLE public.calendario_escolar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    tipo VARCHAR(10) NOT NULL DEFAULT 'EVENTO' CHECK (tipo IN ('LETIVO', 'FERIADO', 'RECESSO', 'EVENTO')),
    descricao TEXT
);
CREATE INDEX idx_calendario_transportador ON public.calendario_escolar (transportador_id, data);

-- ==============================================================================
-- 6. FINANCEIRO, CONTRATOS E PAGAMENTOS (RF005, RF006, RF012, RF016)
-- ==============================================================================

CREATE TABLE public.contratos_servico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_contrato VARCHAR(50) NOT NULL UNIQUE,
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE RESTRICT,
    responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE RESTRICT,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE RESTRICT,
    valor_mensalidade NUMERIC(10,2) NOT NULL,
    dia_vencimento INT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    termos_condicoes TEXT,
    status status_contrato_enum DEFAULT 'ATIVO',
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.mensalidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id UUID NOT NULL REFERENCES public.contratos_servico(id) ON DELETE CASCADE,
    responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE RESTRICT,
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE RESTRICT,
    mes_referencia INT NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
    ano_referencia INT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    valor_multa_juros NUMERIC(10,2) DEFAULT 0.00,
    status status_mensalidade_enum DEFAULT 'PENDENTE',
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- status: PENDENTE (aguarda confirmação do transportador) | CONFIRMADO | ESTORNADO
CREATE TABLE public.pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mensalidade_id UUID NOT NULL REFERENCES public.mensalidades(id) ON DELETE CASCADE,
    metodo metodo_pagamento_enum NOT NULL,
    valor_pago NUMERIC(10,2) NOT NULL,
    data_pagamento TIMESTAMPTZ DEFAULT NOW(),
    transacao_id VARCHAR(100),
    detalhes_metodo JSONB,
    status VARCHAR(20) DEFAULT 'CONFIRMADO'
);

-- ==============================================================================
-- 7. COMUNICAÇÃO E NOTIFICAÇÕES (RF004, RF008)
-- ==============================================================================

CREATE TABLE public.mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    responsavel_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    remetente_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    remetente_nome VARCHAR(150) NOT NULL,
    origem VARCHAR(10) NOT NULL CHECK (origem IN ('PAIS', 'MOTORISTA')),
    texto TEXT NOT NULL CHECK (length(trim(texto)) > 0),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mensagens_canal ON public.mensagens (transportador_id, criado_em);
CREATE INDEX idx_mensagens_thread ON public.mensagens (transportador_id, responsavel_id, criado_em);

CREATE TABLE public.notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('CHEGANDO', 'EMBARQUE', 'PAGAMENTO', 'EMERGENCIA', 'AVISO')),
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notificacoes_usuario ON public.notificacoes (usuario_id, criado_em DESC);

CREATE TABLE public.push_tokens (
    token TEXT PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    plataforma VARCHAR(10) NOT NULL CHECK (plataforma IN ('ios', 'android')),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_push_tokens_usuario ON public.push_tokens (usuario_id);

-- ==============================================================================
-- 8. FUNÇÕES (todas SECURITY DEFINER com search_path vazio, exceto triggers simples)
-- ==============================================================================

-- Vínculo responsável <-> transportador via alunos (usadas nas policies)
CREATE OR REPLACE FUNCTION public.vinculado_ao_transportador(p_transportador uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT p_transportador = auth.uid() OR EXISTS (
    SELECT 1 FROM public.alunos a
    WHERE a.transportador_id = p_transportador
      AND a.ativo
      AND a.responsavel_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.relacionado_com(p_outro uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT p_outro = auth.uid() OR EXISTS (
    SELECT 1 FROM public.alunos a
    WHERE (a.responsavel_id = auth.uid()   AND p_outro = a.transportador_id)
       OR (a.transportador_id = auth.uid() AND p_outro = a.responsavel_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.notificar(p_usuario uuid, p_tipo text, p_titulo text, p_mensagem text)
 RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $function$
  INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem)
  VALUES (p_usuario, p_tipo, p_titulo, p_mensagem);
$function$;

-- Cria perfil + especialização ao registrar um usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.buscar_transportador_por_codigo(p_codigo text)
 RETURNS TABLE(id uuid, nome text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT t.id, p.nome::TEXT
  FROM public.transportadores t JOIN public.perfis p ON p.id = t.id
  WHERE t.codigo_convite = upper(trim(p_codigo)) AND p.ativo AND auth.uid() IS NOT NULL;
$function$;

CREATE OR REPLACE FUNCTION public.dados_recebimento(p_transportador uuid)
 RETURNS TABLE(nome text, chave_pix text, valor_mensalidade numeric, dia_vencimento integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT p.nome::TEXT, t.chave_pix, t.valor_mensalidade_padrao, t.dia_vencimento_padrao
  FROM public.transportadores t JOIN public.perfis p ON p.id = t.id
  WHERE t.id = p_transportador AND public.vinculado_ao_transportador(p_transportador);
$function$;

-- Cadastra aluno + contrato + mensalidades do ano a partir do código do transportador
CREATE OR REPLACE FUNCTION public.cadastrar_aluno(p_nome text, p_data_nascimento date, p_documento text, p_turma text, p_turno turno_enum, p_endereco_busca text, p_endereco_entrega text, p_observacoes text, p_codigo_transportador text, p_escola_nome text DEFAULT NULL::text, p_escola_endereco text DEFAULT NULL::text, p_endereco_busca_id uuid DEFAULT NULL::uuid, p_endereco_entrega_id uuid DEFAULT NULL::uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
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
$function$;

-- Responsável informa o pagamento (fica PENDENTE até o transportador confirmar)
CREATE OR REPLACE FUNCTION public.registrar_pagamento(p_mensalidade uuid, p_metodo metodo_pagamento_enum, p_transacao text, p_detalhes jsonb DEFAULT NULL::jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.confirmar_recebimento(p_pagamento uuid, p_aceitar boolean DEFAULT true)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.atualizar_mensalidades_vencidas()
 RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $function$
  WITH x AS (
    UPDATE public.mensalidades SET status = 'VENCIDO'
    WHERE status = 'PENDENTE' AND data_vencimento < CURRENT_DATE RETURNING 1
  ) SELECT count(*)::INT FROM x;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_push_token(p_token text, p_plataforma text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_token !~ '^(Expo|Exponent)PushToken\[.+\]$' THEN RAISE EXCEPTION 'Token inválido'; END IF;
  INSERT INTO public.push_tokens (token, usuario_id, plataforma)
  VALUES (p_token, auth.uid(), p_plataforma)
  ON CONFLICT (token) DO UPDATE SET usuario_id = auth.uid(), plataforma = EXCLUDED.plataforma, atualizado_em = NOW();
END;
$function$;

-- Funções de trigger: notificações automáticas (RF004)
CREATE OR REPLACE FUNCTION public.trg_notificar_ausencia()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_nome TEXT;
BEGIN
  SELECT nome INTO v_nome FROM public.alunos WHERE id = NEW.aluno_id;
  PERFORM public.notificar(NEW.transportador_id, 'AVISO', 'Falta comunicada',
    v_nome || ' não utilizará o transporte (' || NEW.periodo || '). ' || COALESCE(NEW.motivo, ''));
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.trg_notificar_embarque()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE a public.alunos%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.alunos WHERE id = NEW.aluno_id;
  PERFORM public.notificar(a.responsavel_id, 'EMBARQUE',
    CASE NEW.tipo WHEN 'EMBARQUE' THEN 'Embarque confirmado' ELSE 'Desembarque concluído' END,
    a.nome || CASE NEW.tipo WHEN 'EMBARQUE' THEN ' embarcou na van às ' ELSE ' chegou ao destino às ' END
      || to_char(NEW.data_hora AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') || '.');
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.trg_notificar_evento_rota()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE r UUID;
BEGIN
  FOR r IN SELECT DISTINCT responsavel_id FROM public.alunos
           WHERE transportador_id = NEW.transportador_id AND ativo LOOP
    PERFORM public.notificar(r, CASE WHEN NEW.severidade IN ('ALTA','EMERGENCIA') THEN 'EMERGENCIA' ELSE 'AVISO' END,
      'Alerta de rota: ' || NEW.tipo, NEW.descricao);
  END LOOP;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.trg_notificar_viagem()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
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
END $function$;

-- Dispara a Edge Function de push a cada notificação (segredos no Vault)
CREATE OR REPLACE FUNCTION public.trg_notificacao_push()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_url TEXT; v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'push_function_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'push_webhook_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN RETURN NEW; END IF;
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := jsonb_build_object('usuario_id', NEW.usuario_id, 'tipo', NEW.tipo, 'titulo', NEW.titulo, 'mensagem', NEW.mensagem)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

-- Habilita RLS automaticamente em tabelas novas do schema public (event trigger do Supabase)
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

-- ==============================================================================
-- 9. TRIGGERS
-- ==============================================================================

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER trg_ausencia_notifica AFTER INSERT ON public.comunicados_ausencia
    FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_ausencia();
CREATE TRIGGER trg_embarque_notifica AFTER INSERT ON public.registros_embarque_desembarque
    FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_embarque();
CREATE TRIGGER trg_evento_rota_notifica AFTER INSERT ON public.eventos_rota
    FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_evento_rota();
CREATE TRIGGER trg_viagem_notifica AFTER UPDATE ON public.viagens
    FOR EACH ROW EXECUTE FUNCTION public.trg_notificar_viagem();
CREATE TRIGGER trg_notificacao_push AFTER INSERT ON public.notificacoes
    FOR EACH ROW EXECUTE FUNCTION public.trg_notificacao_push();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RNF001, RNF006, RNF008)
-- Policies permissivas se somam (OR). Há políticas redundantes herdadas de
-- migrations antigas; foram mantidas aqui para refletir o banco real.
-- ==============================================================================

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enderecos_responsavel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pessoas_autorizadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados_ausencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localizacoes_gps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_embarque_desembarque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_rota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_escolar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- perfis
CREATE POLICY perfis_select ON public.perfis FOR SELECT USING (relacionado_com(id));
CREATE POLICY perfis_update_proprio ON public.perfis FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- responsaveis
CREATE POLICY "Responsavel gerencia seu proprio perfil" ON public.responsaveis FOR ALL USING (auth.uid() = id);
CREATE POLICY responsaveis_proprio ON public.responsaveis FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Transportador visualiza responsaveis dos seus alunos" ON public.responsaveis FOR SELECT
    USING (EXISTS (SELECT 1 FROM alunos a WHERE a.responsavel_id = responsaveis.id AND a.transportador_id = auth.uid()));

-- transportadores
CREATE POLICY "Transportador gerencia seu proprio perfil" ON public.transportadores FOR ALL USING (auth.uid() = id);
CREATE POLICY transportadores_proprio ON public.transportadores FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Responsaveis visualizam transportador contratado" ON public.transportadores FOR SELECT
    USING (EXISTS (SELECT 1 FROM alunos a WHERE a.transportador_id = transportadores.id AND a.responsavel_id = auth.uid()));

-- enderecos_responsavel
CREATE POLICY enderecos_select ON public.enderecos_responsavel FOR SELECT
    USING (auth.uid() = responsavel_id OR EXISTS (SELECT 1 FROM alunos a WHERE a.transportador_id = auth.uid()
           AND (a.endereco_busca_id = enderecos_responsavel.id OR a.endereco_entrega_id = enderecos_responsavel.id)));
CREATE POLICY enderecos_insert ON public.enderecos_responsavel FOR INSERT WITH CHECK (auth.uid() = responsavel_id);
CREATE POLICY enderecos_update ON public.enderecos_responsavel FOR UPDATE USING (auth.uid() = responsavel_id) WITH CHECK (auth.uid() = responsavel_id);
CREATE POLICY enderecos_delete ON public.enderecos_responsavel FOR DELETE USING (auth.uid() = responsavel_id);

-- alunos (insert apenas via cadastrar_aluno)
CREATE POLICY alunos_select ON public.alunos FOR SELECT USING (auth.uid() = responsavel_id OR auth.uid() = transportador_id);
CREATE POLICY alunos_update_responsavel ON public.alunos FOR UPDATE USING (auth.uid() = responsavel_id) WITH CHECK (auth.uid() = responsavel_id);

-- pessoas_autorizadas
CREATE POLICY "Responsavel gerencia pessoas autorizadas de seus alunos" ON public.pessoas_autorizadas FOR ALL
    USING (EXISTS (SELECT 1 FROM alunos a WHERE a.id = pessoas_autorizadas.aluno_id AND a.responsavel_id = auth.uid()));
CREATE POLICY pessoas_autorizadas_responsavel ON public.pessoas_autorizadas FOR ALL
    USING (EXISTS (SELECT 1 FROM alunos a WHERE a.id = pessoas_autorizadas.aluno_id AND a.responsavel_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM alunos a WHERE a.id = pessoas_autorizadas.aluno_id AND a.responsavel_id = auth.uid()));
CREATE POLICY "Transportador consulta pessoas autorizadas de seus alunos" ON public.pessoas_autorizadas FOR SELECT
    USING (EXISTS (SELECT 1 FROM alunos a WHERE a.id = pessoas_autorizadas.aluno_id AND a.transportador_id = auth.uid()));
CREATE POLICY pessoas_autorizadas_transportador ON public.pessoas_autorizadas FOR SELECT
    USING (EXISTS (SELECT 1 FROM alunos a WHERE a.id = pessoas_autorizadas.aluno_id AND a.transportador_id = auth.uid()));

-- comunicados_ausencia
CREATE POLICY "Responsavel gerencia comunicados de ausencia" ON public.comunicados_ausencia FOR ALL USING (auth.uid() = responsavel_id);
CREATE POLICY "Transportador visualiza comunicados de seus alunos" ON public.comunicados_ausencia FOR SELECT USING (auth.uid() = transportador_id);
CREATE POLICY ausencia_select ON public.comunicados_ausencia FOR SELECT USING (auth.uid() = responsavel_id OR auth.uid() = transportador_id);
CREATE POLICY ausencia_insert_responsavel ON public.comunicados_ausencia FOR INSERT
    WITH CHECK (responsavel_id = auth.uid() AND EXISTS (SELECT 1 FROM alunos a WHERE a.id = comunicados_ausencia.aluno_id
                AND a.responsavel_id = auth.uid() AND a.transportador_id = comunicados_ausencia.transportador_id));

-- veiculos
CREATE POLICY "Transportador gerencia seus veiculos" ON public.veiculos FOR ALL USING (auth.uid() = transportador_id);
CREATE POLICY veiculos_transportador ON public.veiculos FOR ALL USING (auth.uid() = transportador_id) WITH CHECK (auth.uid() = transportador_id);
CREATE POLICY "Pais visualizam veiculo ativo no transporte" ON public.veiculos FOR SELECT
    USING (EXISTS (SELECT 1 FROM alunos a WHERE a.transportador_id = veiculos.transportador_id AND a.responsavel_id = auth.uid()));
CREATE POLICY veiculos_vinculados_select ON public.veiculos FOR SELECT USING (vinculado_ao_transportador(transportador_id));

-- viagens
CREATE POLICY viagens_escrita_transportador ON public.viagens FOR ALL USING (auth.uid() = transportador_id) WITH CHECK (auth.uid() = transportador_id);
CREATE POLICY viagens_select ON public.viagens FOR SELECT USING (vinculado_ao_transportador(transportador_id));

-- localizacoes_gps
CREATE POLICY gps_insert_transportador ON public.localizacoes_gps FOR INSERT WITH CHECK (auth.uid() = transportador_id);
CREATE POLICY gps_select ON public.localizacoes_gps FOR SELECT USING (vinculado_ao_transportador(transportador_id));

-- registros_embarque_desembarque
CREATE POLICY "Transportador registra e consulta embarques" ON public.registros_embarque_desembarque FOR ALL
    USING (EXISTS (SELECT 1 FROM viagens v WHERE v.id = registros_embarque_desembarque.viagem_id AND v.transportador_id = auth.uid()));
CREATE POLICY "Pais visualizam embarques de seus filhos" ON public.registros_embarque_desembarque FOR SELECT
    USING (EXISTS (SELECT 1 FROM alunos a WHERE a.id = registros_embarque_desembarque.aluno_id AND a.responsavel_id = auth.uid()));
CREATE POLICY embarque_select ON public.registros_embarque_desembarque FOR SELECT
    USING (EXISTS (SELECT 1 FROM alunos a WHERE a.id = registros_embarque_desembarque.aluno_id
           AND (auth.uid() = a.responsavel_id OR auth.uid() = a.transportador_id)));
CREATE POLICY embarque_insert_transportador ON public.registros_embarque_desembarque FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM viagens v WHERE v.id = registros_embarque_desembarque.viagem_id AND v.transportador_id = auth.uid())
                AND EXISTS (SELECT 1 FROM alunos a WHERE a.id = registros_embarque_desembarque.aluno_id AND a.transportador_id = auth.uid()));

-- eventos_rota
CREATE POLICY "Transportador gerencia eventos de sua rota" ON public.eventos_rota FOR ALL USING (auth.uid() = transportador_id);
CREATE POLICY eventos_rota_insert ON public.eventos_rota FOR INSERT WITH CHECK (auth.uid() = transportador_id);
CREATE POLICY eventos_rota_select ON public.eventos_rota FOR SELECT USING (vinculado_ao_transportador(transportador_id));
CREATE POLICY "Pais visualizam eventos da rota de seus filhos" ON public.eventos_rota FOR SELECT
    USING (EXISTS (SELECT 1 FROM viagens v JOIN alunos a ON a.transportador_id = v.transportador_id
           WHERE v.id = eventos_rota.viagem_id AND a.responsavel_id = auth.uid()));

-- calendario_escolar
CREATE POLICY calendario_escrita_transportador ON public.calendario_escolar FOR ALL USING (transportador_id = auth.uid()) WITH CHECK (transportador_id = auth.uid());
CREATE POLICY calendario_select ON public.calendario_escolar FOR SELECT USING (vinculado_ao_transportador(transportador_id));

-- contratos_servico
CREATE POLICY "Partes envolvidas gerenciam contratos" ON public.contratos_servico FOR ALL USING (auth.uid() = transportador_id OR auth.uid() = responsavel_id);
CREATE POLICY contratos_select ON public.contratos_servico FOR SELECT USING (auth.uid() = responsavel_id OR auth.uid() = transportador_id);

-- mensalidades
CREATE POLICY mensalidades_select ON public.mensalidades FOR SELECT USING (auth.uid() = responsavel_id OR auth.uid() = transportador_id);
CREATE POLICY mensalidades_update_transportador ON public.mensalidades FOR UPDATE USING (auth.uid() = transportador_id) WITH CHECK (auth.uid() = transportador_id);

-- pagamentos (escrita via registrar_pagamento / confirmar_recebimento)
CREATE POLICY "Acesso a pagamentos vinculados a mensalidades" ON public.pagamentos FOR ALL
    USING (EXISTS (SELECT 1 FROM mensalidades m WHERE m.id = pagamentos.mensalidade_id
           AND (m.responsavel_id = auth.uid() OR m.transportador_id = auth.uid())));
CREATE POLICY pagamentos_select ON public.pagamentos FOR SELECT
    USING (EXISTS (SELECT 1 FROM mensalidades m WHERE m.id = pagamentos.mensalidade_id
           AND (auth.uid() = m.responsavel_id OR auth.uid() = m.transportador_id)));

-- mensagens
CREATE POLICY mensagens_select ON public.mensagens FOR SELECT USING (auth.uid() = transportador_id OR auth.uid() = responsavel_id);
CREATE POLICY mensagens_insert ON public.mensagens FOR INSERT
    WITH CHECK (remetente_id = auth.uid() AND (
        (origem = 'MOTORISTA' AND transportador_id = auth.uid()
            AND EXISTS (SELECT 1 FROM alunos a WHERE a.responsavel_id = mensagens.responsavel_id AND a.transportador_id = auth.uid()))
        OR
        (origem = 'PAIS' AND responsavel_id = auth.uid()
            AND EXISTS (SELECT 1 FROM alunos a WHERE a.responsavel_id = auth.uid() AND a.transportador_id = mensagens.transportador_id))));

-- notificacoes (insert apenas via notificar())
CREATE POLICY notificacoes_proprias_select ON public.notificacoes FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY notificacoes_proprias_update ON public.notificacoes FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

-- push_tokens (insert apenas via registrar_push_token())
CREATE POLICY push_tokens_proprios_select ON public.push_tokens FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY push_tokens_proprios_delete ON public.push_tokens FOR DELETE USING (auth.uid() = usuario_id);
