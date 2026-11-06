import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode,
} from 'react';
import {
  TipoUsuario, PessoaAutorizada, Veiculo, ViagemTransporte, ContratoServico, Mensalidade,
  MetodoPagamento, SeveridadeEvento, PeriodoAusencia, Pagamento,
} from '../types/database';
import { initialMockData, MockDataState } from '../services/mockData';
import { BoardingService } from '../services/boardingService';
import { LocationTrackerService } from '../services/locationTracker';
import { SecurityService } from '../services/security';
import { supabase } from '../services/supabase';
import { AuthService } from '../services/authService';
import { DataService, PerfilApp, AlunoApp } from '../services/dataService';
import { animateNextLayout } from '../theme/tokens';

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  velocidade: number;
  rua: string;
}

export type AuthStatus = 'carregando' | 'deslogado' | 'logado';

export interface NovoAluno {
  nome: string; dataNascimento: string; documento?: string; turma: string;
  turno: 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE';
  enderecoBusca: string; enderecoEntrega: string; observacoes?: string;
  codigoTransportador: string; codigoEscola?: string;
}

interface AppContextType {
  // Sessão
  authStatus: AuthStatus;
  isDemo: boolean;
  perfil: PerfilApp | null;
  codigoConvite: string | null;
  nomes: { transportador?: string; escola?: string };
  recebimento: { chavePix: string | null; valor: number | null; diaVencimento: number | null };
  carregandoDados: boolean;
  entrarDemo: (role: TipoUsuario) => void;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (p: { nome: string; email: string; senha: string; tipo: TipoUsuario }) => Promise<{ precisaConfirmar: boolean }>;
  recuperarSenha: (email: string) => Promise<void>;
  sair: () => Promise<void>;
  excluirConta: () => Promise<void>;
  recarregar: () => Promise<void>;

  // Dados
  role: TipoUsuario;
  setRole: (role: TipoUsuario) => void; // apenas modo demonstração
  alunos: AlunoApp[];
  pessoasAutorizadas: PessoaAutorizada[];
  veiculo: Veiculo;
  temVeiculo: boolean;
  viagemAtiva: ViagemTransporte;
  temViagem: boolean;
  contratos: ContratoServico[];
  mensalidades: Mensalidade[];
  pagamentos: Pagamento[];
  notificacoes: MockDataState['notificacoes'];
  mensagensChat: MockDataState['mensagensChat'];
  eventosCalendario: MockDataState['eventosCalendario'];
  offlineQueueCount: number;
  isOnline: boolean;
  gpsPosicao: GPSCoordinate;
  gpsAtivo: boolean;
  /** índice do ponto da rota no modo demonstração */
  gpsStep?: number;
  /** total de pontos da rota conhecida (modo demonstração) */
  gpsTotalPassos?: number;
  /**
   * Estimativa até o fim da rota, calculada pela distância restante dos pontos conhecidos e a velocidade atual.
   * Só existe quando a rota é conhecida (modo demonstração); com dados reais é null — nunca inventamos um número.
   */
  estimativaRota: { km: number; minutos: number; progresso: number } | null;

