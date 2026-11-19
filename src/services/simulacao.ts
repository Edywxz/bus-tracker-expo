// Simulação de viagem do modo demonstração. Puro (sem React Native): monta a linha do tempo da viagem a partir das
// escolhas do usuário e diz, para qualquer instante t, em que estado o app deve estar. Pular = escolher outro t.
import { DEMO_ROTA } from './demoRota.ts';
import { distanciaKm } from '../utils/proximidade.ts';

// Tempos (ms ou s) da simulação; ajuste aqui.
const S_POR_KM = 4.5; // garagem → 1ª casa da rota completa ≈ 10 s
const PERNA_MIN_S = 6;
const PERNA_ESCOLA_MIN_S = 15; // perna da ida até a primeira escola
const PARADA_S = 4;
const AVISO_S = 3; // "van chegando" X s antes de chegar à casa
const T_ESPERANDO = 3000;
const T_SAIDA = 6000;
const T_REGISTRO = 2000; // embarque/desembarque X ms depois de parar

export type Sentido = 'IDA' | 'VOLTA';
export type Gravidade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA';
export interface ConfigSim { sentido: Sentido; alunoIds: string[]; ocorrencia: Gravidade | null; ocorrenciaEmMs?: number }
export type StatusAlunoSim = 'AGUARDANDO' | 'EMBARCADO' | 'DESEMBARCADO' | 'AUSENTE';
/** Trecho em que a van anda de `de` até `para` (índices de DEMO_ROTA.pontos); parada quando de === para. */
export interface Segmento { t0: number; t1: number; de: number; para: number }
export type EventoSim =
  | { t: number; tipo: 'FASE'; fase: 'PREPARAR' | 'ESPERANDO' | 'SAIDA' }
  | { t: number; tipo: 'PARADA'; lugar: string }
  | { t: number; tipo: 'CHEGANDO' | 'EMBARQUE' | 'DESEMBARQUE'; alunoId: string }
  | { t: number; tipo: 'OCORRENCIA'; gravidade: Gravidade }
  | { t: number; tipo: 'FIM' | 'ENCERRADA' };
export interface Linha {
  config: ConfigSim; duracaoMs: number; segmentos: Segmento[]; eventos: EventoSim[];
  ocorrenciaEm: number | null; pausaManualEm: number | null;
}
export interface NotifSim { id: string; tipo: 'CHEGANDO' | 'EMBARQUE' | 'EMERGENCIA'; titulo: string; mensagem: string; alunoId?: string }
export interface EstadoSim {
  indice: number; fase: 'PREPARAR' | 'ESPERANDO' | 'EM_ROTA' | 'FIM' | 'ENCERRADA';
  viagem: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA'; hora: [number, number];
  statusAluno: Record<string, StatusAlunoSim>; notificacoes: NotifSim[]; parada: boolean;
  kmRestantes: number; progresso: number; ocorrencia: Gravidade | null; esperandoRetomar: boolean;
}

/** Casa e escola (ids de DEMO_ROTA.paradas) de cada aluno da demo (ids de mockData). */
export const ALUNOS_SIM: Record<string, { casa: string; escola: string }> = {
  'aluno-1': { casa: 'lucas', escola: 'santaMaria' },
  'aluno-2': { casa: 'beatriz', escola: 'santaMaria' },
  'aluno-3': { casa: 'gabriel', escola: 'santaMaria' },
  'aluno-4': { casa: 'sofia', escola: 'santaMaria' },
  'aluno-5': { casa: 'ana', escola: 'aurora' },
};
const NOMES: Record<string, string> = { 'aluno-1': 'Lucas', 'aluno-2': 'Beatriz', 'aluno-3': 'Gabriel', 'aluno-4': 'Sofia', 'aluno-5': 'Ana' };
const HORA: Record<Sentido, [number, number][]> = {
  IDA: [[6, 30], [6, 45], [6, 50]],
  VOLTA: [[11, 50], [12, 5], [12, 10]],
};

const indiceDe = (lugar: string) => DEMO_ROTA.paradas.find((p) => p.id === lugar)!.indice;
const kmEntre = (de: number, para: number) => {
  let km = 0;
  for (let i = Math.min(de, para); i < Math.max(de, para); i++) km += distanciaKm(DEMO_ROTA.pontos[i], DEMO_ROTA.pontos[i + 1]);
  return km;
};

interface Parada { lugar: string; casa: boolean }

/** Paradas da viagem, na ordem em que a van passa. */
function paradasDe(c: ConfigSim): Parada[] {
  const casas = c.alunoIds.map((a) => ALUNOS_SIM[a].casa);
  const escolas = [...new Set(c.alunoIds.map((a) => ALUNOS_SIM[a].escola))];
  const porIndice = (a: string, b: string) => indiceDe(a) - indiceDe(b);
  const cs = casas.sort(porIndice).map((lugar) => ({ lugar, casa: true }));
  const es = escolas.sort(porIndice).map((lugar) => ({ lugar, casa: false }));
  return c.sentido === 'IDA' ? [...cs, ...es] : [...es.reverse(), ...cs.reverse()];
}

