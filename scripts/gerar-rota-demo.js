#!/usr/bin/env node
/**
 * Gera src/services/demoRota.ts: endereços reais do modo demonstração (geocodificados no OpenStreetMap/Nominatim)
 * e a rota mais eficiente que passa por todos eles, seguindo as ruas (OSRM). Roda só em desenvolvimento, uma vez:
 *   node scripts/gerar-rota-demo.js
 * Os serviços públicos pedem uso leve (1 requisição/segundo, User-Agent identificado). Dados © colaboradores do OpenStreetMap (ODbL).
 */
const fs = require('fs');
const path = require('path');

const UA = 'vanescolar-demo-gerador/1.0';
// `precisao` esperada: o resultado do geocodificador tem de ser um endereço/edifício, não só a rua.
const LUGARES = [
  { id: 'garagem', rotulo: 'Garagem do motorista', q: 'Rua Joaquim Floriano 500 São Paulo' },
  { id: 'lucas', rotulo: 'Lucas Silva', q: 'Rua Haddock Lobo 595 São Paulo' },
  { id: 'beatriz', rotulo: 'Beatriz Santos', q: 'Avenida Brasil 450 São Paulo' },
  { id: 'gabriel', rotulo: 'Gabriel Costa', q: 'Rua Augusta 980 São Paulo' },
  { id: 'sofia', rotulo: 'Sofia Lima', q: 'Rua Estados Unidos 1500 São Paulo' },
  { id: 'ana', rotulo: 'Ana Silva', q: 'Avenida Paulista 1578 São Paulo' },
  { id: 'santaMaria', rotulo: 'Colégio Santa Maria', q: 'Alameda Santos 1000 São Paulo' },
  { id: 'aurora', rotulo: 'Escola Municipal Aurora', q: 'Alameda Campinas 800 São Paulo' },
];
const ALUNOS = ['lucas', 'beatriz', 'gabriel', 'sofia', 'ana'];
// cada escola só pode ser visitada depois de buscar todos os alunos dela
const ESCOLAS = { santaMaria: ['lucas', 'beatriz', 'gabriel', 'sofia'], aurora: ['ana'] };

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const json = async (url) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

async function geocodificar(l) {
  const d = await json(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(l.q)}`);
  await espera(1200);
  if (!d[0] || !['house', 'building', 'bus_stop', 'apartments', 'school', 'yes'].includes(d[0].type))
    throw new Error(`Endereço sem precisão de número: ${l.q} -> ${d[0]?.type}`);
  return { ...l, latitude: +d[0].lat, longitude: +d[0].lon, endereco: d[0].display_name.split(',').slice(0, 2).join(',').trim() };
}

function permutacoes(a) {
  if (a.length <= 1) return [a];
  return a.flatMap((x, i) => permutacoes([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
}

(async () => {
  const lugares = [];
  for (const l of LUGARES) lugares.push(await geocodificar(l));
  const por = Object.fromEntries(lugares.map((l) => [l.id, l]));
  const coord = (l) => `${l.longitude},${l.latitude}`;

  // matriz de durações (s) entre todos os pontos
  const t = await json(`https://router.project-osrm.org/table/v1/driving/${lugares.map(coord).join(';')}?annotations=duration`);
  const idx = Object.fromEntries(lugares.map((l, i) => [l.id, i]));
  const custo = (ordem) => ordem.reduce((s, id, i) => s + t.durations[idx[i ? ordem[i - 1] : 'garagem']][idx[id]], 0);
  const valida = (ordem) => Object.entries(ESCOLAS).every(([e, as]) => as.every((a) => ordem.indexOf(a) < ordem.indexOf(e)));

  const candidatos = permutacoes([...ALUNOS, ...Object.keys(ESCOLAS)]).filter(valida);
  candidatos.sort((a, b) => custo(a) - custo(b));
  const melhor = candidatos[0];
  const ingenua = [...ALUNOS, ...Object.keys(ESCOLAS)];
  console.log(`melhor ordem (${Math.round(custo(melhor) / 60)} min):`, melhor.join(' > '));
  console.log(`ordem da lista   (${Math.round(custo(ingenua) / 60)} min):`, ingenua.join(' > '));

  // rota completa seguindo as ruas
  const ordemIds = ['garagem', ...melhor];
  const r = await json(`https://router.project-osrm.org/route/v1/driving/${ordemIds.map((id) => coord(por[id])).join(';')}?overview=false&steps=true&geometries=geojson`);
  const rota = r.routes[0];
  const dist = (a, b) => {
    const rad = (g) => (g * Math.PI) / 180, dLa = rad(b.latitude - a.latitude), dLo = rad(b.longitude - a.longitude);
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLo / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };
  const pontos = [], paradas = [];
  rota.legs.forEach((leg, li) => {
    for (const st of leg.steps) {
      for (const [lon, lat] of st.geometry.coordinates) {
        const p = { latitude: +lat.toFixed(6), longitude: +lon.toFixed(6), rua: st.name || '' };
        const ult = pontos[pontos.length - 1];
        if (!ult || dist(ult, p) >= 60) pontos.push(p); // amostra a cada ~60 m
      }
    }
    // fim da perna = a parada; garante que ela é um ponto da rota
    const fim = leg.steps[leg.steps.length - 1].geometry.coordinates.at(-1);
    const parada = { latitude: +fim[1].toFixed(6), longitude: +fim[0].toFixed(6), rua: leg.steps.at(-1).name || pontos.at(-1).rua };
    if (dist(pontos.at(-1), parada) > 1) pontos.push(parada);
    paradas.push({ id: ordemIds[li + 1], indice: pontos.length - 1 });
  });
  // ruas vazias herdam a anterior
  pontos.forEach((p, i) => { if (!p.rua) p.rua = i ? pontos[i - 1].rua : 'Via local'; });

  const lug = Object.fromEntries(lugares.map((l) => [l.id, { rotulo: l.rotulo, endereco: l.endereco, latitude: l.latitude, longitude: l.longitude }]));
  const out = `// GERADO por scripts/gerar-rota-demo.js — não edite à mão. Dados © colaboradores do OpenStreetMap (ODbL).
// Endereços reais de São Paulo e a rota mais eficiente (ida) por todas as paradas, seguindo as ruas.
export const DEMO_LUGARES = ${JSON.stringify(lug, null, 2)} as const;

export const DEMO_ROTA = {
  km: ${+(rota.distance / 1000).toFixed(1)},
  minutos: ${Math.round(rota.duration / 60)},
  /** ordem de visita: garagem, depois estas paradas */
  ordem: ${JSON.stringify(melhor)},
  /** índice em \`pontos\` onde a van fica ao chegar em cada parada */
  paradas: ${JSON.stringify(paradas)},
  pontos: ${JSON.stringify(pontos)},
} as const;
`;
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'services', 'demoRota.ts'), out);
  console.log(`ok: ${pontos.length} pontos, ${(rota.distance / 1000).toFixed(1)} km, ${Math.round(rota.duration / 60)} min`);
})().catch((e) => { console.error(e.message); process.exit(1); });