  // Ações
  simularPassoGps: () => void;
  buscarTransportador: (codigo: string) => Promise<{ id: string; nome: string } | null>;
  cadastrarAluno: (a: NovoAluno) => Promise<void>;
  registrarEmbarque: (alunoId: string, tipo: 'EMBARQUE' | 'DESEMBARQUE') => Promise<void>;
  comunicarAusencia: (alunoId: string, periodo: PeriodoAusencia, motivo: string) => Promise<void>;
  confirmarRecebimento: (pagamentoId: string, aceitar: boolean) => Promise<void>;
  pagarMensalidade: (
    mensalidadeId: string, metodo: MetodoPagamento, detalhes?: any
  ) => Promise<{ sucesso: boolean; reciboHash?: string }>;
  enviarMensagem: (texto: string) => Promise<void>;
  sincronizarFilaOffline: () => Promise<{ sincronizados: number; erros: number }>;
  iniciarViagem: (tipo: 'IDA' | 'VOLTA', turno: 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE') => Promise<void>;
  finalizarViagem: () => Promise<void>;
  registrarEventoRota: (tipo: string, descricao: string, severidade: SeveridadeEvento) => Promise<void>;
  adicionarPessoaAutorizada: (pessoa: Omit<PessoaAutorizada, 'id' | 'ativo'>) => Promise<void>;
  removerPessoaAutorizada: (id: string) => Promise<void>;
  atualizarVeiculo: (dados: Partial<Veiculo>) => Promise<void>;
  marcarNotificacoesComoLidas: () => Promise<void>;
  atualizarPerfil: (d: { nome?: string; telefone?: string }) => Promise<void>;
  salvarConfigRecebimento: (d: { valor: number; dia: number; chavePix: string }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ROTA_PONTOS: GPSCoordinate[] = [
  { latitude: -23.55052, longitude: -46.633308, velocidade: 28, rua: 'Av. Paulista, próx. ao MASP' },
  { latitude: -23.55312, longitude: -46.638411, velocidade: 35, rua: 'Rua Augusta, 980' },
  { latitude: -23.55743, longitude: -46.64219, velocidade: 22, rua: 'Rua das Flores, 142' },
  { latitude: -23.56105, longitude: -46.64732, velocidade: 40, rua: 'Av. Brasil, sentido Jardins' },
  { latitude: -23.56581, longitude: -46.65214, velocidade: 15, rua: 'Av. Tiradentes, 850' },
];
const SEM_SINAL: GPSCoordinate = { latitude: 0, longitude: 0, velocidade: 0, rua: 'Aguardando sinal da van' };

const VEICULO_VAZIO: Veiculo = {
  id: '', transportador_id: '', placa: '', modelo: '', ano: new Date().getFullYear(),
  capacidade_assentos: 0, renavam: '', numero_alvara: '', validade_vistoria: '', ativo: true,
};
const VIAGEM_VAZIA: ViagemTransporte = {
  id: '', transportador_id: '', veiculo_id: '', tipo_viagem: 'IDA', turno: 'MANHA',
  status: 'AGENDADA', km_percorrido: 0, criado_em: '',
};

const novoId = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthService.disponivel() ? 'carregando' : 'deslogado');
  const [isDemo, setIsDemo] = useState(false);
  const [perfil, setPerfil] = useState<PerfilApp | null>(null);
  const [demoRole, setDemoRole] = useState<TipoUsuario>('RESPONSAVEL');
  const [codigoConvite, setCodigoConvite] = useState<string | null>(null);
  const [nomes, setNomes] = useState<{ transportador?: string; escola?: string }>({});
  const [recebimento, setRecebimento] = useState<AppContextType['recebimento']>({ chavePix: null, valor: null, diaVencimento: null });
  const [carregandoDados, setCarregandoDados] = useState(false);

  const [alunos, setAlunos] = useState<AlunoApp[]>([]);
  const [pessoasAutorizadas, setPessoas] = useState<PessoaAutorizada[]>([]);
  const [veiculo, setVeiculo] = useState<Veiculo>(VEICULO_VAZIO);
  const [viagemAtiva, setViagemAtiva] = useState<ViagemTransporte>(VIAGEM_VAZIA);
  const [contratos, setContratos] = useState<ContratoServico[]>([]);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [notificacoes, setNotificacoes] = useState<MockDataState['notificacoes']>([]);
  const [mensagensChat, setMensagensChat] = useState<MockDataState['mensagensChat']>([]);
  const [eventosCalendario, setEventos] = useState<MockDataState['eventosCalendario']>([]);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isOnline] = useState(true);
  const [gpsIndex, setGpsIndex] = useState(2);
  const [gpsReal, setGpsReal] = useState<GPSCoordinate | null>(null);

  const role: TipoUsuario = perfil?.tipo ?? demoRole;
  const userId = perfil?.id ?? '';
  const recarregarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Carga de dados --------------------------------------------------
  const limpar = () => {
    setAlunos([]); setPessoas([]); setVeiculo(VEICULO_VAZIO); setViagemAtiva(VIAGEM_VAZIA);
    setContratos([]); setMensalidades([]); setPagamentos([]); setNotificacoes([]); setMensagensChat([]); setEventos([]);
    setCodigoConvite(null); setNomes({}); setGpsReal(null); setPerfil(null);
  };

