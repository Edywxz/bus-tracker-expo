import type { Turno } from '../types/database';

type Aluno = { nome: string; turno: Turno; statusEmbarque: string };
type Evento = { data: string; tipo: string };
export interface Lembrete { tone: 'info' | 'warning'; texto: string }

// shortcut: horários fixos por turno (o banco não guarda horário por aluno), trocar por campo em `alunos` quando houver migration.
const ENTRADA: Record<Turno, [number, number]> = { MANHA: [7, 30], TARDE: [13, 0], INTEGRAL: [7, 30], NOITE: [19, 0] };
const ANTECEDENCIA_VAN = 45; // min entre a van passar e a entrada na escola
const PREPARAR = 30;         // min antes da van para começar a preparar o aluno

const hhmm = (min: number) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
const lista = (n: string[]) => (n.length > 1 ? `${n.slice(0, -1).join(', ')} e ${n[n.length - 1]}` : n[0]);
const km = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
const primeiro = (n: string) => n.split(' ')[0];

/** Hoje é dia de aula? Seg–sex e sem feriado/recesso no calendário. */
export const diaLetivo = (agora: Date, eventos: Evento[]) => {
  const dia = agora.getDay();
  const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
  return dia > 0 && dia < 6 && !eventos.some((e) => e.data === hoje && (e.tipo === 'FERIADO' || e.tipo === 'RECESSO'));
};

/**
 * Aviso para o responsável conforme a hora e a posição da van.
 * `kmVan`: distância da van até a parada do dependente que ela atende agora (null se desconhecida).
 */
export function lembrete(p: {
  agora: Date; alunos: Aluno[]; eventos: Evento[]; emRota: boolean; tipo: 'IDA' | 'VOLTA'; concluida: boolean; kmVan: number | null;
}): Lembrete | null {
  const { agora, alunos, eventos, emRota, tipo, concluida, kmVan } = p;
  if (!diaLetivo(agora, eventos)) return null;
  const nomes = (st: string) => alunos.filter((a) => a.statusEmbarque === st).map((a) => primeiro(a.nome));

  if (emRota && tipo === 'VOLTA') {
    const n = nomes('EMBARCADO');
    if (!n.length) return null;
    return { tone: 'warning', texto: `A van está voltando com ${lista(n)}${kmVan != null ? ` (a ${km(kmVan)})` : ''}. Esteja no portão para receber.` };
  }

  const aguardando = alunos.filter((a) => a.statusEmbarque === 'AGUARDANDO');
  if (!aguardando.length || concluida) return null;

  if (emRota) {
    const n = lista(aguardando.map((a) => primeiro(a.nome)));
    return kmVan != null && kmVan <= 1
      ? { tone: 'warning', texto: `A van está chegando (a ${km(kmVan)}). Espere ${n} no portão.` }
      : { tone: 'info', texto: `A van já saiu${kmVan != null ? ` e está a ${km(kmVan)}` : ''}. Prepare ${n} para sair.` };
  }

  // Antes da rota: usa o turno que entra primeiro.
  const min = (a: Aluno) => ENTRADA[a.turno][0] * 60 + ENTRADA[a.turno][1];
  const entrada = Math.min(...aguardando.map(min));
  const van = entrada - ANTECEDENCIA_VAN;
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  if (agoraMin >= entrada) return null;
  const n = lista(aguardando.filter((a) => min(a) === entrada).map((a) => primeiro(a.nome)));
  if (agoraMin < van - PREPARAR) return { tone: 'info', texto: `Hoje é dia de aula. ${n} entra às ${hhmm(entrada)}; a van passa por volta das ${hhmm(van)}.` };
  if (agoraMin <= van) return { tone: 'warning', texto: `Hora de preparar ${n} para sair: a van passa por volta das ${hhmm(van)}. Espere no portão.` };
  return { tone: 'warning', texto: `A van ainda não saiu (previsto ${hhmm(van)}). Mantenha ${n} pronto para sair; avisamos quando ela partir.` };
}
