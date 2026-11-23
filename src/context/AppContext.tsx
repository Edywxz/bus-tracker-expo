import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode,
} from 'react';
import {
  TipoUsuario, PessoaAutorizada, Veiculo, ViagemTransporte, ContratoServico, Mensalidade,
  MetodoPagamento, SeveridadeEvento, PeriodoAusencia, Pagamento,
} from '../types/database';
import { initialMockData, MockDataState } from '../services/mockData';
import { DEMO_ROTA } from '../services/demoRota';
import { alvoDoPulo, estadoEm, montarSimulacao, type ConfigSim, type EstadoSim, type Gravidade, type Linha, type ParadaVista, visaoDoResponsavel } from '../services/simulacao';
import { BoardingService } from '../services/boardingService';
import { LocationTrackerService } from '../services/locationTracker';
import { SecurityService } from '../services/security';
import { supabase } from '../services/supabase';
import { AuthService } from '../services/authService';
import { PushService } from '../services/pushService';
import { DataService, PerfilApp, AlunoApp, RotaOtimizada, PrevisaoChegada } from '../services/dataService';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { mensagemErro } from '../utils/format';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
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
  codigoTransportador: string; escolaNome?: string; escolaEndereco?: string;
}

interface AppContextType {
  // Sessão
  authStatus: AuthStatus;
  isDemo: boolean;
  perfil: PerfilApp | null;
  codigoConvite: string | null;
  nomes: { transportador?: string };
  recebimento: { chavePix: string | null; valor: number | null; diaVencimento: number | null };
  carregandoDados: boolean;
  entrarDemo: (role: TipoUsuario) => void;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (p: { nome: string; email: string; senha: string; tipo: TipoUsuario }) => Promise<{ precisaConfirmar: boolean }>;
  recuperarSenha: (email: string) => Promise<void>;
  reenviarConfirmacao: (email: string) => Promise<void>;
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
  /** trajeto conhecido da van (só no demo); com dados reais não há polilinha inventada */
  rotaGeo: { latitude: number; longitude: number }[];
  /** força um novo cálculo da rota mais eficiente (motorista, dados reais) */
  recalcularRota: () => void;
  /** minutos restantes até a van chegar a cada aluno (busca/entrega). O responsável recebe só os dos próprios dependentes. */
  previsoes: Record<string, { busca?: number; entrega?: number }>;
  /** o motorista negou a permissão de localização: a van não aparece no mapa */
  gpsNegado: boolean;
  ajustarPino: (alunoId: string, tipo: 'busca' | 'entrega', latitude: number, longitude: number) => Promise<void>;
  geocodificarEndereco: (alunoId: string, tipo: 'busca' | 'entrega') => Promise<{ ok: boolean; mensagem?: string }>;

