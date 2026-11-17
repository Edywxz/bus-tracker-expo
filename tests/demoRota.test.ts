import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_LUGARES as L, DEMO_ROTA as R } from '../src/services/demoRota.ts';
import { distanciaKm } from '../src/utils/proximidade.ts';

const m = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => distanciaKm(a, b) * 1000;

test('rota demo: todos os lugares são endereços reais de São Paulo', () => {
  for (const l of Object.values(L)) {
    assert.ok(l.latitude < -23.3 && l.latitude > -24 && l.longitude < -46.3 && l.longitude > -46.9, `${l.rotulo} fora de São Paulo`);
  }
});

test('rota demo: a van para perto de cada endereço, na ordem da rota', () => {
  assert.equal(R.paradas.length, R.ordem.length);
  R.paradas.forEach((p, i) => {
    assert.ok(i === 0 || p.indice > R.paradas[i - 1].indice, 'índices crescem ao longo da rota');
    assert.equal(p.id, R.ordem[i]);
    assert.ok(m(R.pontos[p.indice], L[p.id as keyof typeof L]) < 150, `parada de ${p.id} longe do endereço`);
  });
});

test('rota demo: cada aluno é buscado antes de a escola dele ser visitada', () => {
  const pos = (id: string) => (R.ordem as readonly string[]).indexOf(id);
  for (const a of ['lucas', 'beatriz', 'gabriel', 'sofia']) assert.ok(pos(a) < pos('santaMaria'), a);
  assert.ok(pos('ana') < pos('aurora'));
});

test('rota demo: a linha segue as ruas (sem saltos) e começa na garagem', () => {
  assert.ok(m(R.pontos[0], L.garagem) < 150);
  for (let i = 1; i < R.pontos.length; i++) assert.ok(m(R.pontos[i - 1], R.pontos[i]) < 700, `salto no ponto ${i}`);
  assert.ok(R.pontos.every((p) => p.rua.length > 0));
});
