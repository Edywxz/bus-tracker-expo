-- Exclusão de conta (App Store / LGPD). Antes o app só apagava o perfil por DELETE, que a RLS negava em silêncio,
-- e contratos/mensalidades (FK RESTRICT) e o usuário do Auth nunca eram removidos.
--
-- Regras:
--  * Responsável: apaga contratos, mensalidades e pagamentos dele; o cascade do Auth leva perfil, dependentes,
--    endereços, mensagens, notificações e tokens de push.
--  * Transportador: só exclui se não tiver nenhum aluno vinculado (aluno.transportador_id é RESTRICT e apagar
--    alunos destruiria dados dos responsáveis). Com alunos, a função recusa com a mensagem abaixo.
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
    RAISE EXCEPTION 'Você ainda tem alunos vinculados à sua rota e não pode excluir a conta agora. Fale com o suporte.'
      USING ERRCODE = '23503';
  END IF;

  DELETE FROM public.contratos_servico WHERE responsavel_id = v_uid; -- cascade: mensalidades e pagamentos
  DELETE FROM auth.users WHERE id = v_uid;                          -- cascade: perfis e todo o resto
END;
$function$;

REVOKE ALL ON FUNCTION public.excluir_minha_conta() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.excluir_minha_conta() TO authenticated;
