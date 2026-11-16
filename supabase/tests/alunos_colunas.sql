-- O responsável edita os dados do aluno, mas não o vínculo; INSERT direto é negado. Tudo é desfeito no ROLLBACK.
BEGIN;
DO $$
DECLARE t uuid := gen_random_uuid(); t2 uuid := gen_random_uuid(); r uuid := gen_random_uuid();
        cod text; v_aluno uuid; ok boolean; n int;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) VALUES
    (t,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ac-t@teste.local',  '{"nome":"T","tipo_usuario":"TRANSPORTADOR"}', now(), now()),
    (t2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ac-t2@teste.local', '{"nome":"T2","tipo_usuario":"TRANSPORTADOR"}', now(), now()),
    (r,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ac-r@teste.local',  '{"nome":"R","tipo_usuario":"RESPONSAVEL"}', now(), now());
  SELECT codigo_convite INTO cod FROM public.transportadores WHERE id = t;

  PERFORM set_config('request.jwt.claim.sub', r::text, true);
  PERFORM set_config('role', 'authenticated', true);
  v_aluno := public.cadastrar_aluno('Aluno', '2015-01-01', '1', '5A', 'MANHA', 'Rua A', 'Rua B', '', cod);

  UPDATE public.alunos SET nome = 'Novo Nome', turma = '6B', observacoes_medicas = 'alergia' WHERE id = v_aluno;
  ASSERT (SELECT nome FROM public.alunos WHERE id = v_aluno) = 'Novo Nome', 'dados do aluno continuam editáveis';

  BEGIN UPDATE public.alunos SET transportador_id = t2 WHERE id = v_aluno; ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  ASSERT ok, 'trocar transportador_id direto deve ser negado';

  BEGIN UPDATE public.alunos SET responsavel_id = t2 WHERE id = v_aluno; ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  ASSERT ok, 'trocar responsavel_id deve ser negado';

  BEGIN UPDATE public.alunos SET endereco_busca_id = gen_random_uuid() WHERE id = v_aluno; ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  ASSERT ok, 'trocar endereco_busca_id deve ser negado';

  BEGIN INSERT INTO public.alunos (responsavel_id, transportador_id, nome, data_nascimento, documento, turno, endereco_busca, endereco_entrega)
        VALUES (r, t, 'X', '2015-01-01', '1', 'MANHA', 'a', 'b'); ok := false;
  EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
  ASSERT ok, 'INSERT direto em alunos deve ser negado';

  -- o transportador não edita dados do aluno (a policy só deixa o responsável): 0 linhas afetadas
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  UPDATE public.alunos SET nome = 'Invadido' WHERE id = v_aluno;
  GET DIAGNOSTICS n = ROW_COUNT;
  ASSERT n = 0, 'transportador não edita o aluno';

  PERFORM set_config('role', 'postgres', true);
  ASSERT (SELECT transportador_id FROM public.alunos WHERE id = v_aluno) = t, 'vínculo intacto';
  ASSERT (SELECT nome FROM public.alunos WHERE id = v_aluno) = 'Novo Nome', 'nome só mudou pelo responsável';
END $$;
ROLLBACK;
