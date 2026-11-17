-- Limpeza de posições GPS: some o que passou de 30 dias, fica o recente; ninguém além do cron a executa. Tudo é desfeito no ROLLBACK.
BEGIN;
DO $$
DECLARE t uuid := gen_random_uuid(); v uuid; ins uuid := '00000000-0000-0000-0000-000000000000'; n int; negou boolean := false;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    VALUES (t, ins, 'authenticated', 'authenticated', 'gps-t@teste.local', '{"nome":"T","tipo_usuario":"TRANSPORTADOR"}', now(), now());
  INSERT INTO public.veiculos (transportador_id, placa, modelo, ano, capacidade_assentos, renavam, numero_alvara, validade_vistoria)
    VALUES (t, 'TST1A23', 'Van', 2020, 15, '1', '1', '2030-01-01');
  INSERT INTO public.viagens (transportador_id, veiculo_id, tipo_viagem, turno)
    SELECT t, id, 'IDA', 'MANHA' FROM public.veiculos WHERE transportador_id = t RETURNING id INTO v;
  INSERT INTO public.localizacoes_gps (viagem_id, transportador_id, posicao, "timestamp") VALUES
    (v, t, ST_SetSRID(ST_MakePoint(-46.6, -23.5), 4326), now() - interval '31 days'),
    (v, t, ST_SetSRID(ST_MakePoint(-46.6, -23.5), 4326), now());

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  BEGIN PERFORM public.limpar_localizacoes_gps(); EXCEPTION WHEN insufficient_privilege THEN negou := true; END;
  ASSERT negou, 'usuário do app não executa a limpeza';

  PERFORM set_config('role', 'postgres', true);
  n := public.limpar_localizacoes_gps();
  ASSERT n >= 1, 'apagou a posição antiga';
  ASSERT (SELECT count(*) FROM public.localizacoes_gps WHERE viagem_id = v) = 1, 'ficou só a posição recente';
END $$;
ROLLBACK;
