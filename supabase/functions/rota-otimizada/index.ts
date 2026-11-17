// Rota mais eficiente do motorista (ida: casas -> escola; volta: escola -> casas), seguindo as ruas.
// Lê as coordenadas no banco com a identidade do próprio motorista (RLS): só alunos dele, nunca pontos enviados pelo cliente.
// Envia ao Geoapify apenas coordenadas — nunca nomes. Secret: GEOAPIFY_API_KEY. Atribuição "Powered by Geoapify" obrigatória no app.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { ordenar, type Precedencia } from '../_shared/ordenar.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const resp = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const UUID = /^[0-9a-f-]{36}$/i;
const MAX_ALUNOS = 25;
const MAX_PONTOS = 30; // a matriz do Geoapify cobra por par de pontos
const PASSO_M = 25; // a linha devolvida ao app é amostrada a cada ~25 m

interface Ponto { latitude: number; longitude: number }
interface No extends Ponto { rotulo: string; tipo: 'RETIRADA' | 'ENTREGA'; alunos: string[] }

const metros = (a: Ponto, b: Ponto) => {
  const r = (g: number) => (g * Math.PI) / 180;
  const h = Math.sin(r(b.latitude - a.latitude) / 2) ** 2 + Math.cos(r(a.latitude)) * Math.cos(r(b.latitude)) * Math.sin(r(b.longitude - a.longitude) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
const ehPonto = (p: unknown): p is Ponto =>
  !!p && typeof (p as Ponto).latitude === 'number' && typeof (p as Ponto).longitude === 'number'
  && Math.abs((p as Ponto).latitude) <= 90 && Math.abs((p as Ponto).longitude) <= 180;
const ids = (v: unknown): string[] | null =>
  Array.isArray(v) && v.length <= MAX_ALUNOS && v.every((x) => typeof x === 'string' && UUID.test(x)) ? v as string[] : null;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return resp({ erro: 'Método não permitido' }, 405);

  const chave = Deno.env.get('GEOAPIFY_API_KEY');
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: auth } = await userClient.auth.getUser();
  if (!auth.user) return resp({ erro: 'Não autenticado' }, 401);
  const uid = auth.user.id;

  const { data: transp } = await userClient.from('transportadores').select('id').eq('id', uid).maybeSingle();
  if (!transp) return resp({ erro: 'Apenas transportadores' }, 403);
  if (!chave) return resp({ erro: 'Roteamento não configurado' }, 503);

  let corpo: Record<string, unknown> = {};
  try { corpo = await req.json(); } catch { /* corpo inválido tratado abaixo */ }
  const tipo = corpo.tipo === 'VOLTA' ? 'VOLTA' : corpo.tipo === 'IDA' ? 'IDA' : null;
  const aguardando = ids(corpo.aguardando), aBordo = ids(corpo.aBordo);
  const van = ehPonto(corpo.van) ? corpo.van : null;
  if (!tipo || !aguardando || !aBordo) return resp({ erro: 'Parâmetros inválidos' }, 400);

  // Alunos do próprio motorista e as coordenadas dos endereços (a RLS libera ao motorista os endereços dos seus alunos).
  const todos = [...new Set([...aguardando, ...aBordo])];
  if (todos.length === 0) return resp({ ordem: [], pontos: [], km: 0, minutos: 0, semCoordenada: [] });
  const { data: alunos, error: e1 } = await userClient.from('alunos')
    .select('id, nome, escola_nome, endereco_busca_id, endereco_entrega_id').in('id', todos).eq('transportador_id', uid);
  if (e1) return resp({ erro: 'Falha ao ler alunos' }, 500);
  const endIds = [...new Set((alunos ?? []).flatMap((a: any) => [a.endereco_busca_id, a.endereco_entrega_id]).filter(Boolean))];
  const { data: ends, error: e2 } = endIds.length
    ? await userClient.from('enderecos_responsavel').select('id, latitude, longitude').in('id', endIds)
    : { data: [], error: null };
  if (e2) return resp({ erro: 'Falha ao ler endereços' }, 500);
  const coord = new Map<string, Ponto>((ends ?? []).filter((e: any) => e.latitude != null && e.longitude != null)
    .map((e: any): [string, Ponto] => [e.id, { latitude: e.latitude, longitude: e.longitude }]));

  // Nós: ida busca em casa e entrega na escola; volta busca na escola e entrega em casa. Locais iguais viram um nó só.
  const nos: No[] = [];
  const antes: Precedencia[] = [];
  const noDe = (p: Ponto, rotulo: string, t: No['tipo'], aluno: string) => {
    let i = nos.findIndex((n) => n.tipo === t && metros(n, p) < 5);
    if (i < 0) { nos.push({ ...p, rotulo, tipo: t, alunos: [] }); i = nos.length - 1; }
    nos[i].alunos.push(aluno);
    return i + 1; // nó 0 é o início
  };
  const semCoordenada: string[] = [];
  for (const a of (alunos ?? []) as any[]) {
    const casa = coord.get(a.endereco_busca_id), escola = coord.get(a.endereco_entrega_id) ?? casa;
    if (!casa || !escola) { semCoordenada.push(a.id); continue; }
    const rotEscola = a.escola_nome ?? 'Escola', rotCasa = String(a.nome).split(' ')[0];
    const ida = tipo === 'IDA';
    const origem = ida ? casa : escola, destino = ida ? escola : casa;
    const rotOrigem = ida ? rotCasa : rotEscola, rotDestino = ida ? rotEscola : rotCasa;
    if (aguardando.includes(a.id)) {
      const o = noDe(origem, rotOrigem, 'RETIRADA', a.id), d = noDe(destino, rotDestino, 'ENTREGA', a.id);
      antes.push([o, d]);
    } else if (aBordo.includes(a.id)) {
      noDe(destino, rotDestino, 'ENTREGA', a.id);
    }
  }
  if (nos.length === 0) return resp({ ordem: [], pontos: [], km: 0, minutos: 0, semCoordenada });
  if (nos.length + (van ? 1 : 0) > MAX_PONTOS) return resp({ erro: 'Paradas demais para uma rota' }, 422);

  // Matriz de tempos de viagem entre início (van, se informada) e paradas.
  const pontos: Ponto[] = van ? [van, ...nos] : nos;
  let custo: number[][];
  let aproximado = false;
  try {
    const r = await fetch(`https://api.geoapify.com/v1/routematrix?apiKey=${chave}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ mode: 'drive', sources: pontos.map((p) => ({ location: [p.longitude, p.latitude] })), targets: pontos.map((p) => ({ location: [p.longitude, p.latitude] })) }),
    });
    if (!r.ok) return resp({ erro: `Roteamento indisponível (${r.status})` }, 502);
    const m = (await r.json()).sources_to_targets as { time?: number }[][];
    // Tempo que o roteador não devolveu vira estimativa em linha reta (~30 km/h), e a resposta avisa que é aproximada.
    const t = pontos.map((a, i) => pontos.map((b, j) => {
      if (i === j) return 0;
      const tempo = m?.[i]?.[j]?.time;
      if (typeof tempo === 'number') return tempo;
      aproximado = true;
      return metros(a, b) / 8.3;
    }));
    // sem posição da van o início é livre: a primeira parada não tem custo de chegada
    custo = van ? t : [new Array(pontos.length + 1).fill(0), ...t.map((l) => [0, ...l])];
  } catch {
    return resp({ erro: 'Roteamento indisponível' }, 502);
  }

  let ordem: number[];
  try { ordem = ordenar(custo, antes); } catch { return resp({ erro: 'Rota impossível' }, 422); }
  const paradas = ordem.map((i) => nos[i - 1]);

  // Geometria pelas ruas, na ordem escolhida.
  const wp = [...(van ? [van] : []), ...paradas];
  let linha: Ponto[] = [], km = 0, minutos = 0;
  if (wp.length >= 2) {
    try {
      const q = new URL('https://api.geoapify.com/v1/routing');
      q.searchParams.set('waypoints', wp.map((p) => `${p.latitude},${p.longitude}`).join('|'));
      q.searchParams.set('mode', 'drive');
      q.searchParams.set('apiKey', chave);
      const r = await fetch(q, { signal: AbortSignal.timeout(10000) });
      if (!r.ok) return resp({ erro: `Roteamento indisponível (${r.status})` }, 502);
      const f = (await r.json()).features?.[0];
      const trechos: number[][][] = f?.geometry?.type === 'MultiLineString' ? f.geometry.coordinates : [f?.geometry?.coordinates ?? []];
      for (const [lon, lat] of trechos.flat()) {
        const p = { latitude: +lat.toFixed(6), longitude: +lon.toFixed(6) };
        if (!linha.length || metros(linha[linha.length - 1], p) >= PASSO_M) linha.push(p);
      }
      km = +((f?.properties?.distance ?? 0) / 1000).toFixed(1);
      minutos = Math.round((f?.properties?.time ?? 0) / 60);
    } catch {
      return resp({ erro: 'Roteamento indisponível' }, 502);
    }
  }

  return resp({
    ordem: paradas.map((p) => ({ rotulo: p.rotulo, tipo: p.tipo, latitude: p.latitude, longitude: p.longitude, alunos: p.alunos })),
    pontos: linha, km, minutos, semCoordenada, aproximado,
  });
});
