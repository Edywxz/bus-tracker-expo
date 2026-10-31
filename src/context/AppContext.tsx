import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  TipoUsuario,
  Aluno,
  PessoaAutorizada,
  Veiculo,
  ViagemTransporte,
  ContratoServico,
  Mensalidade,
  MetodoPagamento,
  SeveridadeEvento,
  PeriodoAusencia,
} from '../types/database';
import { initialMockData, MockDataState } from '../services/mockData';
import { BoardingService } from '../services/boardingService';
import { PaymentService } from '../services/paymentService';
import { LocationTrackerService } from '../services/locationTracker';
import { isSupabaseConfigured, supabase } from '../services/supabase';
import { SecurityService } from '../services/security';

interface GPSCoordinate {
  latitude: number;
  longitude: number;
  velocidade: number;
  rua: string;
}

interface AppContextType {
  role: TipoUsuario;
  setRole: (role: TipoUsuario) => void;
  alunos: MockDataState['alunos'];
  pessoasAutorizadas: PessoaAutorizada[];
  veiculo: Veiculo;
  viagemAtiva: ViagemTransporte;
  contratos: ContratoServico[];
  mensalidades: Mensalidade[];
  notificacoes: MockDataState['notificacoes'];
  mensagensChat: MockDataState['mensagensChat'];
  eventosCalendario: MockDataState['eventosCalendario'];
  offlineQueueCount: number;
  isOnline: boolean;
  gpsPosicao: GPSCoordinate;
  simularPassoGps: () => void;
  registrarEmbarque: (alunoId: string, tipo: 'EMBARQUE' | 'DESEMBARQUE') => Promise<void>;
  comunicarAusencia: (alunoId: string, periodo: PeriodoAusencia, motivo: string) => Promise<void>;
  pagarMensalidade: (
    mensalidadeId: string,
    metodo: MetodoPagamento,
    detalhes?: any
  ) => Promise<{ sucesso: boolean; reciboHash?: string }>;
  enviarMensagem: (texto: string) => Promise<void>;
  sincronizarFilaOffline: () => Promise<{ sincronizados: number; erros: number }>;
  iniciarViagem: (tipo: 'IDA' | 'VOLTA', turno: 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE') => Promise<void>;
  finalizarViagem: () => Promise<void>;
  registrarEventoRota: (tipo: string, descricao: string, severidade: SeveridadeEvento) => Promise<void>;
  adicionarPessoaAutorizada: (pessoa: Omit<PessoaAutorizada, 'id' | 'ativo'>) => void;
  removerPessoaAutorizada: (id: string) => void;
  atualizarVeiculo: (dados: Partial<Veiculo>) => void;
  marcarNotificacoesComoLidas: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Pontos de parada pré-programados para simulação dinâmica do trajeto (RF003, RNF002)
const ROTA_PONTOS: GPSCoordinate[] = [
  { latitude: -23.55052, longitude: -46.633308, velocidade: 28, rua: 'Av. Paulista, próx. ao MASP' },
  { latitude: -23.55312, longitude: -46.638411, velocidade: 35, rua: 'Rua Augusta, 980 (Gabriel embarcou)' },
  { latitude: -23.55743, longitude: -46.64219, velocidade: 22, rua: 'Rua das Flores, 142 (Lucas embarcou)' },
  { latitude: -23.56105, longitude: -46.64732, velocidade: 40, rua: 'Av. Brasil, sentido Jardins' },
  { latitude: -23.56581, longitude: -46.65214, velocidade: 15, rua: 'Av. Tiradentes, 850 (Colégio Santa Maria)' },
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<TipoUsuario>(initialMockData.currentRole);
  const [alunos, setAlunos] = useState(initialMockData.alunos);
  const [pessoasAutorizadas, setPessoasAutorizadas] = useState(initialMockData.pessoasAutorizadas);
  const [veiculo, setVeiculo] = useState(initialMockData.veiculo);
  const [viagemAtiva, setViagemAtiva] = useState(initialMockData.viagemAtiva);
  const [contratos, setContratos] = useState(initialMockData.contratos);
  const [mensalidades, setMensalidades] = useState(initialMockData.mensalidades);
  const [notificacoes, setNotificacoes] = useState(initialMockData.notificacoes);
  const [mensagensChat, setMensagensChat] = useState(initialMockData.mensagensChat);
  const [eventosCalendario, setEventosCalendario] = useState(initialMockData.eventosCalendario);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [gpsIndex, setGpsIndex] = useState(2); // Inicia na parada do Lucas

  // Inicializa verificação de fila offline
  useEffect(() => {
    atualizarContadorOffline();
  }, []);

  const atualizarContadorOffline = async () => {
    try {
      const fila = await BoardingService.obterFilaOffline();
      setOfflineQueueCount(fila.length);
    } catch {
      setOfflineQueueCount(0);
    }
  };

  const simularPassoGps = async () => {
    const proximoIndex = (gpsIndex + 1) % ROTA_PONTOS.length;
    setGpsIndex(proximoIndex);
    const pos = ROTA_PONTOS[proximoIndex];

    // Transmite se Supabase estiver ativo
    if (isSupabaseConfigured() && viagemAtiva.status === 'EM_ANDAMENTO') {
      try {
        await LocationTrackerService.enviarLocalizacao({
          viagemId: viagemAtiva.id,
          transportadorId: viagemAtiva.transportador_id,
          latitude: pos.latitude,
          longitude: pos.longitude,
          velocidade: pos.velocidade,
        });
      } catch (err) {
        console.warn('Falha ao enviar telemetria GPS:', err);
      }
    }
  };

  // RF007, RNF005: Registrar Embarque / Desembarque com suporte offline
  const registrarEmbarque = async (alunoId: string, tipo: 'EMBARQUE' | 'DESEMBARQUE') => {
    const horaFormatada = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const pos = ROTA_PONTOS[gpsIndex];

    const result = await BoardingService.registrar({
      viagemId: viagemAtiva.id,
      alunoId,
      tipo,
      latitude: pos.latitude,
      longitude: pos.longitude,
    });

    setAlunos((prev) =>
      prev.map((aluno) => {
        if (aluno.id === alunoId) {
          const novoStatus = tipo === 'EMBARQUE' ? 'EMBARCADO' : 'DESEMBARCADO';
          const texto =
            tipo === 'EMBARQUE'
              ? `Hoje às ${horaFormatada} (Embarcou na van)`
              : `Hoje às ${horaFormatada} (Desembarcou no destino)`;
          return { ...aluno, statusEmbarque: novoStatus, ultimoRegistro: texto };
        }
        return aluno;
      })
    );

    // Notificação automática gerada
    const aluno = alunos.find((a) => a.id === alunoId);
    if (aluno) {
      const novaNotif = {
        id: `notif-${Date.now()}`,
        tipo: 'EMBARQUE' as const,
        titulo: tipo === 'EMBARQUE' ? '🎒 Embarque Confirmado' : '🏫 Desembarque Concluído',
        mensagem: `${aluno.nome} foi registrado com sucesso (${tipo === 'EMBARQUE' ? 'Embarque' : 'Desembarque'}) às ${horaFormatada}.`,
        dataHora: new Date().toISOString(),
        lida: false,
      };
      setNotificacoes((prev) => [novaNotif, ...prev]);
    }

    await atualizarContadorOffline();
  };

  // RF009: Comunicar Ausência pelos Pais
  const comunicarAusencia = async (alunoId: string, periodo: PeriodoAusencia, motivo: string) => {
    setAlunos((prev) =>
      prev.map((aluno) => {
        if (aluno.id === alunoId) {
          return {
            ...aluno,
            statusEmbarque: 'AUSENTE',
            ultimoRegistro: `Falta comunicada pelos pais (${periodo}): ${motivo || 'Sem justificativa detalhada'}`,
          };
        }
        return aluno;
      })
    );

    // Adiciona notificação de ausência
    const aluno = alunos.find((a) => a.id === alunoId);
    const novaNotif = {
      id: `notif-${Date.now()}`,
      tipo: 'AVISO' as const,
      titulo: '⚠️ Falta Comunicada',
      mensagem: `Os responsáveis de ${aluno?.nome || 'um aluno'} comunicaram ausência para o período ${periodo}. Motivo: ${motivo || 'Motivos particulares'}.`,
      dataHora: new Date().toISOString(),
      lida: false,
    };
    setNotificacoes((prev) => [novaNotif, ...prev]);

    // Mensagem automática no chat do transportador
    const novaMsg = {
      id: `msg-${Date.now()}`,
      remetenteId: 'resp-1',
      remetenteNome: 'Carlos Silva (Pai)',
      destinatarioNome: 'Tio Marcos (Motorista)',
      texto: `Olá Tio Marcos, informo que o(a) ${aluno?.nome} não utilizará o transporte no período ${periodo}. Motivo: ${motivo}.`,
      dataHora: new Date().toISOString(),
      origem: 'PAIS' as const,
    };
    setMensagensChat((prev) => [...prev, novaMsg]);
  };

  // RF005, RF012: Pagar Mensalidade com PIX, Cartão ou Boleto e gerar recibo
  const pagarMensalidade = async (
    mensalidadeId: string,
    metodo: MetodoPagamento,
    detalhes?: any
  ): Promise<{ sucesso: boolean; reciboHash?: string }> => {
    const mensalidade = mensalidades.find((m) => m.id === mensalidadeId);
    if (!mensalidade) return { sucesso: false };

    const reciboHash = SecurityService.generateReceiptHash(
      mensalidadeId,
      mensalidade.valor,
      new Date().toISOString()
    );

    if (isSupabaseConfigured()) {
      try {
        await PaymentService.registrarPagamento({
          mensalidadeId,
          metodo,
          valorPago: mensalidade.valor,
          transacaoId: reciboHash,
          detalhes,
        });
      } catch (e) {
        console.warn('Erro ao salvar no Supabase, registrando localmente:', e);
      }
    }

    setMensalidades((prev) =>
      prev.map((m) => (m.id === mensalidadeId ? { ...m, status: 'PAGO' } : m))
    );

    // Cria notificação de confirmação
    const novaNotif = {
      id: `notif-${Date.now()}`,
      tipo: 'PAGAMENTO' as const,
      titulo: '✅ Pagamento Confirmado',
      mensagem: `A mensalidade de ${mensalidade.mes_referencia}/${mensalidade.ano_referencia} (${SecurityService.formatCurrency(mensalidade.valor)}) foi paga com sucesso via ${metodo}.`,
      dataHora: new Date().toISOString(),
      lida: false,
    };
    setNotificacoes((prev) => [novaNotif, ...prev]);

    return { sucesso: true, reciboHash };
  };

  // RF008: Troca de mensagens direta
  const enviarMensagem = async (texto: string) => {
    if (!texto.trim()) return;

    let remetenteNome = 'Carlos Silva (Pai)';
    let origem: 'PAIS' | 'MOTORISTA' | 'ESCOLA' = 'PAIS';

    if (role === 'TRANSPORTADOR') {
      remetenteNome = 'Tio Marcos (Motorista)';
      origem = 'MOTORISTA';
    } else if (role === 'INSTITUICAO') {
      remetenteNome = 'Coordenação Santa Maria';
      origem = 'ESCOLA';
    }

    const novaMsg = {
      id: `msg-${Date.now()}`,
      remetenteId: role,
      remetenteNome,
      destinatarioNome: role === 'TRANSPORTADOR' ? 'Pais & Alunos' : 'Tio Marcos',
      texto,
      dataHora: new Date().toISOString(),
      origem,
    };

    setMensagensChat((prev) => [...prev, novaMsg]);
  };

  // RNF005: Sincronização offline
  const sincronizarFilaOffline = async () => {
    const res = await BoardingService.sincronizarFilaOffline();
    await atualizarContadorOffline();
    return res;
  };

  // RF020: Iniciar trajeto
  const iniciarViagem = async (tipo: 'IDA' | 'VOLTA', turno: 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE') => {
    const novaViagem: ViagemTransporte = {
      ...viagemAtiva,
      tipo_viagem: tipo,
      turno,
      status: 'EM_ANDAMENTO',
      data_hora_inicio: new Date().toISOString(),
      km_percorrido: 0,
    };
    setViagemAtiva(novaViagem);

    const novaNotif = {
      id: `notif-${Date.now()}`,
      tipo: 'AVISO' as const,
      titulo: `🚀 Rota de ${tipo === 'IDA' ? 'Ida para a Escola' : 'Retorno para Casa'} Iniciada!`,
      mensagem: `O transportador iniciou o trajeto do turno ${turno}. O acompanhamento em tempo real já está ativo.`,
      dataHora: new Date().toISOString(),
      lida: false,
    };
    setNotificacoes((prev) => [novaNotif, ...prev]);
  };

  // Finalizar trajeto
  const finalizarViagem = async () => {
    setViagemAtiva((prev) => ({
      ...prev,
      status: 'CONCLUIDA',
      data_hora_fim: new Date().toISOString(),
    }));

    const novaNotif = {
      id: `notif-${Date.now()}`,
      tipo: 'AVISO' as const,
      titulo: '🏁 Viagem Concluída',
      mensagem: 'O transportador finalizou o trajeto de transporte com segurança.',
      dataHora: new Date().toISOString(),
      lida: false,
    };
    setNotificacoes((prev) => [novaNotif, ...prev]);
  };

  // RF011: Registrar evento de emergência / imprevisto
  const registrarEventoRota = async (tipo: string, descricao: string, severidade: SeveridadeEvento) => {
    const novaNotif = {
      id: `notif-${Date.now()}`,
      tipo: 'EMERGENCIA' as const,
      titulo: `🚨 Alerta de Rota: ${tipo} (${severidade})`,
      mensagem: `Ocorrência registrada pelo motorista: "${descricao}". A van pode sofrer atrasos.`,
      dataHora: new Date().toISOString(),
      lida: false,
    };
    setNotificacoes((prev) => [novaNotif, ...prev]);

    const msgAlerta = {
      id: `msg-${Date.now()}`,
      remetenteId: 'transp-1',
      remetenteNome: 'Tio Marcos (Motorista)',
      destinatarioNome: 'Todos os Pais e Escola',
      texto: `[ALERTA DE TRÂNSITO] ${tipo}: ${descricao}`,
      dataHora: new Date().toISOString(),
      origem: 'MOTORISTA' as const,
    };
    setMensagensChat((prev) => [...prev, msgAlerta]);
  };

  // RF018: Manter Pessoas Autorizadas
  const adicionarPessoaAutorizada = (pessoa: Omit<PessoaAutorizada, 'id' | 'ativo'>) => {
    const nova: PessoaAutorizada = {
      ...pessoa,
      id: `pa-${Date.now()}`,
      ativo: true,
    };
    setPessoasAutorizadas((prev) => [...prev, nova]);
  };

  const removerPessoaAutorizada = (id: string) => {
    setPessoasAutorizadas((prev) => prev.filter((p) => p.id !== id));
  };

  // RF013: Manter Veículo
  const atualizarVeiculo = (dados: Partial<Veiculo>) => {
    setVeiculo((prev) => ({ ...prev, ...dados }));
  };

  const marcarNotificacoesComoLidas = () => {
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        alunos,
        pessoasAutorizadas,
        veiculo,
        viagemAtiva,
        contratos,
        mensalidades,
        notificacoes,
        mensagensChat,
        eventosCalendario,
        offlineQueueCount,
        isOnline,
        gpsPosicao: ROTA_PONTOS[gpsIndex],
        simularPassoGps,
        registrarEmbarque,
        comunicarAusencia,
        pagarMensalidade,
        enviarMensagem,
        sincronizarFilaOffline,
        iniciarViagem,
        finalizarViagem,
        registrarEventoRota,
        adicionarPessoaAutorizada,
        removerPessoaAutorizada,
        atualizarVeiculo,
        marcarNotificacoesComoLidas,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  }
  return context;
};

