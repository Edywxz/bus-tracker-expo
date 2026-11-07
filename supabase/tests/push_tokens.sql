-- Teste do push (rode com: psql -v ON_ERROR_STOP=1 -f supabase/tests/push_tokens.sql). Tudo é desfeito no ROLLBACK.
BEGIN;
DO $$
DECLARE a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); t text := 'ExponentPushToken[teste123]'; ok boolean;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) VALUES
    (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@teste.local', '{"nome":"A","tipo_usuario":"RESPONSAVEL"}', now(), now()),
    (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@teste.local', '{"nome":"B","tipo_usuario":"RESPONSAVEL"}', now(), now());
  ASSERT (SELECT count(*) FROM public.perfis WHERE id IN (a, b)) = 2, 'gatilho de cadastro deve criar os perfis';

  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN PERFORM public.registrar_push_token(t, 'android'); ok := false; EXCEPTION WHEN OTHERS THEN ok := true; END;
  ASSERT ok, 'sem login deve ser bloqueado';

  PERFORM set_config('request.jwt.claim.sub', a::text, true);
  BEGIN PERFORM public.registrar_push_token('lixo', 'android'); ok := false; EXCEPTION WHEN OTHERS THEN ok := true; END;
  ASSERT ok, 'token fora do formato Expo deve ser bloqueado';

  PERFORM public.registrar_push_token(t, 'android');
  ASSERT (SELECT usuario_id = a FROM public.push_tokens WHERE token = t), 'token deve pertencer a quem registrou';

  PERFORM set_config('request.jwt.claim.sub', b::text, true);
  PERFORM public.registrar_push_token(t, 'ios');
  ASSERT (SELECT usuario_id = b AND plataforma = 'ios' FROM public.push_tokens WHERE token = t), 'aparelho que troca de conta passa para o novo dono';

  INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem) VALUES (b, 'AVISO', 't', 'm');
  ASSERT (SELECT count(*) FROM public.notificacoes WHERE usuario_id = b) = 1, 'notificação grava mesmo sem segredos no Vault';

  PERFORM vault.create_secret('http://localhost:1/x', 'push_function_url');
  PERFORM vault.create_secret('segredo', 'push_webhook_secret');
  INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem) VALUES (b, 'AVISO', 't2', 'm2');
  ASSERT (SELECT count(*) FROM public.notificacoes WHERE usuario_id = b) = 2, 'notificação grava mesmo com o push apontando para URL inválida';
END $$;
ROLLBACK;
