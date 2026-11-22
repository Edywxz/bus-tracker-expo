import {
  Aluno,
  PessoaAutorizada,
  Veiculo,
  ViagemTransporte,
  ContratoServico,
  Mensalidade,
  TipoUsuario,
} from '../types/database';
import { DEMO_LUGARES as L, DEMO_ROTA } from './demoRota';

// Ordem em que a van busca cada aluno na rota otimizada (posição no mapa esquemático).
const parada = (id: string) => (DEMO_ROTA.ordem as readonly string[]).indexOf(id);

export interface MockDataState {
  currentRole: TipoUsuario;
  alunos: (Aluno & {
    statusEmbarque: 'AGUARDANDO' | 'EMBARCADO' | 'DESEMBARCADO' | 'AUSENTE';
    ultimoRegistro?: string;
  })[];
  pessoasAutorizadas: PessoaAutorizada[];
  veiculo: Veiculo;
  viagemAtiva: ViagemTransporte;
  contratos: ContratoServico[];
  mensalidades: Mensalidade[];
  notificacoes: {
    id: string;
    tipo: 'CHEGANDO' | 'EMBARQUE' | 'PAGAMENTO' | 'EMERGENCIA' | 'AVISO';
    titulo: string;
    mensagem: string;
    dataHora: string;
    lida: boolean;
  }[];
  mensagensChat: {
    id: string;
    remetenteId: string;
    remetenteNome: string;
    destinatarioNome: string;
    texto: string;
    dataHora: string;
    origem: 'PAIS' | 'MOTORISTA';
    /** Dono da conversa privada (o motorista conversa com um responsável por vez). */
    responsavelId: string;
  }[];
  eventosCalendario: {
    id: string;
    data: string;
    titulo: string;
    tipo: 'LETIVO' | 'FERIADO' | 'RECESSO' | 'EVENTO';
    descricao: string;
  }[];
}

