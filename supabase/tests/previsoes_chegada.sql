-- Previsões de chegada: cada responsável lê só as dos próprios dependentes; ninguém escreve direto. Tudo é desfeito no ROLLBACK.
BEGIN;
CREATE FUNCTION public._t_nega2(cmd text) RETURNS boolean LANGUAGE plpgsql AS $f$
BEGIN EXECUTE cmd; RETURN false; EXCEPTION WHEN insufficient_privilege THEN RETURN true; END $f$;
GRANT EXECUTE ON FUNCTION public._t_nega2(text) TO anon, authenticated;

DO $$
DECLARE t uuid := gen_random_uuid(); r1 uuid := gen_random_uuid(); r2 uuid := gen_random_uuid();
        cod text; a1 uuid; a2 uuid; ins uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) VALUES
    (t,  ins, 'authenticated', 'authenticated', 'pv-t@teste.local',  '{"nome":"T","tipo_usuario":"TRANSPORTADOR"}', now(), now()),
    (r1, ins, 'authenticated', 'authenticated', 'pv-r1@teste.local', '{"nome":"R1","tipo_usuario":"RESPONSAVEL"}', now(), now()),
    (r2, ins, 'authenticated', 'authenticated', 'pv-r2@teste.local', '{"nome":"R2","tipo_usuario":"RESPONSAVEL"}', now(), now());
  SELECT codigo_convite INTO cod FROM public.transportadores WHERE id = t;
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', r1::text, true);
  a1 := public.cadastrar_aluno('Aluno1', '2015-01-01', '1', '5A', 'MANHA', 'Rua A', 'Rua B', '', cod);
  PERFORM set_config('request.jwt.claim.sub', r2::text, true);
  a2 := public.cadastrar_aluno('Aluno2', '2015-01-01', '2', '5B', 'MANHA', 'Rua C', 'Rua D', '', cod);

  -- a função de rota (service_role) grava
  PERFORM set_config('role', 'service_role', true);
  INSERT INTO public.previsoes_chegada (aluno_id, evento, transportador_id, minutos) VALUES
    (a1, 'BUSCA', t, 5), (a1, 'ENTREGA', t, 20), (a2, 'BUSCA', t, 9), (a2, 'ENTREGA', t, 20);

  -- cada responsável vê só o que é dele
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', r1::text, true);
  ASSERT (SELECT count(*) FROM public.previsoes_chegada) = 2, 'r1 vê só as 2 linhas do aluno dele';
  ASSERT (SELECT count(*) FROM public.previsoes_chegada WHERE aluno_id = a2) = 0, 'r1 não vê o outro aluno';
  PERFORM set_config('request.jwt.claim.sub', r2::text, true);
  ASSERT (SELECT minutos FROM public.previsoes_chegada WHERE aluno_id = a2 AND evento = 'BUSCA') = 9, 'r2 vê a própria previsão';
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  ASSERT (SELECT count(*) FROM public.previsoes_chegada) = 4, 'o motorista vê todas as dele';

  -- ninguém escreve direto
  PERFORM set_config('request.jwt.claim.sub', r1::text, true);
  ASSERT public._t_nega2(format('INSERT INTO public.previsoes_chegada (aluno_id, evento, transportador_id, minutos) VALUES (%L, ''BUSCA'', %L, 0)', a1, t)), 'responsável não insere previsão';
  ASSERT public._t_nega2(format('UPDATE public.previsoes_chegada SET minutos = 0 WHERE aluno_id = %L', a1)), 'responsável não altera previsão';
  ASSERT public._t_nega2('DELETE FROM public.previsoes_chegada'), 'responsável não apaga previsão';
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  ASSERT public._t_nega2(format('UPDATE public.previsoes_chegada SET minutos = 0 WHERE aluno_id = %L', a1)), 'motorista também só pela função de rota';
  PERFORM set_config('role', 'anon', true);
  ASSERT public._t_nega2('SELECT count(*) FROM public.previsoes_chegada'), 'anon não lê';
END $$;
ROLLBACK;
