/**
 * Definições de Tipos TypeScript para o Banco de Dados Supabase (PostgreSQL)
 * Baseado no Diagrama de Classes UML (DIAGRAMA_CLASSES.md) e Requisitos (REQUISITOS.md)
 */

export type TipoUsuario = 'RESPONSAVEL' | 'TRANSPORTADOR' | 'INSTITUICAO';
export type Turno = 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE';
export type TipoViagem = 'IDA' | 'VOLTA';
export type StatusViagem = 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
export type TipoRegistroEmbarque = 'EMBARQUE' | 'DESEMBARQUE';
export type SeveridadeEvento = 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA';
export type StatusContrato = 'ATIVO' | 'SUSPENSO' | 'CANCELADO' | 'ENCERRADO';
export type StatusMensalidade = 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO';
export type MetodoPagamento = 'PIX' | 'CARTAO' | 'BOLETO';
export type PeriodoAusencia = 'IDA' | 'VOLTA' | 'AMBOS';

export interface UsuarioProfile {
  id: string; // auth.users.id
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  tipo_usuario: TipoUsuario;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface ResponsavelProfile {
  id: string; // FK -> profiles.id
  endereco_residencial: string;
}

export interface TransportadorProfile {
  id: string; // FK -> profiles.id
  cnh: string;
  categoria_cnh: string;
  numero_credencial?: string;
  alvara_autonomo: string;
  foto_url?: string;
}

export interface InstituicaoEnsinoProfile {
  id: string; // FK -> profiles.id
  cnpj: string;
  razao_social: string;
  endereco: string;
  telefone_contato: string;
}

export interface Aluno {
  id: string;
  responsavel_id: string;
  transportador_id: string;
  instituicao_id?: string;
  nome: string;
  data_nascimento: string;
  documento: string;
  turma?: string;
  turno: Turno;
  endereco_busca: string;
  endereco_entrega: string;
  observacoes_medicas?: string;
  foto_url?: string;
  ativo: boolean;
  criado_em: string;
}

export interface PessoaAutorizada {
  id: string;
  aluno_id: string;
  nome: string;
  cpf: string;
  telefone: string;
  grau_parentesco: string;
  foto_url?: string;
  ativo: boolean;
}

export interface Veiculo {
  id: string;
  transportador_id: string;
  placa: string;
  modelo: string;
  ano: number;
  capacidade_assentos: number;
  renavam: string;
  numero_alvara: string;
  validade_vistoria: string;
  ativo: boolean;
}

export interface ViagemTransporte {
  id: string;
  transportador_id: string;
  veiculo_id: string;
  tipo_viagem: TipoViagem;
  turno: Turno;
  data_hora_inicio?: string;
  data_hora_fim?: string;
  status: StatusViagem;
  km_percorrido?: number;
  criado_em: string;
}

export interface LocalizacaoGPS {
  id: string;
  viagem_id: string;
  transportador_id: string;
  latitude: number;
  longitude: number;
  velocidade?: number;
  direcao?: number;
  precisao_metros?: number;
  timestamp: string;
}

export interface RegistroEmbarqueDesembarque {
  id: string;
  viagem_id: string;
  aluno_id: string;
  tipo: TipoRegistroEmbarque;
  data_hora: string;
  latitude?: number;
  longitude?: number;
  registrado_offline: boolean;
  sincronizado_em?: string;
}

export interface EventoRota {
  id: string;
  viagem_id: string;
  transportador_id: string;
  tipo: string;
  descricao: string;
  severidade: SeveridadeEvento;
  latitude?: number;
  longitude?: number;
  data_hora: string;
}

export interface ComunicadoAusencia {
  id: string;
  aluno_id: string;
  responsavel_id: string;
  transportador_id: string;
  data_inicio: string;
  data_fim: string;
  periodo: PeriodoAusencia;
  motivo?: string;
  notificado_em: string;
}

export interface ContratoServico {
  id: string;
  numero_contrato: string;
  transportador_id: string;
  responsavel_id: string;
  aluno_id: string;
  valor_mensalidade: number;
  dia_vencimento: number;
  data_inicio: string;
  data_termino: string;
  termos_condicoes?: string;
  status: StatusContrato;
  criado_em: string;
}

export interface Mensalidade {
  id: string;
  contrato_id: string;
  responsavel_id: string;
  transportador_id: string;
  mes_referencia: number;
  ano_referencia: number;
  valor: number;
  data_vencimento: string;
  valor_multa_juros: number;
  status: StatusMensalidade;
  criado_em: string;
}

export interface Pagamento {
  id: string;
  mensalidade_id: string;
  metodo: MetodoPagamento;
  valor_pago: number;
  data_pagamento: string;
  transacao_id?: string;
  detalhes_metodo?: Record<string, any>;
  status: 'PENDENTE' | 'CONFIRMADO' | 'ESTORNADO';
}