  const carregarDemo = (r: TipoUsuario) => {
    const d = initialMockData;
    setDemoRole(r); setIsDemo(true); setPerfil(null);
    setAlunos(d.alunos); setPessoas(d.pessoasAutorizadas); setVeiculo(d.veiculo);
    setViagemAtiva(d.viagemAtiva); setContratos(d.contratos); setMensalidades(d.mensalidades);
    setNotificacoes(d.notificacoes); setMensagensChat(d.mensagensChat); setEventos(d.eventosCalendario);
    setNomes({ transportador: 'Tio Marcos', escola: 'Colégio Santa Maria' });
    setCodigoConvite('DEMO42');
    setRecebimento({ chavePix: 'marcos.van@exemplo.com', valor: 350, diaVencimento: 10 });
    setAuthStatus('logado');
  };

  const recarregar = useCallback(async () => {
    if (isDemo) return;
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) return;
    const d = await DataService.carregar(uid);
    setPerfil(d.perfil); setCodigoConvite(d.codigoConvite); setNomes(d.nomes); setRecebimento(d.recebimento);
    setAlunos(d.alunos); setPessoas(d.pessoasAutorizadas);
    setVeiculo(d.veiculo ?? VEICULO_VAZIO); setViagemAtiva(d.viagem ?? VIAGEM_VAZIA);
    setContratos(d.contratos); setMensalidades(d.mensalidades); setPagamentos(d.pagamentos);
    setNotificacoes(d.notificacoes); setMensagensChat(d.mensagensChat); setEventos(d.eventosCalendario);
  }, [isDemo]);

  // Sessão do Supabase
  useEffect(() => {
    if (!AuthService.disponivel()) return;
    let ativo = true;
    const aplicar = async (temSessao: boolean) => {
      if (!ativo) return;
      if (!temSessao) {
        if (!isDemo) { limpar(); setAuthStatus('deslogado'); }
        return;
      }
      setIsDemo(false);
      setCarregandoDados(true);
      try {
        await recarregar();
        if (ativo) setAuthStatus('logado');
      } catch (e) {
        console.warn('Falha ao carregar dados:', e);
        if (ativo) setAuthStatus('logado');
      } finally {
        if (ativo) setCarregandoDados(false);
      }
    };
    AuthService.sessaoAtual().then((s) => aplicar(!!s));
    const off = AuthService.aoMudarSessao((s) => { aplicar(!!s); });
    return () => { ativo = false; off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tempo real: recarrega (com debounce) quando algo muda no banco
  useEffect(() => {
    if (isDemo || !userId) return;
    const off = DataService.assinarMudancas(userId, () => {
      if (recarregarTimer.current) clearTimeout(recarregarTimer.current);
      recarregarTimer.current = setTimeout(() => { recarregar().catch(() => {}); }, 400);
    });
    return () => { off(); if (recarregarTimer.current) clearTimeout(recarregarTimer.current); };
  }, [isDemo, userId, recarregar]);

  // Posição ao vivo da van (pais e escola)
  useEffect(() => {
    if (isDemo || role === 'TRANSPORTADOR' || !viagemAtiva.id || viagemAtiva.status !== 'EM_ANDAMENTO') return;
    return LocationTrackerService.assinarRastreamentoViagem(viagemAtiva.id, (p) =>
      setGpsReal({ latitude: p.latitude, longitude: p.longitude, velocidade: Math.round(p.velocidade ?? 0), rua: 'Posição em tempo real' })
    );
  }, [isDemo, role, viagemAtiva.id, viagemAtiva.status]);

  const atualizarContadorOffline = useCallback(async () => {
    try { setOfflineQueueCount((await BoardingService.obterFilaOffline()).length); }
    catch { setOfflineQueueCount(0); }
  }, []);
  useEffect(() => { atualizarContadorOffline(); }, [atualizarContadorOffline]);

  // ---------- Sessão: ações ---------------------------------------------------
  const entrarDemo = (r: TipoUsuario) => { animateNextLayout(); carregarDemo(r); };
  const entrar = async (email: string, senha: string) => { await AuthService.entrar(email, senha); };
  const cadastrar: AppContextType['cadastrar'] = (p) => AuthService.cadastrar(p);
  const recuperarSenha = (email: string) => AuthService.recuperarSenha(email);
  const sair = async () => {
    if (isDemo) { setIsDemo(false); limpar(); setAuthStatus('deslogado'); return; }
    await AuthService.sair();
  };
  const excluirConta = async () => {
    if (isDemo) { await sair(); return; }
    await AuthService.excluirConta(userId);
  };

  const setRole = (r: TipoUsuario) => { if (isDemo) carregarDemo(r); };

  // ---------- Ações de negócio ------------------------------------------------
  const exigirReal = () => { if (!userId) throw new Error('Sessão expirada. Entre novamente.'); };
  const rotulo = () => (role === 'TRANSPORTADOR' ? perfil?.nome ?? 'Motorista' : role === 'INSTITUICAO' ? perfil?.nome ?? 'Escola' : perfil?.nome ?? 'Responsável');
  const canalTransportador = () =>
    role === 'TRANSPORTADOR' ? userId : alunos[0]?.transportador_id ?? '';

  const gpsPosicao: GPSCoordinate = isDemo ? ROTA_PONTOS[gpsIndex] : gpsReal ?? SEM_SINAL;
  const gpsAtivo = isDemo || !!gpsReal;

  const estimativaRota = useMemo(() => {
    if (!isDemo) return null;
    const rad = (g: number) => (g * Math.PI) / 180;
    const dist = (a: GPSCoordinate, b: GPSCoordinate) => {
      const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    };
    let total = 0, restante = 0;
    for (let i = 0; i < ROTA_PONTOS.length - 1; i++) {
      const d = dist(ROTA_PONTOS[i], ROTA_PONTOS[i + 1]);
      total += d;
      if (i >= gpsIndex) restante += d;
    }
    const vel = Math.max(ROTA_PONTOS[gpsIndex].velocidade, 15); // km/h, piso para trânsito parado
    return { km: restante, minutos: Math.max(1, Math.round((restante / vel) * 60)), progresso: total ? 1 - restante / total : 1 };
  }, [isDemo, gpsIndex]);

  const simularPassoGps = () => {
    if (!isDemo) return;
    setGpsIndex((i) => (i + 1) % ROTA_PONTOS.length);
  };

  const buscarTransportador = (codigo: string) => DataService.buscarTransportador(codigo);

  const cadastrarAluno = async (a: NovoAluno) => {
    if (isDemo) throw new Error('Crie uma conta para cadastrar alunos de verdade.');
    exigirReal();
    await DataService.cadastrarAluno(a);
    animateNextLayout();
    await recarregar();
  };

  const registrarEmbarque = async (alunoId: string, tipo: 'EMBARQUE' | 'DESEMBARQUE') => {
    if (!isDemo && viagemAtiva.status !== 'EM_ANDAMENTO') {
      throw new Error('Inicie uma rota antes de registrar embarques.');
    }
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const pos = isDemo ? ROTA_PONTOS[gpsIndex] : gpsReal;
    await BoardingService.registrar({
      viagemId: viagemAtiva.id, alunoId, tipo, latitude: pos?.latitude, longitude: pos?.longitude,
    });
    animateNextLayout();
    setAlunos((prev) => prev.map((a) => a.id !== alunoId ? a : {
      ...a,
      statusEmbarque: tipo === 'EMBARQUE' ? 'EMBARCADO' : 'DESEMBARCADO',
      ultimoRegistro: `Hoje às ${hora} (${tipo === 'EMBARQUE' ? 'Embarcou na van' : 'Desembarcou no destino'})`,
    }));
    if (isDemo) {
      const aluno = alunos.find((a) => a.id === alunoId);
      if (aluno) setNotificacoes((p) => [{
        id: novoId('notif'), tipo: 'EMBARQUE', titulo: tipo === 'EMBARQUE' ? 'Embarque confirmado' : 'Desembarque concluído',
        mensagem: `${aluno.nome} foi registrado às ${hora}.`, dataHora: new Date().toISOString(), lida: false,
      }, ...p]);
    }
    await atualizarContadorOffline();
  };

  const comunicarAusencia = async (alunoId: string, periodo: PeriodoAusencia, motivo: string) => {
    const aluno = alunos.find((a) => a.id === alunoId);
    if (!aluno) return;
    if (!isDemo) {
      exigirReal();
      await DataService.comunicarAusencia({
        alunoId, responsavelId: userId, transportadorId: aluno.transportador_id, periodo, motivo,
      });
    }
    animateNextLayout();
    setAlunos((prev) => prev.map((a) => a.id !== alunoId ? a : {
      ...a, statusEmbarque: 'AUSENTE',
      ultimoRegistro: `Falta comunicada (${periodo})${motivo ? `: ${motivo}` : ''}`,
    }));
    if (isDemo) {
      setNotificacoes((p) => [{
        id: novoId('notif'), tipo: 'AVISO', titulo: 'Falta comunicada',
        mensagem: `${aluno.nome} não utilizará o transporte (${periodo}).`, dataHora: new Date().toISOString(), lida: false,
      }, ...p]);
    }
  };

  const pagarMensalidade: AppContextType['pagarMensalidade'] = async (mensalidadeId, metodo, detalhes) => {
    const m = mensalidades.find((x) => x.id === mensalidadeId);
    if (!m) return { sucesso: false };
    const reciboHash = SecurityService.generateReceiptHash(mensalidadeId, m.valor, new Date().toISOString());
    if (!isDemo) {
      exigirReal();
      await DataService.registrarPagamento(mensalidadeId, metodo, reciboHash, detalhes);
    }
    animateNextLayout();
    if (!isDemo) {
      // Fica aguardando o transportador confirmar o recebimento
      await recarregar();
      return { sucesso: true, reciboHash };
    }
    setMensalidades((prev) => prev.map((x) => (x.id === mensalidadeId ? { ...x, status: 'PAGO' } : x)));
    if (isDemo) {
      setNotificacoes((p) => [{
        id: novoId('notif'), tipo: 'PAGAMENTO', titulo: 'Pagamento confirmado',
        mensagem: `Mensalidade ${m.mes_referencia}/${m.ano_referencia} (${SecurityService.formatCurrency(m.valor)}) paga via ${metodo}.`,
        dataHora: new Date().toISOString(), lida: false,
      }, ...p]);
    }
    return { sucesso: true, reciboHash };
  };

  const confirmarRecebimento = async (pagamentoId: string, aceitar: boolean) => {
    if (isDemo) return;
    exigirReal();
    await DataService.confirmarRecebimento(pagamentoId, aceitar);
    animateNextLayout();
    await recarregar();
  };

  const enviarMensagem = async (texto: string) => {
    const t = texto.trim();
    if (!t) return;
    const origem = role === 'TRANSPORTADOR' ? 'MOTORISTA' : role === 'INSTITUICAO' ? 'ESCOLA' : 'PAIS';
    if (!isDemo) {
      exigirReal();
      const canal = canalTransportador();
      if (!canal) throw new Error('Vincule-se a um transportador para conversar.');
      await DataService.enviarMensagem({
        canalTransportadorId: canal, remetenteId: userId, remetenteNome: rotulo(), origem, texto: t,
      });
    }
    animateNextLayout();
    setMensagensChat((p) => [...p, {
      id: novoId('msg'), remetenteId: userId || role, remetenteNome: isDemo
        ? (role === 'TRANSPORTADOR' ? 'Tio Marcos (Motorista)' : role === 'INSTITUICAO' ? 'Coordenação Santa Maria' : 'Carlos Silva (Pai)')
        : rotulo(),
      destinatarioNome: '', texto: t, dataHora: new Date().toISOString(), origem,
    }]);
  };

  const sincronizarFilaOffline = async () => {
    const r = await BoardingService.sincronizarFilaOffline();
    await atualizarContadorOffline();
    return r;
  };

  const iniciarViagem: AppContextType['iniciarViagem'] = async (tipo, turno) => {
    if (isDemo) {
      animateNextLayout();
      setViagemAtiva((v) => ({ ...v, tipo_viagem: tipo, turno, status: 'EM_ANDAMENTO', data_hora_inicio: new Date().toISOString(), km_percorrido: 0 }));
      return;
    }
    exigirReal();
    if (!veiculo.id) throw new Error('Cadastre seu veículo em Conta antes de iniciar uma rota.');
    await LocationTrackerService.iniciarViagem({ transportadorId: userId, veiculoId: veiculo.id, tipoViagem: tipo, turno });
    animateNextLayout();
    await recarregar();
  };

  const finalizarViagem = async () => {
    if (isDemo) {
      animateNextLayout();
      setViagemAtiva((v) => ({ ...v, status: 'CONCLUIDA', data_hora_fim: new Date().toISOString() }));
      return;
    }
    exigirReal();
    await LocationTrackerService.finalizarViagem(viagemAtiva.id);
    animateNextLayout();
    await recarregar();
  };

  const registrarEventoRota: AppContextType['registrarEventoRota'] = async (tipo, descricao, severidade) => {
    if (isDemo) {
      setNotificacoes((p) => [{
        id: novoId('notif'), tipo: 'EMERGENCIA', titulo: `Alerta de rota: ${tipo}`,
        mensagem: descricao, dataHora: new Date().toISOString(), lida: false,
      }, ...p]);
      return;
    }
    exigirReal();
    if (!viagemAtiva.id || viagemAtiva.status !== 'EM_ANDAMENTO') throw new Error('Inicie uma rota para registrar ocorrências.');
    await DataService.registrarEventoRota({ viagemId: viagemAtiva.id, transportadorId: userId, tipo, descricao, severidade });
  };

  const adicionarPessoaAutorizada: AppContextType['adicionarPessoaAutorizada'] = async (p) => {
    if (isDemo) {
      animateNextLayout();
      setPessoas((prev) => [...prev, { ...p, id: novoId('pa'), ativo: true }]);
      return;
    }
    exigirReal();
    await DataService.adicionarPessoa(p);
    animateNextLayout();
    await recarregar();
  };

  const removerPessoaAutorizada = async (id: string) => {
    if (!isDemo) { exigirReal(); await DataService.removerPessoa(id); }
    animateNextLayout();
    setPessoas((prev) => prev.filter((p) => p.id !== id));
  };

  const atualizarVeiculo = async (dados: Partial<Veiculo>) => {
    if (!isDemo) {
      exigirReal();
      await DataService.salvarVeiculo(userId, { ...veiculo, ...dados });
      await recarregar();
      return;
    }
    setVeiculo((v) => ({ ...v, ...dados }));
  };

  const marcarNotificacoesComoLidas = async () => {
    if (!isDemo && userId) await DataService.marcarNotificacoesLidas(userId);
    animateNextLayout();
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  const atualizarPerfil = async (d: { nome?: string; telefone?: string }) => {
    if (isDemo) return;
    exigirReal();
    await DataService.salvarPerfil(userId, d);
    await recarregar();
  };

  const salvarConfigRecebimento = async (d: { valor: number; dia: number; chavePix: string }) => {
    if (isDemo) { setRecebimento({ chavePix: d.chavePix, valor: d.valor, diaVencimento: d.dia }); return; }
    exigirReal();
    await DataService.atualizarConfigTransportador(userId, {
      valor_mensalidade_padrao: d.valor, dia_vencimento_padrao: d.dia, chave_pix: d.chavePix.trim() || null,
    });
    await recarregar();
  };

  const value = useMemo<AppContextType>(() => ({
    authStatus, isDemo, perfil, codigoConvite, nomes, recebimento, carregandoDados,
    entrarDemo, entrar, cadastrar, recuperarSenha, sair, excluirConta, recarregar,
    role, setRole, alunos, pessoasAutorizadas, veiculo, temVeiculo: !!veiculo.id,
    viagemAtiva, temViagem: !!viagemAtiva.id, contratos, mensalidades, pagamentos, notificacoes, mensagensChat,
    eventosCalendario, offlineQueueCount, isOnline, gpsPosicao, gpsAtivo, gpsStep: isDemo ? gpsIndex : undefined,
    gpsTotalPassos: isDemo ? ROTA_PONTOS.length : undefined, estimativaRota,
    simularPassoGps, buscarTransportador, cadastrarAluno, registrarEmbarque, comunicarAusencia,
    pagarMensalidade, confirmarRecebimento, enviarMensagem, sincronizarFilaOffline, iniciarViagem, finalizarViagem,
    registrarEventoRota, adicionarPessoaAutorizada, removerPessoaAutorizada, atualizarVeiculo,
    marcarNotificacoesComoLidas, atualizarPerfil, salvarConfigRecebimento,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [authStatus, isDemo, perfil, codigoConvite, nomes, recebimento, carregandoDados, role, alunos, pessoasAutorizadas,
    veiculo, viagemAtiva, contratos, mensalidades, pagamentos, notificacoes, mensagensChat, eventosCalendario,
    offlineQueueCount, isOnline, gpsIndex, gpsReal, estimativaRota]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  return context;
};
