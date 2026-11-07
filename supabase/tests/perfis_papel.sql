-- O usuário não pode trocar o próprio papel nem outros campos protegidos do perfil. Tudo é desfeito no ROLLBACK.
BEGIN;
DO $$
DECLARE a uuid := gen_random_uuid(); ok boolean;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  VALUES (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'papel@teste.local', '{"nome":"A","tipo_usuario":"RESPONSAVEL"}', now(), now());

  PERFORM set_config('request.jwt.claim.sub', a::text, true);
  PERFORM set_config('role', 'authenticated', true);

  UPDATE public.perfis SET nome = 'Novo Nome', telefone = '11999999999', cpf = '12345678901' WHERE id = a;
  ASSERT (SELECT nome FROM public.perfis WHERE id = a) = 'Novo Nome', 'nome, telefone e cpf continuam editáveis';

  BEGIN UPDATE public.perfis SET tipo_usuario = 'TRANSPORTADOR' WHERE id = a; ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  ASSERT ok, 'trocar tipo_usuario deve ser negado';

  BEGIN UPDATE public.perfis SET email = 'outro@teste.local' WHERE id = a; ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  ASSERT ok, 'trocar email do perfil deve ser negado';

  BEGIN UPDATE public.perfis SET ativo = false WHERE id = a; ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  ASSERT ok, 'trocar ativo deve ser negado';

  PERFORM set_config('role', 'postgres', true);
  ASSERT (SELECT tipo_usuario FROM public.perfis WHERE id = a) = 'RESPONSAVEL', 'o papel continua RESPONSAVEL';
END $$;
ROLLBACK;
