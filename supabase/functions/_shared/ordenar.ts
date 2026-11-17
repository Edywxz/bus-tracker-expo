// Ordem de menor custo para visitar os nós 1..n-1 a partir do nó 0 (início), respeitando precedências [antes, depois].
// Exato (programação dinâmica) até 12 paradas; acima disso, vizinho mais próximo viável + melhoria 2-opt.
export type Precedencia = [antes: number, depois: number];

const EXATO_ATE = 12;

export function ordenar(custo: number[][], antes: Precedencia[]): number[] {
  const n = custo.length - 1;
  if (n <= 0) return [];
  return n <= EXATO_ATE ? exata(custo, antes, n) : heuristica(custo, antes, n);
}

/** máscara (bit j-1) dos nós que precisam vir antes de cada nó j */
const requisitos = (antes: Precedencia[], n: number) => {
  const pre = new Array<number>(n + 1).fill(0);
  for (const [a, d] of antes) pre[d] |= 1 << (a - 1);
  return pre;
};

export function exata(custo: number[][], antes: Precedencia[], n: number): number[] {
  const pre = requisitos(antes, n);
  const cheio = (1 << n) - 1;
  const dp: number[][] = Array.from({ length: cheio + 1 }, () => new Array(n + 1).fill(Infinity));
  const pai: number[][] = Array.from({ length: cheio + 1 }, () => new Array(n + 1).fill(-1));
  for (let j = 1; j <= n; j++) if (pre[j] === 0) dp[1 << (j - 1)][j] = custo[0][j];
  for (let mask = 1; mask <= cheio; mask++) {
    for (let ult = 1; ult <= n; ult++) {
      const c = dp[mask][ult];
      if (c === Infinity) continue;
      for (let j = 1; j <= n; j++) {
        const bit = 1 << (j - 1);
        if (mask & bit || (pre[j] & ~mask) !== 0) continue;
        const nm = mask | bit, nc = c + custo[ult][j];
        if (nc < dp[nm][j]) { dp[nm][j] = nc; pai[nm][j] = ult; }
      }
    }
  }
  let fim = -1;
  for (let j = 1; j <= n; j++) if (fim < 0 || dp[cheio][j] < dp[cheio][fim]) fim = j;
  if (dp[cheio][fim] === Infinity) throw new Error('precedências impossíveis');
  const ordem: number[] = [];
  for (let mask = cheio, j = fim; j > 0; ) { ordem.push(j); const p = pai[mask][j]; mask &= ~(1 << (j - 1)); j = p; }
  return ordem.reverse();
}

const custoTotal = (custo: number[][], seq: number[]) => seq.reduce((s, j, i) => s + custo[i ? seq[i - 1] : 0][j], 0);
const valida = (seq: number[], pre: number[]) => {
  let visto = 0;
  for (const j of seq) { if ((pre[j] & ~visto) !== 0) return false; visto |= 1 << (j - 1); }
  return true;
};

export function heuristica(custo: number[][], antes: Precedencia[], n: number): number[] {
  const pre = requisitos(antes, n);
  const seq: number[] = [];
  let visto = 0;
  while (seq.length < n) {
    let melhor = -1;
    for (let j = 1; j <= n; j++) {
      if (visto & (1 << (j - 1)) || (pre[j] & ~visto) !== 0) continue;
      if (melhor < 0 || custo[seq.at(-1) ?? 0][j] < custo[seq.at(-1) ?? 0][melhor]) melhor = j;
    }
    if (melhor < 0) throw new Error('precedências impossíveis');
    seq.push(melhor); visto |= 1 << (melhor - 1);
  }
  // 2-opt: inverte trechos enquanto reduzir o custo sem quebrar as precedências
  let melhorou = true;
  while (melhorou) {
    melhorou = false;
    for (let i = 0; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const nova = [...seq.slice(0, i), ...seq.slice(i, k + 1).reverse(), ...seq.slice(k + 1)];
        if (valida(nova, pre) && custoTotal(custo, nova) < custoTotal(custo, seq) - 1e-9) { seq.splice(0, n, ...nova); melhorou = true; }
      }
    }
  }
  return seq;
}