export const initialMockData: MockDataState = {
  currentRole: 'RESPONSAVEL',
  alunos: [
    {
      id: 'aluno-1',
      responsavel_id: 'resp-1',
      transportador_id: 'transp-1',
      escola_nome: 'Colégio Santa Maria',
      escola_endereco: L.santaMaria.endereco,
      nome: 'Lucas Silva',
      data_nascimento: '2016-04-12',
      documento: '52.341.987-X',
      turma: '5º Ano B',
      turno: 'MANHA',
      endereco_busca: 'Rua Haddock Lobo, 595 - Apto 31',
      endereco_entrega: 'Colégio Santa Maria (Portão 2)',
      latitude: L.lucas.latitude, longitude: L.lucas.longitude, entrega_latitude: L.santaMaria.latitude, entrega_longitude: L.santaMaria.longitude, parada: parada('lucas'),
      observacoes_medicas: 'Alérgico a amendoim. Leva bombinha de asma na mochila.',
      ativo: true,
      criado_em: '2026-01-15T08:00:00Z',
      statusEmbarque: 'AGUARDANDO',
    },
    {
      id: 'aluno-2',
      responsavel_id: 'resp-2',
      transportador_id: 'transp-1',
      escola_nome: 'Colégio Santa Maria',
      escola_endereco: L.santaMaria.endereco,
      nome: 'Beatriz Santos',
      data_nascimento: '2017-09-20',
      documento: '58.912.433-1',
      turma: '4º Ano A',
      turno: 'MANHA',
      endereco_busca: 'Av. Brasil, 450 - Casa',
      endereco_entrega: 'Colégio Santa Maria (Portão 1)',
      latitude: L.beatriz.latitude, longitude: L.beatriz.longitude, entrega_latitude: L.santaMaria.latitude, entrega_longitude: L.santaMaria.longitude, parada: parada('beatriz'),
      observacoes_medicas: 'Nenhuma restrição conhecida.',
      ativo: true,
      criado_em: '2026-01-20T09:00:00Z',
      statusEmbarque: 'AGUARDANDO',
    },
    {
      id: 'aluno-3',
      responsavel_id: 'resp-3',
      transportador_id: 'transp-1',
      escola_nome: 'Colégio Santa Maria',
      escola_endereco: L.santaMaria.endereco,
      nome: 'Gabriel Costa',
      data_nascimento: '2015-11-05',
      documento: '49.882.110-8',
      turma: '6º Ano C',
      turno: 'MANHA',
      endereco_busca: 'Rua Augusta, 980',
      endereco_entrega: 'Colégio Santa Maria (Portão 2)',
      latitude: L.gabriel.latitude, longitude: L.gabriel.longitude, entrega_latitude: L.santaMaria.latitude, entrega_longitude: L.santaMaria.longitude, parada: parada('gabriel'),
      observacoes_medicas: 'Usa óculos para leitura.',
      ativo: true,
      criado_em: '2026-02-01T10:00:00Z',
      statusEmbarque: 'AGUARDANDO',
    },
    {
      id: 'aluno-4',
      responsavel_id: 'resp-4',
      transportador_id: 'transp-1',
      escola_nome: 'Colégio Santa Maria',
      escola_endereco: L.santaMaria.endereco,
      nome: 'Sofia Lima',
      data_nascimento: '2018-03-14',
      documento: '61.402.771-5',
      turma: '3º Ano B',
      turno: 'MANHA',
      endereco_busca: 'Rua Estados Unidos, 1500',
      endereco_entrega: 'Colégio Santa Maria (Portão 1)',
      latitude: L.sofia.latitude, longitude: L.sofia.longitude, entrega_latitude: L.santaMaria.latitude, entrega_longitude: L.santaMaria.longitude, parada: parada('sofia'),
      observacoes_medicas: 'Intolerância à lactose.',
      ativo: true,
      criado_em: '2026-02-10T11:00:00Z',
      statusEmbarque: 'AUSENTE',
      ultimoRegistro: 'Ausência comunicada pelo responsável (Consulta médica)',
    },
    {
      id: 'aluno-5',
      responsavel_id: 'resp-1',
      transportador_id: 'transp-1',
      escola_nome: 'Escola Municipal Aurora',
      escola_endereco: L.aurora.endereco,
      nome: 'Ana Silva',
      data_nascimento: '2019-08-03',
      documento: '63.118.442-1',
      turma: '2º Ano A',
      turno: 'MANHA',
      endereco_busca: 'Rua Haddock Lobo, 595 - Apto 31', // mora com o irmão Lucas
      endereco_entrega: 'Escola Municipal Aurora (Portão 1)',
      latitude: L.lucas.latitude, longitude: L.lucas.longitude, entrega_latitude: L.aurora.latitude, entrega_longitude: L.aurora.longitude, parada: parada('lucas'),
      ativo: true,
      criado_em: '2026-02-12T09:00:00Z',
      statusEmbarque: 'AGUARDANDO',
    },
  ],

  pessoasAutorizadas: [
    {
      id: 'pa-1',
      aluno_id: 'aluno-1',
      nome: 'Helena Silva',
      cpf: '111.222.333-44',
      telefone: '(11) 98765-4321',
      grau_parentesco: 'Avó Materna',
      ativo: true,
    },
    {
      id: 'pa-2',
      aluno_id: 'aluno-1',
      nome: 'Juliana Costa',
      cpf: '222.333.444-55',
      telefone: '(11) 99876-5432',
      grau_parentesco: 'Tia',
      ativo: true,
    },
  ],

  veiculo: {
    id: 'veic-1',
    transportador_id: 'transp-1',
    placa: 'BRA2E19',
    modelo: 'Renault Master 2.3 dCi Minibus Escolar',
    ano: 2024,
    capacidade_assentos: 16,
    renavam: '00987654321',
    numero_alvara: 'AUT-9874/2026',
    validade_vistoria: '2026-12-15',
    ativo: true,
  },

  viagemAtiva: {
    id: 'viagem-hoje-manha',
    transportador_id: 'transp-1',
    veiculo_id: 'veic-1',
    tipo_viagem: 'IDA',
    turno: 'MANHA',
    status: 'AGENDADA', // a demo começa com a rota ainda não iniciada
    km_percorrido: 0,
    criado_em: '2026-10-31T06:40:00Z',
  },

  contratos: [
    {
      id: 'cont-1',
      numero_contrato: 'CTR-2026/089',
      transportador_id: 'transp-1',
      responsavel_id: 'resp-1',
      aluno_id: 'aluno-1',
      valor_mensalidade: 420.0,
      dia_vencimento: 10,
      data_inicio: '2026-02-01',
      data_termino: '2026-12-20',
      termos_condicoes:
        'Contrato padrão de transporte escolar autônomo individual. Cobre percursos de ida e volta de segunda a sexta-feira no turno da manhã conforme calendário letivo oficial.',
      status: 'ATIVO',
      criado_em: '2026-01-20T10:00:00Z',
    },
  ],

  mensalidades: [
    {
      id: 'mens-10',
      contrato_id: 'cont-1',
      responsavel_id: 'resp-1',
      transportador_id: 'transp-1',
      mes_referencia: 10,
      ano_referencia: 2026,
      valor: 420.0,
      data_vencimento: '2026-11-10',
      valor_multa_juros: 0,
      status: 'PENDENTE',
      criado_em: '2026-10-01T00:00:00Z',
    },
    {
      id: 'mens-09',
      contrato_id: 'cont-1',
      responsavel_id: 'resp-1',
      transportador_id: 'transp-1',
      mes_referencia: 9,
      ano_referencia: 2026,
      valor: 420.0,
      data_vencimento: '2026-10-10',
      valor_multa_juros: 0,
      status: 'PAGO',
      criado_em: '2026-09-01T00:00:00Z',
    },
    {
      id: 'mens-08',
      contrato_id: 'cont-1',
      responsavel_id: 'resp-1',
      transportador_id: 'transp-1',
      mes_referencia: 8,
      ano_referencia: 2026,
      valor: 420.0,
      data_vencimento: '2026-09-10',
      valor_multa_juros: 0,
      status: 'PAGO',
      criado_em: '2026-08-01T00:00:00Z',
    },
  ],

  notificacoes: [
    {
      id: 'notif-3',
      tipo: 'PAGAMENTO',
      titulo: '💰 Mensalidade de Outubro',
      mensagem: 'Sua mensalidade com vencimento em 10/11 está disponível para pagamento via PIX, Cartão ou Boleto.',
      dataHora: '2026-10-25T09:00:00Z',
      lida: true,
    },
  ],

  mensagensChat: [
    {
      id: 'msg-3',
      remetenteId: 'transp-1',
      remetenteNome: 'Tio Marcos (Motorista)',
      destinatarioNome: 'Responsáveis da rota',
      texto: 'Bom dia! Hoje o desembarque no Colégio Santa Maria será normal pelos portões 1 e 2.',
      dataHora: '2026-10-31T06:30:00Z',
      origem: 'MOTORISTA',
      responsavelId: 'resp-1',
    },
  ],

  eventosCalendario: [
    {
      id: 'cal-1',
      data: '2026-11-02',
      titulo: 'Finados (Feriado Nacional)',
      tipo: 'FERIADO',
      descricao: 'Não haverá expediente escolar nem transporte.',
    },
    {
      id: 'cal-2',
      data: '2026-11-15',
      titulo: 'Proclamação da República',
      tipo: 'FERIADO',
      descricao: 'Feriado Nacional.',
    },
    {
      id: 'cal-3',
      data: '2026-11-20',
      titulo: 'Dia da Consciência Negra',
      tipo: 'FERIADO',
      descricao: 'Feriado Nacional.',
    },
    {
      id: 'cal-4',
      data: '2026-12-18',
      titulo: 'Encerramento do Ano Letivo',
      tipo: 'EVENTO',
      descricao: 'Último dia de aulas regulares e transporte do segundo semestre.',
    },
  ],
};

