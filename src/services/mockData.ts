import {
  Aluno,
  PessoaAutorizada,
  Veiculo,
  ViagemTransporte,
  ContratoServico,
  Mensalidade,
  TipoUsuario,
} from '../types/database';

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
      nome: 'Lucas Silva',
      data_nascimento: '2016-04-12',
      documento: '52.341.987-X',
      turma: '5º Ano B',
      turno: 'MANHA',
      endereco_busca: 'Rua das Flores, 142 - Apto 31',
      endereco_entrega: 'Colégio Santa Maria (Portão 2)',
      observacoes_medicas: 'Alérgico a amendoim. Leva bombinha de asma na mochila.',
      ativo: true,
      criado_em: '2026-01-15T08:00:00Z',
      statusEmbarque: 'EMBARCADO',
      ultimoRegistro: 'Hoje às 07:15 (Embarcou na residência)',
    },
    {
      id: 'aluno-2',
      responsavel_id: 'resp-2',
      transportador_id: 'transp-1',
      escola_nome: 'Colégio Santa Maria',
      nome: 'Beatriz Santos',
      data_nascimento: '2017-09-20',
      documento: '58.912.433-1',
      turma: '4º Ano A',
      turno: 'MANHA',
      endereco_busca: 'Av. Brasil, 450 - Casa',
      endereco_entrega: 'Colégio Santa Maria (Portão 1)',
      observacoes_medicas: 'Nenhuma restrição conhecida.',
      ativo: true,
      criado_em: '2026-01-20T09:00:00Z',
      statusEmbarque: 'AGUARDANDO',
      ultimoRegistro: 'Aguardando embarque',
    },
    {
      id: 'aluno-3',
      responsavel_id: 'resp-3',
      transportador_id: 'transp-1',
      escola_nome: 'Colégio Santa Maria',
      nome: 'Gabriel Costa',
      data_nascimento: '2015-11-05',
      documento: '49.882.110-8',
      turma: '6º Ano C',
      turno: 'MANHA',
      endereco_busca: 'Rua Augusta, 980',
      endereco_entrega: 'Colégio Santa Maria (Portão 2)',
      observacoes_medicas: 'Usa óculos para leitura.',
      ativo: true,
      criado_em: '2026-02-01T10:00:00Z',
      statusEmbarque: 'EMBARCADO',
      ultimoRegistro: 'Hoje às 07:05 (Embarcou na residência)',
    },
    {
      id: 'aluno-4',
      responsavel_id: 'resp-4',
      transportador_id: 'transp-1',
      escola_nome: 'Colégio Santa Maria',
      nome: 'Sofia Lima',
      data_nascimento: '2018-03-14',
      documento: '61.402.771-5',
      turma: '3º Ano B',
      turno: 'MANHA',
      endereco_busca: 'Rua Pamplona, 320',
      endereco_entrega: 'Colégio Santa Maria (Portão 1)',
      observacoes_medicas: 'Intolerância à lactose.',
      ativo: true,
      criado_em: '2026-02-10T11:00:00Z',
      statusEmbarque: 'AUSENTE',
      ultimoRegistro: 'Ausência comunicada pelo responsável (Consulta médica)',
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
    data_hora_inicio: '2026-10-31T06:45:00Z',
    status: 'EM_ANDAMENTO',
    km_percorrido: 7.4,
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
      id: 'notif-1',
      tipo: 'CHEGANDO',
      titulo: '🚌 Van se aproximando!',
      mensagem: 'O Tio Marcos está a aproximadamente 4 minutos da sua residência (Rua das Flores).',
      dataHora: '2026-10-31T07:11:00Z',
      lida: false,
    },
    {
      id: 'notif-2',
      tipo: 'EMBARQUE',
      titulo: '🎒 Embarque Confirmado',
      mensagem: 'Lucas Silva embarcou na van escolar às 07:15.',
      dataHora: '2026-10-31T07:15:22Z',
      lida: false,
    },
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
      id: 'msg-1',
      remetenteId: 'transp-1',
      remetenteNome: 'Tio Marcos (Motorista)',
      destinatarioNome: 'Carlos Silva (Pai)',
      texto: 'Bom dia Carlos! Já estou na Rua das Flores, chego em 3 minutos.',
      dataHora: '2026-10-31T07:10:00Z',
      origem: 'MOTORISTA',
    },
    {
      id: 'msg-2',
      remetenteId: 'resp-1',
      remetenteNome: 'Carlos Silva (Pai)',
      destinatarioNome: 'Tio Marcos (Motorista)',
      texto: 'Bom dia Tio Marcos! Perfeito, o Lucas já está descendo com a mochila.',
      dataHora: '2026-10-31T07:12:00Z',
      origem: 'PAIS',
    },
    {
      id: 'msg-3',
      remetenteId: 'transp-1',
      remetenteNome: 'Tio Marcos (Motorista)',
      destinatarioNome: 'Famílias da rota',
      texto: 'Bom dia! Hoje o desembarque no Colégio Santa Maria será normal pelos portões 1 e 2.',
      dataHora: '2026-10-31T06:30:00Z',
      origem: 'MOTORISTA',
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

