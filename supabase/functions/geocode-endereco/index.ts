// Geocodifica UM endereço do responsável (uma vez) e grava as coordenadas.
// Envia ao Geoapify apenas o texto do endereço — nunca o nome do aluno ou do responsável.
// Secret necessário: GEOAPIFY_API_KEY (supabase secrets set GEOAPIFY_API_KEY=...). Atribuição "Powered by Geoapify" é obrigatória no app.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const resp = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return resp({ erro: 'Método não permitido' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const chave = Deno.env.get('GEOAPIFY_API_KEY');

  // Quem chama: o JWT do usuário (verify_jwt já exige token válido; aqui lemos a identidade).
  const userClient = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
  const { data: auth } = await userClient.auth.getUser();
  if (!auth.user) return resp({ erro: 'Não autenticado' }, 401);

  let enderecoId = '';
  try { enderecoId = String((await req.json()).endereco_id ?? ''); } catch { /* corpo inválido */ }
  if (!/^[0-9a-f-]{36}$/i.test(enderecoId)) return resp({ erro: 'endereco_id inválido' }, 400);

  // Lê pelo cliente do usuário (RLS) e exige que seja o dono do endereço.
  const { data: end } = await userClient.from('enderecos_responsavel')
    .select('id, responsavel_id, endereco_texto, ajustado_manual').eq('id', enderecoId).maybeSingle();
  if (!end || end.responsavel_id !== auth.user.id) return resp({ erro: 'Endereço não encontrado' }, 404);
  if (end.ajustado_manual) return resp({ ok: true, ignorado: 'pino ajustado pelo responsável' });
  if (!chave) return resp({ erro: 'Geocodificação não configurada' }, 503);

  const q = new URL('https://api.geoapify.com/v1/geocode/search');
  q.searchParams.set('text', end.endereco_texto);
  q.searchParams.set('filter', 'countrycode:br');
  q.searchParams.set('lang', 'pt');
  q.searchParams.set('limit', '1');
  q.searchParams.set('apiKey', chave);

  let feature: { properties?: Record<string, any> } | undefined;
  try {
    const r = await fetch(q, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return resp({ erro: `Geocodificador indisponível (${r.status})` }, 502);
    feature = (await r.json()).features?.[0];
  } catch {
    return resp({ erro: 'Geocodificador indisponível' }, 502);
  }

  const p = feature?.properties;
  if (!p || typeof p.lat !== 'number' || typeof p.lon !== 'number') return resp({ ok: false, motivo: 'sem_resultado' });

  // Precisão: número da casa > rua > CEP. Resultados mais vagos (cidade/bairro) não são gravados.
  const precisao = p.housenumber ? 'NUMERO' : p.result_type === 'street' ? 'RUA' : p.result_type === 'postcode' ? 'CEP' : null;
  if (!precisao) return resp({ ok: false, motivo: 'impreciso' });

  const admin = createClient(url, service);
  const { error } = await admin.from('enderecos_responsavel').update({
    latitude: p.lat, longitude: p.lon, precisao, origem: 'GEOAPIFY', geocodificado_em: new Date().toISOString(),
  }).eq('id', enderecoId).eq('ajustado_manual', false);
  if (error) return resp({ erro: 'Falha ao gravar' }, 500);

  return resp({ ok: true, precisao, latitude: p.lat, longitude: p.lon });
});