export function montarSimulacao(c: ConfigSim): Linha {
  if (!c.alunoIds.length) throw new Error('Escolha ao menos um aluno.');
  const eventos: EventoSim[] = [
    { t: 0, tipo: 'FASE', fase: 'PREPARAR' }, { t: T_ESPERANDO, tipo: 'FASE', fase: 'ESPERANDO' }, { t: T_SAIDA, tipo: 'FASE', fase: 'SAIDA' },
  ];
  const segmentos: Segmento[] = [];
  const paradas = paradasDe(c);
  let t = T_SAIDA;
  let atual = c.sentido === 'IDA' ? 0 : indiceDe(paradas[0].lugar);
  const primeiraEscola = paradas.find((p) => !p.casa)!.lugar;

  for (const p of paradas) {
    const destino = indiceDe(p.lugar);
    const inicioPerna = t;
    if (destino !== atual) {
      const minimo = (c.sentido === 'IDA' && p.lugar === primeiraEscola ? PERNA_ESCOLA_MIN_S : PERNA_MIN_S) * 1000;
      const dur = Math.round(Math.max(kmEntre(atual, destino) * S_POR_KM * 1000, minimo));
      segmentos.push({ t0: t, t1: t + dur, de: atual, para: destino });
      t += dur;
    }
    const chegada = t;
    eventos.push({ t: chegada, tipo: 'PARADA', lugar: p.lugar });
    // quem está nesta parada: na casa, o dono dela; na escola, os alunos que vão para ela
    const aqui = c.alunoIds.filter((a) => ALUNOS_SIM[a][p.casa ? 'casa' : 'escola'] === p.lugar);
    for (const alunoId of aqui) {
      if (p.casa) eventos.push({ t: Math.max(inicioPerna, chegada - AVISO_S * 1000), tipo: 'CHEGANDO', alunoId });
      eventos.push({ t: chegada + T_REGISTRO, tipo: (c.sentido === 'IDA') === p.casa ? 'EMBARQUE' : 'DESEMBARQUE', alunoId });
    }
    segmentos.push({ t0: chegada, t1: chegada + PARADA_S * 1000, de: destino, para: destino });
    t += PARADA_S * 1000;
    atual = destino;
  }
  eventos.push({ t, tipo: 'FIM' });
  eventos.sort((a, b) => a.t - b.t);
  return { config: c, duracaoMs: t, segmentos, eventos, ocorrenciaEm: null, pausaManualEm: null };
}

export function estadoEm(l: Linha, t: number): EstadoSim {
  const { config: c } = l;
  const feitos = l.eventos.filter((e) => e.t <= t);
  const statusAluno: Record<string, StatusAlunoSim> = {};
  for (const id of Object.keys(ALUNOS_SIM)) statusAluno[id] = c.alunoIds.includes(id) ? 'AGUARDANDO' : 'AUSENTE';
  const notificacoes: NotifSim[] = [];
  let fase: EstadoSim['fase'] = 'PREPARAR';
  let faseHora = 0;
  for (const e of feitos) {
    if (e.tipo === 'FASE') { faseHora = e.fase === 'PREPARAR' ? 0 : e.fase === 'ESPERANDO' ? 1 : 2; fase = e.fase === 'SAIDA' ? 'EM_ROTA' : e.fase; }
    else if (e.tipo === 'FIM' || e.tipo === 'ENCERRADA') fase = e.tipo === 'FIM' ? 'FIM' : 'ENCERRADA';
    else if (e.tipo === 'CHEGANDO' || e.tipo === 'EMBARQUE' || e.tipo === 'DESEMBARQUE') {
      const nome = NOMES[e.alunoId];
      if (e.tipo !== 'CHEGANDO') statusAluno[e.alunoId] = e.tipo === 'EMBARQUE' ? 'EMBARCADO' : 'DESEMBARCADO';
      notificacoes.push(e.tipo === 'CHEGANDO'
        ? { id: `sim-${e.tipo}-${e.alunoId}-${e.t}`, tipo: 'CHEGANDO', titulo: 'A van está chegando', alunoId: e.alunoId,
            mensagem: c.sentido === 'IDA' ? `A van está perto: ${nome} será buscado em instantes.` : `A van está perto de casa com ${nome}.` }
        : { id: `sim-${e.tipo}-${e.alunoId}-${e.t}`, tipo: 'EMBARQUE', alunoId: e.alunoId,
            titulo: e.tipo === 'EMBARQUE' ? 'Embarque confirmado' : 'Desembarque concluído',
            mensagem: `${nome} ${e.tipo === 'EMBARQUE' ? 'embarcou na van' : 'desembarcou'}.` });
    }
  }

  const seg = [...l.segmentos].reverse().find((s) => s.t0 <= t) ?? l.segmentos[0];
  const antesDaSaida = t < l.segmentos[0].t0;
  const f = antesDaSaida ? 0 : Math.min(1, (t - seg.t0) / (seg.t1 - seg.t0));
  const indice = antesDaSaida ? seg.de : Math.round(seg.de + (seg.para - seg.de) * f);
  const total = l.segmentos.reduce((s, x) => s + kmEntre(x.de, x.para), 0);
  const kmRestantes = antesDaSaida ? total
    : l.segmentos.reduce((s, x) => s + (x.t0 > t ? kmEntre(x.de, x.para) : x === seg ? kmEntre(x.de, x.para) * (1 - f) : 0), 0);

  return {
    indice, fase, viagem: fase === 'FIM' || fase === 'ENCERRADA' ? 'CONCLUIDA' : fase === 'EM_ROTA' ? 'EM_ANDAMENTO' : 'AGENDADA',
    hora: HORA[c.sentido][faseHora], statusAluno, notificacoes,
    parada: antesDaSaida || (seg.de === seg.para && t < seg.t1), kmRestantes, progresso: total ? 1 - kmRestantes / total : 1,
    ocorrencia: null, esperandoRetomar: false,
  };
}

/** Instante para onde um atalho leva a simulação. */
export function alvoDoPulo(l: Linha, t: number, alvo: 'SAIDA' | 'PARADA' | 'FIM'): number {
  if (alvo === 'SAIDA') return T_SAIDA;
  if (alvo === 'FIM') return l.duracaoMs;
  return l.eventos.find((e) => e.tipo === 'PARADA' && e.t > t)?.t ?? l.duracaoMs;
}