  // Ações
  /** Demo: viagem simulada em andamento (null = nenhuma). `t` em ms desde o início da simulação. */
  simulacao: { linha: Linha; t: number; estado: EstadoSim } | null;
  /** Responsável na demo: paradas da viagem até a última do seu dependente (as de outros alunos, sem nome). */
  paradasSim: ParadaVista[] | null;
  iniciarSimulacao: (c: ConfigSim) => void;
  /** `suave`: volta ao início só nos estados que a simulação mexeu (viagem e embarques), sem recarregar a demo toda. */
  pararSimulacao: (suave?: boolean) => void;
  /** Demo: continua depois de uma ocorrência de gravidade Alta. */
  retomarSimulacao: () => void;
  pularSimulacao: (alvo: 'SAIDA' | 'PARADA' | 'FIM') => void;
  dispararOcorrencia: (g: Gravidade) => void;
  /** Hora de mentira definida pelo cenário (demo); null = usar a hora real. */
  horaSimulada: Date | null;
  buscarTransportador: (codigo: string) => Promise<{ id: string; nome: string } | null>;
  cadastrarAluno: (a: NovoAluno) => Promise<void>;
  registrarEmbarque: (alunoId: string, tipo: 'EMBARQUE' | 'DESEMBARQUE') => Promise<void>;
  comunicarAusencia: (alunoId: string, periodo: PeriodoAusencia, motivo: string) => Promise<void>;
  confirmarRecebimento: (pagamentoId: string, aceitar: boolean) => Promise<void>;
  pagarMensalidade: (
    mensalidadeId: string, metodo: MetodoPagamento, detalhes?: any
  ) => Promise<{ sucesso: boolean; reciboHash?: string }>;
  enviarMensagem: (texto: string, responsavelId?: string) => Promise<void>;
  sincronizarFilaOffline: () => Promise<{ sincronizados: number; erros: number }>;
  iniciarViagem: (tipo: 'IDA' | 'VOLTA', turno: 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE') => Promise<void>;
  finalizarViagem: () => Promise<void>;
  registrarEventoRota: (tipo: string, descricao: string, severidade: SeveridadeEvento) => Promise<void>;
  adicionarPessoaAutorizada: (pessoa: Omit<PessoaAutorizada, 'id' | 'ativo'>) => Promise<void>;
  removerPessoaAutorizada: (id: string) => Promise<void>;
  renovarCodigoConvite: () => Promise<void>;
  desvincularAluno: (alunoId: string) => Promise<void>;
  atualizarAluno: (alunoId: string, d: Parameters<typeof DataService.atualizarAluno>[1]) => Promise<void>;
  removerAluno: (alunoId: string) => Promise<void>;
  vincularAluno: (alunoId: string, codigo: string) => Promise<void>;
  adicionarEventoCalendario: (e: { id?: string; data: string; titulo: string; tipo: MockDataState['eventosCalendario'][number]['tipo']; descricao?: string }) => Promise<void>;
  removerEventoCalendario: (id: string) => Promise<void>;
  atualizarVeiculo: (dados: Partial<Veiculo>) => Promise<void>;
  marcarNotificacoesComoLidas: () => Promise<void>;
  atualizarPerfil: (d: { nome?: string; telefone?: string }) => Promise<void>;
  salvarConfigRecebimento: (d: { valor: number; dia: number; chavePix: string }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Rota do modo demonstração: a mais eficiente por todas as paradas, seguindo as ruas (gerada por scripts/gerar-rota-demo.js).
const VELOCIDADE_DEMO = 30; // km/h médio urbano
const ROTA_PONTOS: GPSCoordinate[] = DEMO_ROTA.pontos.map((p) => ({ latitude: p.latitude, longitude: p.longitude, velocidade: VELOCIDADE_DEMO, rua: p.rua }));
const PARADAS_ROTA: number[] = DEMO_ROTA.paradas.map((p) => p.indice);
const SEM_SINAL: GPSCoordinate = { latitude: 0, longitude: 0, velocidade: 0, rua: 'Aguardando sinal da van' };

const VEICULO_VAZIO: Veiculo = {
  id: '', transportador_id: '', placa: '', modelo: '', ano: new Date().getFullYear(),
  capacidade_assentos: 0, renavam: '', numero_alvara: '', validade_vistoria: '', ativo: true,
};
const VIAGEM_VAZIA: ViagemTransporte = {
  id: '', transportador_id: '', veiculo_id: '', tipo_viagem: 'IDA', turno: 'MANHA',
  status: 'AGENDADA', km_percorrido: 0, criado_em: '',
};

/** Responsável da conta demo: nunca enxerga dependentes ou conversas de outros responsáveis. */
const DEMO_RESPONSAVEL = 'resp-1';
const novoId = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(AuthService.disponivel() ? 'carregando' : 'deslogado');
  const [isDemo, setIsDemo] = useState(false);
  const [perfil, setPerfil] = useState<PerfilApp | null>(null);
  const [demoRole, setDemoRole] = useState<TipoUsuario>('RESPONSAVEL');
  const [codigoConvite, setCodigoConvite] = useState<string | null>(null);
  const [nomes, setNomes] = useState<{ transportador?: string }>({});
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
  const [isOnline, setIsOnline] = useState(true);
  const [gpsIndex, setGpsIndex] = useState(0); // van na garagem até a rota começar
  const [horaSimulada, setHoraSimulada] = useState<Date | null>(null);
  const [sim, setSim] = useState<{ linha: Linha; t: number; retomado: boolean } | null>(null);
  const estadoSim = useMemo(() => (sim ? estadoEm(sim.linha, sim.t) : null), [sim]);
  const [gpsReal, setGpsReal] = useState<GPSCoordinate | null>(null);
  const [rotaReal, setRotaReal] = useState<(RotaOtimizada & { calculadoEm: number }) | null>(null);
  const [previsoesDb, setPrevisoesDb] = useState<PrevisaoChegada[]>([]);
  const [relogio, setRelogio] = useState(() => Date.now());
  const [gpsNegado, setGpsNegado] = useState(false);
  const [rotaTick, setRotaTick] = useState(0);
  const gpsRealRef = useRef(gpsReal);
  gpsRealRef.current = gpsReal;

  const role: TipoUsuario = perfil?.tipo ?? demoRole;
  const userId = perfil?.id ?? '';
  const logadoRef = useRef(false);
  const saindoRef = useRef(false); // distingue sair() do usuário de sessão que expirou
  const recarregarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Carga de dados --------------------------------------------------
  const limpar = () => {
    setAlunos([]); setPessoas([]); setVeiculo(VEICULO_VAZIO); setViagemAtiva(VIAGEM_VAZIA);
    setContratos([]); setMensalidades([]); setPagamentos([]); setNotificacoes([]); setMensagensChat([]); setEventos([]);
    setSim(null); setHoraSimulada(null); setCodigoConvite(null); setNomes({}); setGpsReal(null); setPerfil(null); setPrevisoesDb([]); setRotaReal(null);
  };

  const carregarDemo = (r: TipoUsuario) => {
    const d = initialMockData;
    setDemoRole(r); setIsDemo(true); setPerfil(null);
    // Como no banco (RLS), o responsável só vê os próprios dependentes e a própria conversa.
    const meus = r === 'RESPONSAVEL' ? d.alunos.filter((a) => a.responsavel_id === DEMO_RESPONSAVEL) : d.alunos;
    const ids = new Set(meus.map((a) => a.id));
    setAlunos(meus);
    setPessoas(d.pessoasAutorizadas.filter((p) => ids.has(p.aluno_id)));
    setVeiculo(d.veiculo);
    setViagemAtiva(d.viagemAtiva);
    setContratos(d.contratos.filter((c) => ids.has(c.aluno_id)));
    setMensalidades(d.mensalidades);
    setNotificacoes(d.notificacoes);
    setMensagensChat(r === 'RESPONSAVEL' ? d.mensagensChat.filter((m) => m.responsavelId === DEMO_RESPONSAVEL) : d.mensagensChat);
    setEventos(d.eventosCalendario);
    setNomes({ transportador: 'Tio Marcos' });
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
    setPrevisoesDb(d.previsoes);
  }, [isDemo]);

  // Sessão do Supabase
  useEffect(() => {
    if (!AuthService.disponivel()) return;
    let ativo = true;
    const aplicar = async (temSessao: boolean) => {
      if (!ativo) return;
      if (!temSessao) {
        if (logadoRef.current && !saindoRef.current && !isDemo) Alert.alert('Sessão expirada', 'Por segurança, entre novamente para continuar.');
        logadoRef.current = false; saindoRef.current = false;
        if (!isDemo) { limpar(); setAuthStatus('deslogado'); }
        return;
      }
      logadoRef.current = true;
      setIsDemo(false);
      setCarregandoDados(true);
      try {
        await recarregar();
        if (ativo) setAuthStatus('logado');
        PushService.registrar();
      } catch (e) {
        console.warn('Falha ao carregar dados:', e);
        if (ativo) setAuthStatus('logado');
        if (ativo) Alert.alert('Não foi possível carregar seus dados', mensagemErro(e), [
          { text: 'Tentar de novo', onPress: () => { recarregar().catch(() => {}); } }, { text: 'Fechar', style: 'cancel' },
        ]);
      } finally {
        if (ativo) setCarregandoDados(false);
      }
    };
    AuthService.sessaoAtual().then((s) => aplicar(!!s));
    const off = AuthService.aoMudarSessao((s) => { aplicar(!!s); });
    return () => { ativo = false; off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Link do e-mail de confirmação aberto no aparelho: entra na conta (ou avisa que o link não vale mais)
  useEffect(() => {
    if (!AuthService.disponivel()) return;
    const tratar = (url: string | null) => {
      if (url) AuthService.tratarLink(url).then((m) => { if (m) Alert.alert('Link inválido', m); });
    };
    Linking.getInitialURL().then(tratar);
    const sub = Linking.addEventListener('url', (e) => tratar(e.url));
    return () => sub.remove();
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

  // Posição ao vivo da van (pais)
  useEffect(() => {
    if (isDemo || role === 'TRANSPORTADOR' || !viagemAtiva.id || viagemAtiva.status !== 'EM_ANDAMENTO') return;
    let ativo = true;
    // última posição gravada: a van já aparece ao abrir o app, sem esperar a próxima transmissão
    DataService.ultimaPosicao(viagemAtiva.id).then((p) => {
      if (ativo && p) setGpsReal((atual) => atual ?? { ...p, rua: 'Posição em tempo real' });
    }).catch(() => {});
    const off = LocationTrackerService.assinarRastreamentoViagem(viagemAtiva.id, (p) =>
      setGpsReal({ latitude: p.latitude, longitude: p.longitude, velocidade: Math.round(p.velocidade ?? 0), rua: 'Posição em tempo real' })
    );
    return () => { ativo = false; off(); };
  }, [isDemo, role, viagemAtiva.id, viagemAtiva.status]);

  // Motorista: mostra a própria posição no mapa mesmo antes de iniciar a rota (a transmissão só começa com a rota em andamento)
  useEffect(() => {
    if (isDemo || role !== 'TRANSPORTADOR' || !userId) return;
    let ativo = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!ativo) return;
      setGpsNegado(status !== 'granted');
      if (status !== 'granted') return;
      const p = (await Location.getLastKnownPositionAsync().catch(() => null)) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null));
      if (ativo && p) setGpsReal((atual) => atual ?? { latitude: p.coords.latitude, longitude: p.coords.longitude, velocidade: 0, rua: 'Posição em tempo real' });
    })();
    return () => { ativo = false; };
  }, [isDemo, role, userId]);

  // GPS do motorista: durante a rota, publica a posição (broadcast + banco) e mostra no próprio mapa
  // shortcut: só em primeiro plano (app aberto na rota); para tela bloqueada, usar expo-task-manager + permissão background
  useEffect(() => {
    if (isDemo || role !== 'TRANSPORTADOR' || !userId || !viagemAtiva.id || viagemAtiva.status !== 'EM_ANDAMENTO') return;
    let sub: Location.LocationSubscription | null = null;
    let ativo = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !ativo) { console.warn('Permissão de localização negada'); if (ativo) setGpsNegado(true); return; }
      const s = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (loc) => {
          const { latitude, longitude, speed, heading, accuracy } = loc.coords;
          const kmh = Math.max(0, Math.round((speed ?? 0) * 3.6));
          setGpsReal({ latitude, longitude, velocidade: kmh, rua: 'Posição em tempo real' });
          LocationTrackerService.enviarLocalizacao({
            viagemId: viagemAtiva.id, transportadorId: userId, latitude, longitude,
            velocidade: kmh, direcao: heading ?? undefined, precisaoMetros: accuracy ?? undefined,
          }).catch((e) => console.warn('Falha ao enviar GPS:', e));
        },
      );
      if (ativo) sub = s; else s.remove();
    })();
    return () => { ativo = false; sub?.remove(); };
  }, [isDemo, role, userId, viagemAtiva.id, viagemAtiva.status]);

  const atualizarContadorOffline = useCallback(async () => {
    try { setOfflineQueueCount((await BoardingService.obterFilaOffline()).length); }
    catch { setOfflineQueueCount(0); }
  }, []);
  useEffect(() => { atualizarContadorOffline(); }, [atualizarContadorOffline]);

  // RNF005: acompanha a conexão e esvazia a fila de embarques assim que ela volta
  useEffect(() => {
    return NetInfo.addEventListener((st) => {
      const on = st.isConnected !== false && st.isInternetReachable !== false;
      setIsOnline(on);
      if (on && !isDemo) BoardingService.sincronizarFilaOffline().then(atualizarContadorOffline).catch(() => {});
    });
  }, [isDemo, atualizarContadorOffline]);

  // ---------- Sessão: ações ---------------------------------------------------
  const entrarDemo = (r: TipoUsuario) => { animateNextLayout(); setSim(null); setHoraSimulada(null); carregarDemo(r); };
  const entrar = async (email: string, senha: string) => { await AuthService.entrar(email, senha); };
  const cadastrar: AppContextType['cadastrar'] = (p) => AuthService.cadastrar(p);
  const recuperarSenha = (email: string) => AuthService.recuperarSenha(email);
  const reenviarConfirmacao = (email: string) => AuthService.reenviarConfirmacao(email);
  const sair = async () => {
    if (isDemo) { setIsDemo(false); limpar(); setAuthStatus('deslogado'); return; }
    saindoRef.current = true;
    await PushService.desregistrar();
    await AuthService.sair();
  };
  const excluirConta = async () => {
    if (isDemo) { await sair(); return; }
    saindoRef.current = true;
    await PushService.desregistrar();
    await AuthService.excluirConta();
  };

  const setRole = (r: TipoUsuario) => { if (isDemo) carregarDemo(r); };

  // ---------- Ações de negócio ------------------------------------------------
  const exigirReal = () => { if (!userId) throw new Error('Sessão expirada. Entre novamente.'); };
  const rotulo = () => (role === 'TRANSPORTADOR' ? perfil?.nome ?? 'Motorista' : perfil?.nome ?? 'Responsável');
  const canalTransportador = () =>
    role === 'TRANSPORTADOR' ? userId : alunos.find((a) => a.transportador_id)?.transportador_id ?? '';

  // Demo: com simulação a van segue o percurso montado para ela (só as paradas escolhidas); sem ela, a rota guardada.
  const pontosDemo = useMemo<GPSCoordinate[]>(
    () => (sim ? sim.linha.pontos.map((p) => ({ latitude: p.latitude, longitude: p.longitude, velocidade: VELOCIDADE_DEMO, rua: p.rua })) : ROTA_PONTOS),
    [sim?.linha]); // eslint-disable-line react-hooks/exhaustive-deps
  const pontoDemo = pontosDemo[Math.min(gpsIndex, pontosDemo.length - 1)];
  const gpsPosicao: GPSCoordinate = isDemo ? pontoDemo : gpsReal ?? SEM_SINAL;
  const gpsAtivo = isDemo || !!gpsReal;

  const estimativaRota = useMemo(() => {
    if (isDemo && estadoSim) {
      return { km: estadoSim.kmRestantes, minutos: Math.max(1, Math.round((estadoSim.kmRestantes / 30) * 60)), progresso: estadoSim.progresso };
    }
    if (!isDemo) {
      // Dados reais (motorista): minutos até a última parada, descontando o tempo desde o cálculo da rota
      if (role !== 'TRANSPORTADOR' || !rotaReal?.partidaConhecida || !rotaReal.ordem.length) return null;
      const total = rotaReal.ordem[rotaReal.ordem.length - 1].minutos;
      const restante = Math.max(1, total - Math.floor((relogio - rotaReal.calculadoEm) / 60000));
      const ativos = alunos.filter((a) => a.statusEmbarque !== 'AUSENTE').length;
      const feitos = alunos.filter((a) => a.statusEmbarque === 'EMBARCADO' || a.statusEmbarque === 'DESEMBARCADO').length;
      return { km: total ? rotaReal.km * Math.min(1, restante / total) : rotaReal.km, minutos: restante, progresso: ativos ? feitos / ativos : 0 };
    }
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
  }, [isDemo, estadoSim, gpsIndex, role, rotaReal, relogio, alunos]);

  // Rota mais eficiente (motorista, dados reais): recalcula quando muda quem falta buscar/levar ou o sentido da viagem
  const assinaturaRota = alunos.map((a) => `${a.id}:${a.statusEmbarque}`).join('|');
  const temVanGps = !!gpsReal && gpsReal.latitude !== 0; // o primeiro sinal de GPS refaz a rota, que antes saía sem ponto de partida
  useEffect(() => {
    if (isDemo || role !== 'TRANSPORTADOR') { setRotaReal(null); return; }
    const aguardando = alunos.filter((a) => a.statusEmbarque === 'AGUARDANDO').map((a) => a.id);
    const aBordo = alunos.filter((a) => a.statusEmbarque === 'EMBARCADO').map((a) => a.id);
    if (!aguardando.length && !aBordo.length) { setRotaReal(null); return; }
    const gps = gpsRealRef.current && gpsRealRef.current.latitude !== 0 ? { latitude: gpsRealRef.current.latitude, longitude: gpsRealRef.current.longitude } : null;
    // shortcut: sem sinal de GPS e sem ninguém para buscar, parte de onde o primeiro aluno a bordo embarcou (a van passou por lá); trocar quando houver posição sempre disponível
    const emb = alunos.find((a) => a.statusEmbarque === 'EMBARCADO');
    const lat = viagemAtiva.tipo_viagem === 'IDA' ? emb?.latitude : emb?.entrega_latitude;
    const lon = viagemAtiva.tipo_viagem === 'IDA' ? emb?.longitude : emb?.entrega_longitude;
    const van = gps ?? (!aguardando.length && lat != null && lon != null ? { latitude: lat, longitude: lon } : null);
    let ativo = true;
    DataService.rotaOtimizada({ tipo: viagemAtiva.tipo_viagem, aguardando, aBordo, van })
      .then((r) => { if (ativo) setRotaReal({ ...r, calculadoEm: Date.now() }); })
      .catch((e) => console.warn('Rota otimizada indisponível:', e));
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, role, assinaturaRota, temVanGps, viagemAtiva.tipo_viagem, rotaTick]);
  const recalcularRota = () => setRotaTick((t) => t + 1);

  // Previsão de chegada por aluno. Motorista: da rota que ele mesmo calculou. Responsável: só as linhas dos dependentes dele (RLS).
  const temPrevisao = !!rotaReal || previsoesDb.length > 0;
  useEffect(() => {
    if (!temPrevisao) return;
    const i = setInterval(() => setRelogio(Date.now()), 30000);
    return () => clearInterval(i);
  }, [temPrevisao]);
  const previsoes = useMemo(() => {
    const out: Record<string, { busca?: number; entrega?: number }> = {};
    const restante = (min: number, desde: number) => Math.max(0, min - Math.floor((relogio - desde) / 60000));
    if (role === 'TRANSPORTADOR') {
      if (rotaReal?.partidaConhecida) {
        for (const p of rotaReal.ordem) for (const id of p.alunos) (out[id] ??= {})[p.tipo === 'RETIRADA' ? 'busca' : 'entrega'] = restante(p.minutos, rotaReal.calculadoEm);
      }
    } else {
      for (const r of previsoesDb) (out[r.aluno_id] ??= {})[r.evento === 'BUSCA' ? 'busca' : 'entrega'] = restante(r.minutos, Date.parse(r.calculado_em));
    }
    return out;
  }, [role, rotaReal, previsoesDb, relogio]);

  // Durante a rota a previsão é refeita a cada 3 min (trânsito e posição da van mudam); o custo é 2 chamadas ao roteador por vez
  useEffect(() => {
    if (isDemo || role !== 'TRANSPORTADOR' || viagemAtiva.status !== 'EM_ANDAMENTO') return;
    const i = setInterval(() => setRotaTick((t) => t + 1), 180000);
    return () => clearInterval(i);
  }, [isDemo, role, viagemAtiva.status]);

  // ---------- Simulação de viagem (demo) -------------------------------------
  const teto = (x: { linha: Linha; retomado: boolean }) => (!x.retomado && x.linha.pausaManualEm !== null ? x.linha.pausaManualEm : Infinity);

  const simAcabou = !!sim && sim.t >= sim.linha.duracaoMs;
  useEffect(() => { // relógio da simulação: avança 500 ms por tick e para na pausa manual (Alta) ou no fim
    if (!sim || simAcabou) return;
    const i = setInterval(() => setSim((s) => {
      if (!s) return s;
      const t = Math.min(s.t + 500, s.linha.duracaoMs, Math.max(s.t, teto(s)));
      return t === s.t ? s : { ...s, t };
    }), 500);
    return () => clearInterval(i);
  }, [!!sim, simAcabou]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { // copia o estado derivado da simulação para o estado do app
    if (!isDemo || !sim || !estadoSim) return;
    const e = estadoSim;
    setGpsIndex(e.indice);
    // para o responsável a corrida acaba quando os filhos dele desembarcam; o motorista segue até o fim da rota
    const viagem = visaoDoResponsavel(sim.linha, sim.t, alunos.map((a) => a.id));
    const status = role === 'RESPONSAVEL' && viagem.concluida ? 'CONCLUIDA' : e.viagem;
    setViagemAtiva((v) => (v.id && v.status === status && v.tipo_viagem === sim.linha.config.sentido ? v
      : { ...v, id: v.id || 'viagem-simulada', tipo_viagem: sim.linha.config.sentido, status }));
    setAlunos((prev) => (prev.some((a) => e.statusAluno[a.id] && e.statusAluno[a.id] !== a.statusEmbarque)
      ? prev.map((a) => (e.statusAluno[a.id] ? { ...a, statusEmbarque: e.statusAluno[a.id] } : a)) : prev));
    setNotificacoes((prev) => {
      const ids = new Set(prev.map((n) => n.id));
      const novas = e.notificacoes.filter((n) => !ids.has(n.id) && (!n.alunoId || alunos.some((a) => a.id === n.alunoId)));
      return novas.length ? [...novas.reverse().map((n) => ({ id: n.id, tipo: n.tipo, titulo: n.titulo, mensagem: n.mensagem, dataHora: new Date().toISOString(), lida: false })), ...prev] : prev;
    });
  }, [estadoSim, role, isDemo, alunos]); // eslint-disable-line react-hooks/exhaustive-deps

  const horaKey = estadoSim ? estadoSim.hora.join(':') : null;
  useEffect(() => { // hora de mentira da simulação (próximo dia de aula, para o aviso do dia valer)
    if (!horaKey || !estadoSim) return;
    const d = new Date(); d.setHours(estadoSim.hora[0], estadoSim.hora[1], 0, 0);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    setHoraSimulada(d);
  }, [horaKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const iniciarSimulacao = (c: ConfigSim) => {
    if (!isDemo) return;
    carregarDemo(role); // começa de um estado limpo
    setSim({ linha: montarSimulacao(c), t: 0, retomado: false });
  };
  const pararSimulacao = (suave?: boolean) => {
    if (!isDemo) return;
    if (suave === true) {
      animateNextLayout();
      setSim(null); setHoraSimulada(null); setGpsIndex(0); setViagemAtiva(initialMockData.viagemAtiva);
      setAlunos((prev) => prev.map((a) => ({ ...a, statusEmbarque: initialMockData.alunos.find((x) => x.id === a.id)?.statusEmbarque ?? 'AGUARDANDO', ultimoRegistro: undefined })));
      return;
    }
    setSim(null); setHoraSimulada(null); setGpsIndex(0); carregarDemo(role);
  };
  const retomarSimulacao = () => setSim((s) => (s ? { ...s, retomado: true } : s));
  const pularSimulacao = (alvo: 'SAIDA' | 'PARADA' | 'FIM') => setSim((s) => {
    if (!s) return s;
    const t = Math.min(alvoDoPulo(s.linha, s.t, alvo), teto(s));
    return t > s.t ? { ...s, t } : s;
  });
  const dispararOcorrencia = (g: Gravidade) => setSim((s) => {
    if (!s || s.t >= s.linha.duracaoMs || (s.linha.ocorrenciaEm !== null && s.t >= s.linha.ocorrenciaEm)) return s;
    return { ...s, retomado: false, linha: montarSimulacao({ ...s.linha.config, ocorrencia: g, ocorrenciaEmMs: s.t }) };
  });
  const paradasSim = useMemo(
    () => (sim && role === 'RESPONSAVEL' ? visaoDoResponsavel(sim.linha, sim.t, alunos.map((a) => a.id)).paradas : null), [sim, role, alunos]);
  const simulacao = useMemo(() => (sim && estadoSim
    ? { linha: sim.linha, t: sim.t, estado: { ...estadoSim, esperandoRetomar: estadoSim.esperandoRetomar && !sim.retomado } } : null), [sim, estadoSim]);

  // Na demo qualquer código vale: não há banco para consultar.
  const buscarTransportador = async (codigo: string) => (isDemo ? { id: 'transp-1', nome: 'Tio Marcos' } : DataService.buscarTransportador(codigo));

  const cadastrarAluno = async (a: NovoAluno) => {
    if (isDemo) {
      animateNextLayout();
      setAlunos((p) => [...p, {
        id: novoId('aluno'), responsavel_id: DEMO_RESPONSAVEL, transportador_id: 'transp-1', nome: a.nome, data_nascimento: a.dataNascimento,
        documento: a.documento ?? '', turma: a.turma, turno: a.turno, endereco_busca: a.enderecoBusca, endereco_entrega: a.enderecoEntrega,
        observacoes_medicas: a.observacoes, escola_nome: a.escolaNome, escola_endereco: a.escolaEndereco,
        ativo: true, criado_em: new Date().toISOString(), statusEmbarque: 'AGUARDANDO',
      }]);
      return;
    }
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
    const pos = isDemo ? pontoDemo : gpsReal;
    if (!isDemo) {
      await BoardingService.registrar({
        viagemId: viagemAtiva.id, alunoId, tipo, latitude: pos?.latitude, longitude: pos?.longitude,
      });
      atualizarContadorOffline();
    }
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
      if (!aluno.transportador_id) throw new Error('Vincule este aluno a um transportador antes de avisar uma falta.');
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

  const enviarMensagem = async (texto: string, responsavelId?: string) => {
    const t = texto.trim();
    if (!t) return;
    const origem = role === 'TRANSPORTADOR' ? 'MOTORISTA' : 'PAIS';
    // A conversa é sempre privada: o motorista escolhe o responsável; o responsável só fala por si.
    const dono = role === 'TRANSPORTADOR' ? responsavelId : isDemo ? DEMO_RESPONSAVEL : userId;
    if (!dono) throw new Error('Escolha com qual responsável conversar.');
    if (!isDemo) {
      exigirReal();
      const canal = canalTransportador();
      if (!canal) throw new Error('Vincule-se a um transportador para conversar.');
      await DataService.enviarMensagem({
        canalTransportadorId: canal, responsavelId: dono, remetenteId: userId, remetenteNome: rotulo(), origem, texto: t,
      });
    }
    animateNextLayout();
    setMensagensChat((p) => [...p, {
      id: novoId('msg'), remetenteId: userId || role, remetenteNome: isDemo
        ? (role === 'TRANSPORTADOR' ? 'Tio Marcos (Motorista)' : 'Carlos Silva (Responsável)')
        : rotulo(),
      destinatarioNome: '', texto: t, dataHora: new Date().toISOString(), origem, responsavelId: dono,
    }]);
  };

  const ajustarPino = async (alunoId: string, tipo: 'busca' | 'entrega', latitude: number, longitude: number) => {
    if (isDemo) {
      const campos = tipo === 'busca' ? { latitude, longitude } : { entrega_latitude: latitude, entrega_longitude: longitude };
      setAlunos((p) => p.map((a) => (a.id === alunoId ? { ...a, ...campos } : a)));
      return;
    }
    exigirReal();
    const a = alunos.find((x) => x.id === alunoId);
    const eid = tipo === 'busca' ? a?.endereco_busca_id : a?.endereco_entrega_id;
    if (!eid) throw new Error('Este endereço ainda não foi registrado.');
    await DataService.ajustarPino(eid, latitude, longitude);
    await recarregar();
  };

  const geocodificarEndereco = async (alunoId: string, tipo: 'busca' | 'entrega') => {
    if (isDemo) return { ok: false, mensagem: 'Indisponível na demonstração. Toque no mapa para marcar.' };
    exigirReal();
    const a = alunos.find((x) => x.id === alunoId);
    const eid = tipo === 'busca' ? a?.endereco_busca_id : a?.endereco_entrega_id;
    if (!eid) return { ok: false, mensagem: 'Este endereço ainda não foi registrado.' };
    const r = await DataService.geocodificar(eid);
    await recarregar();
    if (r.ok) return { ok: true };
    return { ok: false, mensagem: r.motivo === 'impreciso' ? 'O endereço está vago demais. Inclua bairro ou CEP, ou toque no mapa.' : 'Não encontramos esse endereço. Toque no mapa para marcar.' };
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

  // Calendário (RF019): o transportador marca feriados, recessos e dias sem aula
  const adicionarEventoCalendario: AppContextType['adicionarEventoCalendario'] = async (e) => {
    if (role !== 'TRANSPORTADOR') throw new Error('Só o motorista edita o calendário.');
    if (!isDemo) { exigirReal(); await DataService.salvarCalendario(userId, e); await recarregar(); return; }
    animateNextLayout();
    setEventos((p) => (e.id ? p.map((x) => (x.id === e.id ? { ...x, ...e, id: x.id } : x)) : [...p, { id: novoId('cal'), descricao: '', ...e }])
      .sort((a, b) => a.data.localeCompare(b.data)));
  };
  const removerEventoCalendario = async (id: string) => {
    if (!isDemo) { exigirReal(); await DataService.removerCalendario(id); }
    animateNextLayout();
    setEventos((p) => p.filter((x) => x.id !== id));
  };

  // Código de convite e vínculo com o transportador (#18)
  const renovarCodigoConvite = async () => {
    if (role !== 'TRANSPORTADOR') throw new Error('Só o motorista tem código de convite.');
    if (isDemo) { setCodigoConvite(Math.random().toString(36).slice(2, 8).toUpperCase()); return; }
    exigirReal();
    setCodigoConvite(await DataService.renovarCodigoConvite());
  };
  const desvincularAluno = async (alunoId: string) => {
    if (!isDemo) { exigirReal(); await DataService.desvincularAluno(alunoId); await recarregar(); return; }
    animateNextLayout();
    setAlunos((prev) => prev.map((a) => (a.id === alunoId ? { ...a, transportador_id: null } : a)));
  };
  const atualizarAluno: AppContextType['atualizarAluno'] = async (alunoId, d) => {
    if (!isDemo) { exigirReal(); await DataService.atualizarAluno(alunoId, d); await recarregar(); return; }
    setAlunos((prev) => prev.map((a) => (a.id === alunoId ? { ...a, ...d, observacoes_medicas: d.observacoes_medicas ?? undefined } : a)));
  };
  const removerAluno = async (alunoId: string) => {
    if (!isDemo) { exigirReal(); await DataService.removerAluno(alunoId, !!alunos.find((a) => a.id === alunoId)?.transportador_id); await recarregar(); return; }
    animateNextLayout();
    setAlunos((prev) => prev.filter((a) => a.id !== alunoId));
  };
  const vincularAluno = async (alunoId: string, codigo: string) => {
    if (!isDemo) { exigirReal(); await DataService.vincularAluno(alunoId, codigo.trim()); await recarregar(); return; }
    animateNextLayout();
    setAlunos((prev) => prev.map((a) => (a.id === alunoId ? { ...a, transportador_id: 'transp-1' } : a)));
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
    entrarDemo, entrar, cadastrar, recuperarSenha, reenviarConfirmacao, sair, excluirConta, recarregar,
    role, setRole, alunos, pessoasAutorizadas, veiculo, temVeiculo: !!veiculo.id,
    viagemAtiva, temViagem: !!viagemAtiva.id, contratos, mensalidades, pagamentos, notificacoes, mensagensChat,
    eventosCalendario, offlineQueueCount, isOnline, gpsPosicao, gpsAtivo, gpsStep: isDemo ? (estadoSim ? Math.min(4, Math.floor(estadoSim.progresso * 5)) : Math.min(4, Math.max(0, PARADAS_ROTA.filter((p) => p <= gpsIndex).length - 1))) : undefined, // posição no mapa esquemático (5 paradas)
    gpsTotalPassos: isDemo ? pontosDemo.length : undefined, estimativaRota,
    rotaGeo: isDemo ? pontosDemo.map((p) => ({ latitude: p.latitude, longitude: p.longitude })) : rotaReal?.pontos ?? [], recalcularRota, previsoes, gpsNegado,
    ajustarPino, geocodificarEndereco,
    simulacao, paradasSim, iniciarSimulacao, pararSimulacao, retomarSimulacao, pularSimulacao, dispararOcorrencia, horaSimulada, buscarTransportador, cadastrarAluno, registrarEmbarque, comunicarAusencia,
    pagarMensalidade, confirmarRecebimento, enviarMensagem, sincronizarFilaOffline, iniciarViagem, finalizarViagem,
    registrarEventoRota, adicionarPessoaAutorizada, removerPessoaAutorizada, renovarCodigoConvite, desvincularAluno, atualizarAluno, removerAluno, vincularAluno, adicionarEventoCalendario, removerEventoCalendario, atualizarVeiculo,
    marcarNotificacoesComoLidas, atualizarPerfil, salvarConfigRecebimento,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [authStatus, isDemo, perfil, codigoConvite, nomes, recebimento, carregandoDados, role, alunos, pessoasAutorizadas,
    veiculo, viagemAtiva, contratos, mensalidades, pagamentos, notificacoes, mensagensChat, eventosCalendario,
    offlineQueueCount, isOnline, gpsIndex, gpsReal, estimativaRota, horaSimulada, simulacao, paradasSim, rotaReal, previsoes, gpsNegado]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  return context;
};
