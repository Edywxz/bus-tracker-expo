-- Código de convite renovável e vínculo aluno <-> transportador desfazível/refeito (pendência #18).
--  * aluno.transportador_id passa a aceitar NULL = "sem transportador" (FK RESTRICT continua valendo quando preenchido).
--  * Desvincular cancela o contrato e as mensalidades futuras; dívidas já vencidas continuam visíveis.
--  * Vincular de novo cria contrato e mensalidades do ano, como em cadastrar_aluno.
ALTER TABLE public.alunos ALTER COLUMN transportador_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.renovar_codigo_convite()
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_codigo TEXT;
BEGIN
  LOOP
    v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    BEGIN
      UPDATE public.transportadores SET codigo_convite = v_codigo WHERE id = auth.uid();
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Apenas transportadores têm código de convite' USING ERRCODE = '42501';
      END IF;
      RETURN v_codigo;
    EXCEPTION WHEN unique_violation THEN
      NULL; -- colisão (raríssima): sorteia outro
    END;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.desvincular_aluno(p_aluno uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  a public.alunos%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.alunos WHERE id = p_aluno FOR UPDATE;
  IF NOT FOUND OR (a.responsavel_id <> v_uid AND a.transportador_id IS DISTINCT FROM v_uid) THEN
    RAISE EXCEPTION 'Aluno não encontrado' USING ERRCODE = 'P0002';
  END IF;
  IF a.transportador_id IS NULL THEN
    RAISE EXCEPTION 'Este aluno já está sem transportador' USING ERRCODE = '22023';
  END IF;

  UPDATE public.contratos_servico SET status = 'CANCELADO'
   WHERE aluno_id = p_aluno AND status IN ('ATIVO', 'SUSPENSO');
  UPDATE public.mensalidades SET status = 'CANCELADO'
   WHERE status = 'PENDENTE' AND data_vencimento >= CURRENT_DATE
     AND contrato_id IN (SELECT id FROM public.contratos_servico WHERE aluno_id = p_aluno);
  UPDATE public.alunos SET transportador_id = NULL WHERE id = p_aluno;

  IF v_uid = a.responsavel_id THEN
    PERFORM public.notificar(a.transportador_id, 'AVISO', 'Aluno desvinculado', a.nome || ' saiu da sua rota.');
  ELSE
    PERFORM public.notificar(a.responsavel_id, 'AVISO', 'Aluno removido da rota',
      a.nome || ' foi removido da rota pelo transportador. Vincule-o a um transportador para voltar a usar a van.');
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.vincular_aluno(p_aluno uuid, p_codigo text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  a public.alunos%ROWTYPE;
  v_transp public.transportadores%ROWTYPE;
  v_contrato UUID;
  v_ano INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
BEGIN
  SELECT * INTO a FROM public.alunos WHERE id = p_aluno FOR UPDATE;
  IF NOT FOUND OR a.responsavel_id <> v_uid THEN
    RAISE EXCEPTION 'Aluno não encontrado' USING ERRCODE = 'P0002';
  END IF;
  IF a.transportador_id IS NOT NULL THEN
    RAISE EXCEPTION 'Este aluno já tem transportador. Desvincule antes de trocar.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_transp FROM public.transportadores WHERE codigo_convite = upper(trim(p_codigo));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código do transportador inválido' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.alunos SET transportador_id = v_transp.id WHERE id = p_aluno;

  INSERT INTO public.contratos_servico (numero_contrato, transportador_id, responsavel_id, aluno_id,
                                        valor_mensalidade, dia_vencimento, data_inicio, data_termino, termos_condicoes)
  VALUES ('VE-' || v_ano || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
          v_transp.id, v_uid, p_aluno, v_transp.valor_mensalidade_padrao, v_transp.dia_vencimento_padrao,
          CURRENT_DATE, make_date(v_ano, 12, 31),
          'Prestação de serviço de transporte escolar conforme combinado entre as partes. Mensalidade com vencimento mensal; atraso sujeito a multa e juros.')
  RETURNING id INTO v_contrato;

  INSERT INTO public.mensalidades (contrato_id, responsavel_id, transportador_id, mes_referencia, ano_referencia, valor, data_vencimento)
  SELECT v_contrato, v_uid, v_transp.id, m, v_ano, v_transp.valor_mensalidade_padrao,
         make_date(v_ano, m, v_transp.dia_vencimento_padrao)
  FROM generate_series(EXTRACT(MONTH FROM CURRENT_DATE)::INT, 12) AS m;

  PERFORM public.notificar(v_transp.id, 'AVISO', 'Novo aluno vinculado', a.nome || ' foi adicionado à sua rota.');
END;
$function$;

-- Agora que o transportador pode soltar os alunos, a exclusão também leva os contratos (cancelados) que ele tinha.
CREATE OR REPLACE FUNCTION public.excluir_minha_conta()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado' USING ERRCODE = '28000';
  END IF;
  IF EXISTS (SELECT 1 FROM public.alunos WHERE transportador_id = v_uid) THEN
    RAISE EXCEPTION 'Você ainda tem alunos na rota. Remova-os da rota (em cada aluno) antes de excluir a conta.'
      USING ERRCODE = '23503';
  END IF;

  DELETE FROM public.contratos_servico WHERE responsavel_id = v_uid OR transportador_id = v_uid; -- cascade: mensalidades e pagamentos
  DELETE FROM auth.users WHERE id = v_uid;                                                        -- cascade: perfis e todo o resto
END;
$function$;

REVOKE ALL ON FUNCTION public.renovar_codigo_convite() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.desvincular_aluno(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.vincular_aluno(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.renovar_codigo_convite() TO authenticated;
GRANT EXECUTE ON FUNCTION public.desvincular_aluno(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vincular_aluno(uuid, text) TO authenticated;
