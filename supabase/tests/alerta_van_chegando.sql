-- Alerta "van chegando": 1 aviso por aluno e viagem, só perto da casa, só para o responsável do aluno. Desfeito no ROLLBACK.
BEGIN;
DO $$
DECLARE t uuid := gen_random_uuid(); r1 uuid := gen_random_uuid(); r2 uuid := gen_random_uuid();
        cod text; e1 uuid; e2 uuid; a1 uuid; a2 uuid; v uuid; ins uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) VALUES
    (t,  ins, 'authenticated', 'authenticated', 'ch-t@teste.local',  '{"nome":"T","tipo_usuario":"TRANSPORTADOR"}', now(), now()),
    (r1, ins, 'authenticated', 'authenticated', 'ch-r1@teste.local', '{"nome":"R1","tipo_usuario":"RESPONSAVEL"}', now(), now()),
    (r2, ins, 'authenticated', 'authenticated', 'ch-r2@teste.local', '{"nome":"R2","tipo_usuario":"RESPONSAVEL"}', now(), now());
  SELECT codigo_convite INTO cod FROM public.transportadores WHERE id = t;
  -- casas: a1 em (-23.5000, -46.6000); a2 a ~5 km dali
  INSERT INTO public.enderecos_responsavel (responsavel_id, endereco_texto, latitude, longitude) VALUES (r1, 'Rua A', -23.5000, -46.6000) RETURNING id INTO e1;
  INSERT INTO public.enderecos_responsavel (responsavel_id, endereco_texto, latitude, longitude) VALUES (r2, 'Rua C', -23.5450, -46.6000) RETURNING id INTO e2;
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', r1::text, true);
  a1 := public.cadastrar_aluno('Aluno1', '2015-01-01', '1', '5A', 'MANHA', 'Rua A', 'Rua B', '', cod, p_endereco_busca_id => e1);
  PERFORM set_config('request.jwt.claim.sub', r2::text, true);
  a2 := public.cadastrar_aluno('Aluno2', '2015-01-01', '2', '5B', 'MANHA', 'Rua C', 'Rua D', '', cod, p_endereco_busca_id => e2);
  PERFORM set_config('role', 'postgres', true);

  INSERT INTO public.veiculos (transportador_id, placa, modelo, ano, capacidade_assentos, renavam, numero_alvara, validade_vistoria)
    VALUES (t, 'TST2B34', 'Van', 2020, 15, '1', '1', '2030-01-01');
  INSERT INTO public.viagens (transportador_id, veiculo_id, tipo_viagem, turno, status)
    SELECT t, id, 'IDA', 'MANHA', 'EM_ANDAMENTO' FROM public.veiculos WHERE transportador_id = t RETURNING id INTO v;

  -- longe de todos: nada
  INSERT INTO public.localizacoes_gps (viagem_id, transportador_id, posicao) VALUES (v, t, ST_SetSRID(ST_MakePoint(-46.7, -23.6), 4326));
  ASSERT (SELECT count(*) FROM public.notificacoes WHERE tipo = 'CHEGANDO') = 0, 'longe: sem aviso';

  -- a ~100 m da casa do a1: avisa só o r1, e uma vez só
  INSERT INTO public.localizacoes_gps (viagem_id, transportador_id, posicao) VALUES (v, t, ST_SetSRID(ST_MakePoint(-46.6000, -23.5009), 4326));
  INSERT INTO public.localizacoes_gps (viagem_id, transportador_id, posicao) VALUES (v, t, ST_SetSRID(ST_MakePoint(-46.6000, -23.5005), 4326));
  ASSERT (SELECT count(*) FROM public.notificacoes WHERE tipo = 'CHEGANDO' AND usuario_id = r1) = 1, 'r1 avisado uma vez';
  ASSERT (SELECT count(*) FROM public.notificacoes WHERE tipo = 'CHEGANDO' AND usuario_id = r2) = 0, 'r2 não é avisado';

  -- aluno que já embarcou na ida não recebe aviso (a2): embarca e a van passa perto
  INSERT INTO public.registros_embarque_desembarque (viagem_id, aluno_id, tipo) VALUES (v, a2, 'EMBARQUE');
  INSERT INTO public.localizacoes_gps (viagem_id, transportador_id, posicao) VALUES (v, t, ST_SetSRID(ST_MakePoint(-46.6000, -23.5450), 4326));
  ASSERT (SELECT count(*) FROM public.notificacoes WHERE tipo = 'CHEGANDO' AND usuario_id = r2) = 0, 'já embarcou: sem aviso';
END $$;
ROLLBACK;
