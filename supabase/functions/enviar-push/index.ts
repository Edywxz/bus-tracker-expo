// Envia push (Expo) para todos os aparelhos de um usuário. Chamada pelo gatilho `trg_notificacao_push`
// a cada linha nova em `notificacoes`. Não usa JWT: autentica pelo cabeçalho x-webhook-secret.
// Deploy: supabase functions deploy enviar-push --no-verify-jwt
// Secret necessário: PUSH_WEBHOOK_SECRET (o mesmo valor guardado no Vault como push_webhook_secret).
// Opcional: EXPO_ACCESS_TOKEN (se ativar "Enhanced Security" no painel da Expo).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const resp = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return resp({ erro: 'Método não permitido' }, 405);

  const segredo = Deno.env.get('PUSH_WEBHOOK_SECRET');
  if (!segredo || req.headers.get('x-webhook-secret') !== segredo) return resp({ erro: 'Não autorizado' }, 401);

  let corpo: { usuario_id?: string; tipo?: string; titulo?: string; mensagem?: string } = {};
  try { corpo = await req.json(); } catch { return resp({ erro: 'Corpo inválido' }, 400); }
  if (!/^[0-9a-f-]{36}$/i.test(corpo.usuario_id ?? '') || !corpo.titulo) return resp({ erro: 'Dados inválidos' }, 400);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: tokens, error } = await db.from('push_tokens').select('token').eq('usuario_id', corpo.usuario_id);
  if (error) return resp({ erro: 'Falha ao ler tokens' }, 500);
  if (!tokens?.length) return resp({ ok: true, enviados: 0 });

  const mensagens = tokens.map((t) => ({
    to: t.token, title: corpo.titulo, body: corpo.mensagem ?? '', sound: 'default', channelId: 'default',
    data: { tipo: corpo.tipo },
  }));
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const expoToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (expoToken) headers.Authorization = `Bearer ${expoToken}`;

  const r = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST', headers, body: JSON.stringify(mensagens), signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return resp({ erro: 'Falha no serviço de push', status: r.status }, 502);

  // Os tickets vêm na mesma ordem das mensagens; remove tokens de aparelhos que desinstalaram o app.
  const { data: tickets } = await r.json();
  const mortos = (tickets ?? [])
    .map((t: { status: string; details?: { error?: string } }, i: number) =>
      t.status === 'error' && t.details?.error === 'DeviceNotRegistered' ? tokens[i].token : null)
    .filter(Boolean);
  if (mortos.length) await db.from('push_tokens').delete().in('token', mortos);

  return resp({ ok: true, enviados: tokens.length - mortos.length, removidos: mortos.length });
});
