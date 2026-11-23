#!/usr/bin/env node
/**
 * Gera src/services/demoPernas.ts: o trajeto pelas ruas (OSRM) de cada par de lugares da demonstração, para a
 * simulação montar uma rota só com as paradas escolhidas, na melhor ordem. Usa os endereços de demoRota.ts.
 *   node scripts/gerar-pernas-demo.mjs
 * Serviço público: uso leve (1 requisição/segundo). Dados © colaboradores do OpenStreetMap (ODbL).
 */
import fs from 'node:fs';
import { DEMO_LUGARES as L } from '../src/services/demoRota.ts';

const CASAS = ['lucas', 'beatriz', 'gabriel', 'sofia'];
const ESCOLAS = ['santaMaria', 'aurora'];
const LUGARES = [...CASAS, ...ESCOLAS];
const pares = [
  ...CASAS.map((c) => ['garagem', c]),
  ...LUGARES.flatMap((a) => LUGARES.filter((b) => b !== a).map((b) => [a, b])),
];
const coord = (id) => `${L[id].longitude},${L[id].latitude}`;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const dist = (a, b) => {
  const rad = (g) => (g * Math.PI) / 180, dLa = rad(b.latitude - a.latitude), dLo = rad(b.longitude - a.longitude);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLo / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const out = {};
for (const [a, b] of pares) {
  const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${coord(a)};${coord(b)}?overview=false&steps=true&geometries=geojson`,
    { headers: { 'User-Agent': 'vanescolar-demo-gerador/1.0' } });
  if (!r.ok) throw new Error(`${r.status} ${a}>${b}`);
  const rota = (await r.json()).routes[0];
  const pontos = [];
  for (const st of rota.legs[0].steps) {
    for (const [lon, lat] of st.geometry.coordinates) {
      const p = { latitude: +lat.toFixed(6), longitude: +lon.toFixed(6), rua: st.name || '' };
      const u = pontos[pontos.length - 1];
      if (!u || dist(u, p) >= 1) pontos.push(p); // todos os vértices (só tira repetidos): amostrar cortaria as esquinas
    }
  }
  const fim = rota.legs[0].steps.at(-1).geometry.coordinates.at(-1);
  const pf = { latitude: +fim[1].toFixed(6), longitude: +fim[0].toFixed(6), rua: rota.legs[0].steps.at(-1).name || pontos.at(-1).rua };
  if (dist(pontos.at(-1), pf) > 1) pontos.push(pf);
  pontos.forEach((p, i) => { if (!p.rua) p.rua = i ? pontos[i - 1].rua : 'Via local'; });
  out[`${a}>${b}`] = { s: Math.round(rota.duration), pontos };
  console.log(`${a}>${b}: ${pontos.length} pontos, ${Math.round(rota.duration / 60)} min`);
  await espera(1100);
}
fs.writeFileSync(new URL('../src/services/demoPernas.ts', import.meta.url),
`// GERADO por scripts/gerar-pernas-demo.mjs — não edite à mão. Dados © colaboradores do OpenStreetMap (ODbL).
// Trajeto pelas ruas entre cada par de lugares da demonstração ("de>para"): duração (s) e pontos.
export interface PontoRota { latitude: number; longitude: number; rua: string }
export const DEMO_PERNAS: Record<string, { s: number; pontos: PontoRota[] }> = ${JSON.stringify(out)};
`);
console.log(`ok: ${Object.keys(out).length} pernas`);
