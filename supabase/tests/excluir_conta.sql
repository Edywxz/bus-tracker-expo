-- excluir_minha_conta: responsável é apagado por completo; transportador com alunos é recusado; anon não executa.
-- Tudo é desfeito no ROLLBACK.
BEGIN;
DO $$
DECLARE t uuid := gen_random_uuid(); r uuid := gen_random_uuid(); t2 uuid := gen_random_uuid();
        cod text; ok boolean; v_aluno uuid; v_mens uuid;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) VALUES
    (t,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'transp@teste.local',  '{"nome":"T","tipo_usuario":"TRANSPORTADOR"}', now(), now()),
    (r,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'resp@teste.local',    '{"nome":"R","tipo_usuario":"RESPONSAVEL"}', now(), now()),
    (t2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'transp2@teste.local', '{"nome":"T2","tipo_usuario":"TRANSPORTADOR"}', now(), now());
  SELECT codigo_convite INTO cod FROM public.transportadores WHERE id = t;

  -- responsável cadastra um aluno (gera contrato e mensalidades) e paga uma mensalidade
  PERFORM set_config('request.jwt.claim.sub', r::text, true);
  PERFORM set_config('role', 'authenticated', true);
  v_aluno := public.cadastrar_aluno('Aluno', '2015-01-01', '1', '5A', 'MANHA', 'Rua A', 'Rua B', '', cod);
  SELECT id INTO v_mens FROM public.mensalidades WHERE responsavel_id = r LIMIT 1;
  PERFORM public.registrar_pagamento(v_mens, 'PIX', 'tx-1');

  -- transportador com aluno vinculado não pode excluir
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  BEGIN PERFORM public.excluir_minha_conta(); ok := false;
  EXCEPTION WHEN foreign_key_violation THEN ok := true; END;
  ASSERT ok, 'transportador com alunos deve ser recusado';
  PERFORM set_config('role', 'postgres', true); -- authenticated não lê auth.users
  ASSERT EXISTS (SELECT 1 FROM auth.users WHERE id = t), 'transportador recusado continua existindo';
  PERFORM set_config('role', 'authenticated', true);

  -- responsável exclui: tudo dele some, o transportador fica
  PERFORM set_config('request.jwt.claim.sub', r::text, true);
  PERFORM public.excluir_minha_conta();
  PERFORM set_config('role', 'postgres', true);
  ASSERT NOT EXISTS (SELECT 1 FROM auth.users WHERE id = r), 'usuário do Auth removido';
  ASSERT NOT EXISTS (SELECT 1 FROM public.perfis WHERE id = r), 'perfil removido';
  ASSERT NOT EXISTS (SELECT 1 FROM public.alunos WHERE responsavel_id = r), 'alunos removidos';
  ASSERT NOT EXISTS (SELECT 1 FROM public.contratos_servico WHERE responsavel_id = r), 'contratos removidos';
  ASSERT NOT EXISTS (SELECT 1 FROM public.mensalidades WHERE responsavel_id = r), 'mensalidades removidas';
  ASSERT NOT EXISTS (SELECT 1 FROM public.pagamentos WHERE mensalidade_id = v_mens), 'pagamentos removidos';
  ASSERT EXISTS (SELECT 1 FROM auth.users WHERE id = t), 'transportador não é afetado';

  -- agora o transportador não tem mais alunos e consegue excluir
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  PERFORM set_config('role', 'authenticated', true);
  PERFORM public.excluir_minha_conta();
  PERFORM set_config('role', 'postgres', true);
  ASSERT NOT EXISTS (SELECT 1 FROM auth.users WHERE id = t), 'transportador sem alunos é removido';

  -- anônimo não executa
  PERFORM set_config('role', 'anon', true);
  BEGIN PERFORM public.excluir_minha_conta(); ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  ASSERT ok, 'anon não pode executar excluir_minha_conta';
END $$;
ROLLBACK;
