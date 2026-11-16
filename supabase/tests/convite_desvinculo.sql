-- Renovar código, desvincular, vincular de novo e excluir conta do transportador depois de soltar os alunos.
-- Tudo é desfeito no ROLLBACK.
BEGIN;
DO $$
DECLARE t uuid := gen_random_uuid(); t2 uuid := gen_random_uuid(); r uuid := gen_random_uuid(); x uuid := gen_random_uuid();
        cod text; novo text; cod2 text; ok boolean; v_aluno uuid; n int;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) VALUES
    (t,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cd-t@teste.local',  '{"nome":"T","tipo_usuario":"TRANSPORTADOR"}', now(), now()),
    (t2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cd-t2@teste.local', '{"nome":"T2","tipo_usuario":"TRANSPORTADOR"}', now(), now()),
    (r,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cd-r@teste.local',  '{"nome":"R","tipo_usuario":"RESPONSAVEL"}', now(), now()),
    (x,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cd-x@teste.local',  '{"nome":"X","tipo_usuario":"RESPONSAVEL"}', now(), now());
  SELECT codigo_convite INTO cod  FROM public.transportadores WHERE id = t;
  SELECT codigo_convite INTO cod2 FROM public.transportadores WHERE id = t2;

  -- transportador renova o código: o antigo deixa de achar o transportador
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  PERFORM set_config('role', 'authenticated', true);
  novo := public.renovar_codigo_convite();
  ASSERT novo <> cod, 'o código muda';
  ASSERT (SELECT count(*) FROM public.buscar_transportador_por_codigo(cod)) = 0, 'código antigo não vale mais';
  ASSERT (SELECT count(*) FROM public.buscar_transportador_por_codigo(novo)) = 1, 'código novo vale';
  PERFORM set_config('request.jwt.claim.sub', r::text, true);
  BEGIN PERFORM public.renovar_codigo_convite(); ok := false; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  ASSERT ok, 'responsável não renova código';

  -- responsável cadastra o aluno no código novo
  v_aluno := public.cadastrar_aluno('Aluno', '2015-01-01', '1', '5A', 'MANHA', 'Rua A', 'Rua B', '', novo);

  -- quem não é parte não desvincula
  PERFORM set_config('request.jwt.claim.sub', x::text, true);
  BEGIN PERFORM public.desvincular_aluno(v_aluno); ok := false; EXCEPTION WHEN no_data_found THEN ok := true; END;
  ASSERT ok, 'estranho não desvincula';

  -- responsável desvincula: sem transportador, contrato e mensalidades futuras canceladas
  PERFORM set_config('request.jwt.claim.sub', r::text, true);
  PERFORM public.desvincular_aluno(v_aluno);
  PERFORM set_config('role', 'postgres', true);
  ASSERT (SELECT transportador_id FROM public.alunos WHERE id = v_aluno) IS NULL, 'aluno sem transportador';
  ASSERT (SELECT status FROM public.contratos_servico WHERE aluno_id = v_aluno) = 'CANCELADO', 'contrato cancelado';
  SELECT count(*) INTO n FROM public.mensalidades m JOIN public.contratos_servico c ON c.id = m.contrato_id
   WHERE c.aluno_id = v_aluno AND m.status = 'PENDENTE' AND m.data_vencimento >= CURRENT_DATE;
  ASSERT n = 0, 'mensalidades futuras canceladas';
  ASSERT EXISTS (SELECT 1 FROM public.notificacoes WHERE usuario_id = t AND titulo = 'Aluno desvinculado'), 'transportador foi avisado';

  -- desvincular duas vezes é recusado
  PERFORM set_config('request.jwt.claim.sub', r::text, true);
  PERFORM set_config('role', 'authenticated', true);
  BEGIN PERFORM public.desvincular_aluno(v_aluno); ok := false; EXCEPTION WHEN invalid_parameter_value THEN ok := true; END;
  ASSERT ok, 'já desvinculado';

  -- vincular com código inválido falha; com o código do outro transportador funciona
  BEGIN PERFORM public.vincular_aluno(v_aluno, 'XXXXXX'); ok := false; EXCEPTION WHEN no_data_found THEN ok := true; END;
  ASSERT ok, 'código inválido';
  PERFORM public.vincular_aluno(v_aluno, cod2);
  PERFORM set_config('role', 'postgres', true);
  ASSERT (SELECT transportador_id FROM public.alunos WHERE id = v_aluno) = t2, 'aluno vinculado ao novo transportador';
  ASSERT EXISTS (SELECT 1 FROM public.contratos_servico WHERE aluno_id = v_aluno AND transportador_id = t2 AND status = 'ATIVO'), 'novo contrato ativo';

  -- o primeiro transportador só tem contrato cancelado e nenhum aluno: consegue excluir a conta
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  PERFORM set_config('role', 'authenticated', true);
  PERFORM public.excluir_minha_conta();
  PERFORM set_config('role', 'postgres', true);
  ASSERT NOT EXISTS (SELECT 1 FROM auth.users WHERE id = t), 'transportador sem alunos removido';
  ASSERT EXISTS (SELECT 1 FROM public.alunos WHERE id = v_aluno), 'aluno do responsável permanece';
END $$;
ROLLBACK;
