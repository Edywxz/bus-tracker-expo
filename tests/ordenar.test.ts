import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ordenar, exata, heuristica, type Precedencia } from '../supabase/functions/_shared/ordenar.ts';

// matriz euclidiana a partir de pontos (nó 0 = início) e gerador pseudoaleatório fixo
const matriz = (pts: [number, number][]) => pts.map((a) => pts.map((b) => Math.hypot(a[0] - b[0], a[1] - b[1])));
const rnd = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
const custoDe = (m: number[][], seq: number[]) => seq.reduce((s, j, i) => s + m[i ? seq[i - 1] : 0][j], 0);
const perms = (a: number[]): number[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const respeita = (seq: number[], ant: Precedencia[]) => ant.every(([a, d]) => seq.indexOf(a) < seq.indexOf(d));
const instancia = (n: number, seed: number) => {
  const r = rnd(seed);
  const m = matriz(Array.from({ length: n + 1 }, () => [r() * 10, r() * 10] as [number, number]));
  const ant: Precedencia[] = [];
  for (let d = 2; d <= n; d += 2) ant.push([d - 1, d]); // pares (busca, entrega)
  return { m, ant };
};

test('ordenar: sem precedências segue o caminho mais curto numa reta', () => {
  assert.deepEqual(ordenar(matriz([[0, 0], [3, 0], [1, 0], [2, 0]]), []), [2, 3, 1]);
});

test('ordenar: respeita "antes" mesmo quando o nó mais perto seria a entrega', () => {
  // nó 1 (entrega) é o mais próximo do início, mas só pode ser visitado depois do nó 2 (busca)
  const m = matriz([[0, 0], [1, 0], [5, 0]]);
  assert.deepEqual(ordenar(m, [[2, 1]]), [2, 1]);
});

test('exata acha o mesmo custo mínimo que a força bruta', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const { m, ant } = instancia(7, seed);
    const bruta = Math.min(...perms([1, 2, 3, 4, 5, 6, 7]).filter((p) => respeita(p, ant)).map((p) => custoDe(m, p)));
    const ord = exata(m, ant, 7);
    assert.ok(respeita(ord, ant));
    assert.ok(Math.abs(custoDe(m, ord) - bruta) < 1e-9, `seed ${seed}`);
  }
});

test('heurística: ordem válida e perto do ótimo', () => {
  for (const seed of [11, 12, 13, 14, 15, 16]) {
    const { m, ant } = instancia(10, seed);
    const h = heuristica(m, ant, 10);
    assert.deepEqual([...h].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.ok(respeita(h, ant));
    assert.ok(custoDe(m, h) <= custoDe(m, exata(m, ant, 10)) * 1.3, `seed ${seed}`);
  }
});

test('ordenar: precedência circular é recusada', () => {
  assert.throws(() => ordenar(matriz([[0, 0], [1, 0], [2, 0]]), [[1, 2], [2, 1]]));
});
