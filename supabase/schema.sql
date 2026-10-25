-- ==============================================================================
-- VANESCOLAR GPS — SCRIPT DE MODELAGEM E SCHEMA DO BANCO DE DADOS (SUPABASE/POSTGRESQL)
-- Atende aos Requisitos Funcionais (RF001 a RF021) e Não Funcionais (RNF001 a RNF008)
-- ==============================================================================

-- 1. Habilitar Extensões Essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Enums do Domínio
DO $$ BEGIN
    CREATE TYPE tipo_usuario_enum AS ENUM ('RESPONSAVEL', 'TRANSPORTADOR', 'INSTITUICAO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE turno_enum AS ENUM ('MANHA', 'TARDE', 'INTEGRAL', 'NOITE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_viagem_enum AS ENUM ('IDA', 'VOLTA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_viagem_enum AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_embarque_enum AS ENUM ('EMBARQUE', 'DESEMBARQUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_contrato_enum AS ENUM ('ATIVO', 'SUSPENSO', 'CANCELADO', 'ENCERRADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE status_mensalidade_enum AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE metodo_pagamento_enum AS ENUM ('PIX', 'CARTAO', 'BOLETO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE periodo_ausencia_enum AS ENUM ('IDA', 'VOLTA', 'AMBOS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 3. MÓDULO DE USUÁRIOS E PERFIS (RF001, RF010, RF014, RF015, RF021)
-- ==============================================================================

-- Tabela Central de Perfis (vinculada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    tipo_usuario tipo_usuario_enum NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Especialização: Responsável (Pais) (RF001)
CREATE TABLE IF NOT EXISTS public.responsaveis (
    id UUID PRIMARY KEY REFERENCES public.perfis(id) ON DELETE CASCADE,
    endereco_residencial TEXT NOT NULL
);

-- Especialização: Transportador Autônomo (RF014)
CREATE TABLE IF NOT EXISTS public.transportadores (
    id UUID PRIMARY KEY REFERENCES public.perfis(id) ON DELETE CASCADE,
    cnh VARCHAR(20) NOT NULL,
    categoria_cnh VARCHAR(5) NOT NULL,
    numero_credencial VARCHAR(50),
    alvara_autonomo VARCHAR(50) NOT NULL,
    foto_url TEXT
);

-- Especialização: Instituição de Ensino (RF015)
CREATE TABLE IF NOT EXISTS public.instituicoes_ensino (
    id UUID PRIMARY KEY REFERENCES public.perfis(id) ON DELETE CASCADE,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    razao_social VARCHAR(150) NOT NULL,
    endereco TEXT NOT NULL,
    telefone_contato VARCHAR(20) NOT NULL
);

-- ==============================================================================
-- 4. MÓDULO DE ALUNOS E SEGURANÇA (RF002, RF009, RF017, RF018)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE RESTRICT,
    instituicao_id UUID REFERENCES public.instituicoes_ensino(id) ON DELETE SET NULL,
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
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Pessoas Autorizadas (RF018)
CREATE TABLE IF NOT EXISTS public.pessoas_autorizadas (
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

-- Comunicado de Ausência (RF009)
CREATE TABLE IF NOT EXISTS public.comunicados_ausencia (
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
-- 5. MÓDULO DE TRANSPORTE, ROTAS E TELEMETRIA (RF003, RF007, RF011, RF013, RF020)
-- ==============================================================================

-- Veículo (Van / Micro-ônibus) (RF013)
CREATE TABLE IF NOT EXISTS public.veiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    placa VARCHAR(10) UNIQUE NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano INT NOT NULL,
    capacidade_assentos INT NOT NULL,
    renavam VARCHAR(20) NOT NULL,
    numero_alvara VARCHAR(50) NOT NULL,
    validade_vistoria DATE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Viagem / Trajeto de Transporte (RF020)
CREATE TABLE IF NOT EXISTS public.viagens (
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

-- Telemetria GPS com PostGIS (RF003, RNF002)
CREATE TABLE IF NOT EXISTS public.localizacoes_gps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    viagem_id UUID NOT NULL REFERENCES public.viagens(id) ON DELETE CASCADE,
    transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
    posicao GEOMETRY(Point, 4326) NOT NULL,
    velocidade NUMERIC(5,2),
    direcao NUMERIC(5,2),
    precisao_metros NUMERIC(5,2),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_localizacoes_gps_posicao ON public.localizacoes_gps USING GIST(posicao);
CREATE INDEX IF NOT EXISTS idx_localizacoes_gps_viagem ON public.localizacoes_gps(viagem_id, timestamp DESC);

-- Registro de Embarque e Desembarque (RF007, RNF005)
CREATE TABLE IF NOT EXISTS public.registros_embarque_desembarque (
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

-- Evento de Rota / Emergência (RF011)
CREATE TABLE IF NOT EXISTS public.eventos_rota (
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

-- ==============================================================================
-- 6. MÓDULO FINANCEIRO, CONTRATOS E PAGAMENTOS (RF005, RF006, RF012, RF016)
-- ==============================================================================

-- Contrato de Prestação de Serviço (RF016)
CREATE TABLE IF NOT EXISTS public.contratos_servico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_contrato VARCHAR(50) UNIQUE NOT NULL,
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

-- Mensalidades (RF006)
CREATE TABLE IF NOT EXISTS public.mensalidades (
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

-- Pagamentos (RF005, RF012)
CREATE TABLE IF NOT EXISTS public.pagamentos (
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
-- 7. SEGURANÇA E POLÍTICAS RLS (Row Level Security) (RNF001, RNF006, RNF008)
-- ==============================================================================

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instituicoes_ensino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pessoas_autorizadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados_ausencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localizacoes_gps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_embarque_desembarque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_rota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Exemplo de Políticas de Isolamento:
-- Perfis: Usuário pode ler e alterar apenas seu próprio perfil
CREATE POLICY "Perfis visiveis pelos proprios usuarios"
    ON public.perfis FOR ALL
    USING (auth.uid() = id);

-- Alunos: Responsável vê seus alunos; Transportador vê apenas os alunos vinculados a ele (RNF008)
CREATE POLICY "Acesso de alunos por responsavel ou transportador"
    ON public.alunos FOR ALL
    USING (auth.uid() = responsavel_id OR auth.uid() = transportador_id);

-- Viagens: Transportador gerencia suas viagens; Pais podem visualizar viagens ativas de seus filhos
CREATE POLICY "Viagens visiveis pelo transportador ou responsavel"
    ON public.viagens FOR SELECT
    USING (
        auth.uid() = transportador_id OR
        EXISTS (
            SELECT 1 FROM public.alunos a
            WHERE a.transportador_id = viagens.transportador_id
            AND a.responsavel_id = auth.uid()
        )
    );

-- Localizações GPS: Pais podem ver posições da van durante a viagem de seus filhos
CREATE POLICY "Rastreamento GPS autorizado"
    ON public.localizacoes_gps FOR SELECT
    USING (
        auth.uid() = transportador_id OR
        EXISTS (
            SELECT 1 FROM public.viagens v
            JOIN public.alunos a ON a.transportador_id = v.transportador_id
            WHERE v.id = localizacoes_gps.viagem_id
            AND a.responsavel_id = auth.uid()
        )
    );

-- Mensalidades: Responsável vê as suas; Transportador vê apenas as de seus clientes
CREATE POLICY "Mensalidades seguras"
    ON public.mensalidades FOR ALL
    USING (auth.uid() = responsavel_id OR auth.uid() = transportador_id);
