-- Permissões e RLS: o que o app faz continua funcionando e o que não pode é negado. Tudo é desfeito no ROLLBACK.
BEGIN;

-- Executa um comando e diz se foi negado (privilégio de tabela/coluna ou policy de RLS: SQLSTATE 42501).
CREATE FUNCTION public._t_nega(cmd text) RETURNS boolean LANGUAGE plpgsql AS $f$
BEGIN
  EXECUTE cmd;
  RETURN false;
EXCEPTION WHEN insufficient_privilege THEN RETURN true;
END $f$;
GRANT EXECUTE ON FUNCTION public._t_nega(text) TO anon, authenticated;

DO $$
DECLARE
  t uuid := gen_random_uuid(); t2 uuid := gen_random_uuid(); r uuid := gen_random_uuid(); r2 uuid := gen_random_uuid();
  cod text; cod2 text; a1 uuid; a2 uuid; v1 uuid; v2 uuid; via1 uuid; via2 uuid; mens uuid; pag uuid; n int; ok boolean;
  ins text := '00000000-0000-0000-0000-000000000000';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) VALUES
    (t,  ins::uuid, 'authenticated', 'authenticated', 'pr-t@teste.local',  '{"nome":"T","tipo_usuario":"TRANSPORTADOR"}', now(), now()),
    (t2, ins::uuid, 'authenticated', 'authenticated', 'pr-t2@teste.local', '{"nome":"T2","tipo_usuario":"TRANSPORTADOR"}', now(), now()),
    (r,  ins::uuid, 'authenticated', 'authenticated', 'pr-r@teste.local',  '{"nome":"R","tipo_usuario":"RESPONSAVEL"}', now(), now()),
    (r2, ins::uuid, 'authenticated', 'authenticated', 'pr-r2@teste.local', '{"nome":"R2","tipo_usuario":"RESPONSAVEL"}', now(), now());
  SELECT codigo_convite INTO cod  FROM public.transportadores WHERE id = t;
  SELECT codigo_convite INTO cod2 FROM public.transportadores WHERE id = t2;

  -- dados base criados pelas funções do app
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', r::text, true);
  a1 := public.cadastrar_aluno('Aluno1', '2015-01-01', '1', '5A', 'MANHA', 'Rua A', 'Rua B', '', cod);
  PERFORM set_config('request.jwt.claim.sub', r2::text, true);
  a2 := public.cadastrar_aluno('Aluno2', '2015-01-01', '2', '5B', 'MANHA', 'Rua C', 'Rua D', '', cod2);

  -- ---------------- anônimo não enxerga nem executa nada
  PERFORM set_config('role', 'anon', true);
  ASSERT public._t_nega('SELECT count(*) FROM public.alunos'), 'anon não lê alunos';
  ASSERT public._t_nega('SELECT public.cadastrar_aluno(''x'', ''2015-01-01'', ''1'', ''1'', ''MANHA'', ''a'', ''b'', '''', ''X'')'), 'anon não executa RPCs';

  -- ---------------- motorista t: fluxos do app
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  INSERT INTO public.veiculos (transportador_id, placa, modelo, ano, capacidade_assentos, renavam, numero_alvara, validade_vistoria)
    VALUES (t, 'AAA1A11', 'Van', 2020, 15, '1', '1', '2030-01-01') RETURNING id INTO v1;
  UPDATE public.veiculos SET modelo = 'Van 2' WHERE id = v1;
  UPDATE public.transportadores SET chave_pix = 'pix@t', valor_mensalidade_padrao = 400, dia_vencimento_padrao = 5 WHERE id = t;
  INSERT INTO public.viagens (transportador_id, veiculo_id, tipo_viagem, turno, status, data_hora_inicio)
    VALUES (t, v1, 'IDA', 'MANHA', 'EM_ANDAMENTO', now()) RETURNING id INTO via1;
  INSERT INTO public.localizacoes_gps (viagem_id, transportador_id, posicao, velocidade)
    VALUES (via1, t, ST_SetSRID(ST_MakePoint(-46.6, -23.5), 4326), 30);
  INSERT INTO public.registros_embarque_desembarque (viagem_id, aluno_id, tipo, latitude, longitude) VALUES (via1, a1, 'EMBARQUE', -23.5, -46.6);
  INSERT INTO public.eventos_rota (viagem_id, transportador_id, tipo, descricao) VALUES (via1, t, 'Trânsito', 'Lentidão');
  INSERT INTO public.calendario_escolar (transportador_id, data, titulo, tipo) VALUES (t, '2026-12-25', 'Natal', 'FERIADO');
  UPDATE public.calendario_escolar SET titulo = 'Natal 2026' WHERE transportador_id = t;
  UPDATE public.viagens SET status = 'CONCLUIDA', data_hora_fim = now(), km_percorrido = 12.5 WHERE id = via1;
  DELETE FROM public.calendario_escolar WHERE transportador_id = t;
  INSERT INTO public.mensagens (transportador_id, responsavel_id, remetente_id, remetente_nome, origem, texto) VALUES (t, r, t, 'T', 'MOTORISTA', 'Oi');
  PERFORM set_config('request.jwt.claim.sub', t2::text, true);
  INSERT INTO public.veiculos (transportador_id, placa, modelo, ano, capacidade_assentos, renavam, numero_alvara, validade_vistoria)
    VALUES (t2, 'BBB2B22', 'Van', 2020, 15, '1', '1', '2030-01-01') RETURNING id INTO v2;
  INSERT INTO public.viagens (transportador_id, veiculo_id, tipo_viagem, turno, status) VALUES (t2, v2, 'IDA', 'MANHA', 'EM_ANDAMENTO') RETURNING id INTO via2;

  -- ---------------- motorista t: o que é negado
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  ASSERT public._t_nega(format('UPDATE public.transportadores SET codigo_convite = ''ABCDEF'' WHERE id = %L', t)), 'codigo_convite só pela RPC';
  ASSERT public._t_nega(format('INSERT INTO public.viagens (transportador_id, veiculo_id, tipo_viagem, turno) VALUES (%L, %L, ''IDA'', ''MANHA'')', t, v2)), 'viagem com veículo alheio';
  ASSERT public._t_nega(format('INSERT INTO public.localizacoes_gps (viagem_id, transportador_id, posicao) VALUES (%L, %L, ST_SetSRID(ST_MakePoint(0,0),4326))', via2, t)), 'GPS em viagem alheia';
  ASSERT public._t_nega(format('INSERT INTO public.eventos_rota (viagem_id, transportador_id, tipo, descricao) VALUES (%L, %L, ''x'', ''y'')', via2, t)), 'evento em viagem alheia';
  ASSERT public._t_nega(format('INSERT INTO public.registros_embarque_desembarque (viagem_id, aluno_id, tipo) VALUES (%L, %L, ''EMBARQUE'')', via1, a2)), 'embarque de aluno de outro transportador';
  ASSERT public._t_nega(format('INSERT INTO public.registros_embarque_desembarque (viagem_id, aluno_id, tipo) VALUES (%L, %L, ''EMBARQUE'')', via2, a1)), 'embarque em viagem alheia';
  SELECT id INTO mens FROM public.mensalidades WHERE transportador_id = t LIMIT 1;
  ASSERT public._t_nega(format('UPDATE public.mensalidades SET status = ''PAGO'', valor = 1 WHERE id = %L', mens)), 'motorista não altera mensalidade direto';
  ASSERT public._t_nega('DELETE FROM public.contratos_servico'), 'motorista não apaga contratos';
  ASSERT public._t_nega(format('UPDATE public.veiculos SET transportador_id = %L WHERE id = %L', t2, v1)), 'não doa veículo';
  ASSERT public._t_nega('SELECT public.trg_notificar_viagem()'), 'funções de trigger não são chamáveis';
  ASSERT public._t_nega('SELECT public.notificar(''' || r || ''', ''AVISO'', ''spam'', ''x'')'), 'notificar só do sistema';

  -- ---------------- responsável r: fluxos do app
  PERFORM set_config('request.jwt.claim.sub', r::text, true);
  ASSERT (SELECT count(*) FROM public.viagens WHERE id = via1) = 1, 'responsável vê a viagem do seu motorista';
  ASSERT (SELECT count(*) FROM public.localizacoes_gps WHERE viagem_id = via1) = 1, 'responsável vê o GPS do seu motorista';
  ASSERT (SELECT count(*) FROM public.viagens WHERE id = via2) = 0, 'responsável não vê viagem de outro motorista';
  ASSERT (SELECT count(*) FROM public.alunos WHERE id = a2) = 0, 'responsável não vê aluno alheio';
  ASSERT (SELECT count(*) FROM public.mensalidades WHERE responsavel_id = r2) = 0, 'responsável não vê cobrança alheia';
  ASSERT (SELECT chave_pix FROM public.transportadores WHERE id = t) = 'pix@t', 'responsável lê a chave PIX do seu motorista';
  INSERT INTO public.comunicados_ausencia (aluno_id, responsavel_id, transportador_id, data_inicio, data_fim, periodo, motivo)
    VALUES (a1, r, t, current_date, current_date, 'AMBOS', 'febre');
  INSERT INTO public.mensagens (transportador_id, responsavel_id, remetente_id, remetente_nome, origem, texto) VALUES (t, r, r, 'R', 'PAIS', 'Olá');
  INSERT INTO public.pessoas_autorizadas (aluno_id, nome, cpf, telefone, grau_parentesco) VALUES (a1, 'Avó', '123', '11999999999', 'Avó');
  INSERT INTO public.enderecos_responsavel (responsavel_id, endereco_texto, rotulo) VALUES (r, 'Rua Nova 1', 'Casa');
  UPDATE public.enderecos_responsavel SET latitude = -23.5, longitude = -46.6, precisao = 'MANUAL', origem = 'MANUAL', ajustado_manual = true WHERE responsavel_id = r;
  UPDATE public.notificacoes SET lida = true WHERE usuario_id = r;
  UPDATE public.perfis SET nome = 'Novo' WHERE id = r;
  DELETE FROM public.pessoas_autorizadas WHERE aluno_id = a1;
  SELECT id INTO mens FROM public.mensalidades WHERE responsavel_id = r LIMIT 1;
  pag := public.registrar_pagamento(mens, 'PIX', 'tx-1');
  ASSERT (SELECT status FROM public.pagamentos WHERE id = pag) = 'PENDENTE', 'pagamento nasce PENDENTE';

  -- ---------------- responsável r: o que é negado
  ASSERT public._t_nega(format('INSERT INTO public.pagamentos (mensalidade_id, metodo, valor_pago, status) VALUES (%L, ''PIX'', 1, ''CONFIRMADO'')', mens)), 'não forja pagamento';
  ASSERT public._t_nega(format('UPDATE public.pagamentos SET status = ''CONFIRMADO'' WHERE id = %L', pag)), 'não confirma o próprio pagamento';
  ASSERT public._t_nega('UPDATE public.contratos_servico SET valor_mensalidade = 1'), 'não altera contrato';
  ASSERT public._t_nega('UPDATE public.mensalidades SET valor = 1'), 'não altera mensalidade';
  ASSERT public._t_nega('DELETE FROM public.contratos_servico'), 'não apaga contrato';
  ASSERT public._t_nega(format('INSERT INTO public.comunicados_ausencia (aluno_id, responsavel_id, transportador_id, data_inicio, data_fim, periodo) VALUES (%L, %L, %L, current_date, current_date, ''IDA'')', a2, r, t2)), 'ausência de aluno alheio';
  ASSERT public._t_nega(format('INSERT INTO public.comunicados_ausencia (aluno_id, responsavel_id, transportador_id, data_inicio, data_fim, periodo) VALUES (%L, %L, %L, current_date, current_date, ''IDA'')', a1, r, t2)), 'ausência com transportador errado';
  ASSERT public._t_nega(format('INSERT INTO public.pessoas_autorizadas (aluno_id, nome, cpf, telefone, grau_parentesco) VALUES (%L, ''X'', ''1'', ''1'', ''x'')', a2)), 'pessoa autorizada em aluno alheio';
  ASSERT public._t_nega(format('INSERT INTO public.mensagens (transportador_id, responsavel_id, remetente_id, remetente_nome, origem, texto) VALUES (%L, %L, %L, ''R'', ''PAIS'', ''x'')', t2, r, r)), 'mensagem para motorista sem vínculo';
  ASSERT public._t_nega(format('INSERT INTO public.viagens (transportador_id, veiculo_id, tipo_viagem, turno) VALUES (%L, %L, ''IDA'', ''MANHA'')', r, v1)), 'responsável não cria viagem';
  ASSERT public._t_nega(format('UPDATE public.notificacoes SET titulo = ''x'' WHERE usuario_id = %L', r)), 'notificação: só a coluna lida';
  ASSERT public._t_nega(format('UPDATE public.perfis SET tipo_usuario = ''TRANSPORTADOR'' WHERE id = %L', r)), 'não troca o papel';
  BEGIN PERFORM public.vincular_aluno(a2, cod); ok := false; EXCEPTION WHEN no_data_found THEN ok := true; END;
  ASSERT ok, 'não vincula aluno alheio';
  UPDATE public.alunos SET nome = 'Invasor' WHERE id = a2; GET DIAGNOSTICS n = ROW_COUNT;
  ASSERT n = 0, 'não edita aluno alheio (0 linhas)';

  -- ---------------- confirmação do motorista continua funcionando
  PERFORM set_config('request.jwt.claim.sub', t::text, true);
  PERFORM public.confirmar_recebimento(pag, true);
  ASSERT (SELECT status FROM public.mensalidades WHERE id = mens) = 'PAGO', 'confirmação marca a mensalidade como paga';
END $$;
ROLLBACK;
