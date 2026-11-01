export const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** 12122016 -> 12/12/2016 (máscara enquanto digita) */
export function maskDate(s: string) {
  const d = onlyDigits(s).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** "12/04/2016" -> "2016-04-12". Retorna null se a data não existir. */
export function dateToISO(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (d.getFullYear() !== Number(yyyy) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export const isoToBR = (iso?: string | null) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export function maskPhone(s: string) {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCpf(s: string) {
  const d = onlyDigits(s).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function maskPlaca(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function parseMoney(s: string): number | null {
  const n = Number(s.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const nomeMes = (m: number) => MESES[(m - 1 + 12) % 12];

/** "2026-11-02" -> { dia: '02', mes: 'NOV' } */
export function partesData(iso: string) {
  const [, m, d] = iso.slice(0, 10).split('-');
  return { dia: d, mes: nomeMes(Number(m)).slice(0, 3).toUpperCase() };
}

export function tempoRelativo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'ontem';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export const horaCurta = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** Remove emojis do começo de textos antigos/mocks (a UI usa ícones). */
export const semEmoji = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, '').trim();

export function mensagemErro(e: unknown, padrao = 'Não foi possível concluir. Tente novamente.') {
  const m = (e as { message?: string })?.message;
  if (!m) return padrao;
  if (/network|fetch|timeout/i.test(m)) return 'Sem conexão. Verifique sua internet e tente de novo.';
  if (/row-level security|permission denied|42501/i.test(m)) return 'Você não tem permissão para essa ação.';
  if (/duplicate key|23505/i.test(m)) return 'Esse registro já existe.';
  return m.length < 140 ? m : padrao;
}
