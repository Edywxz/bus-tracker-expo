-- O responsável podia fazer UPDATE em qualquer coluna do próprio aluno, inclusive transportador_id (vincular-se a
-- qualquer transportador sem código nem contrato), responsavel_id e endereco_*_id (apontar para endereço de outra
-- pessoa e fazer o transportador lê-lo pela policy enderecos_select). O vínculo agora só muda por vincular_aluno /
-- desvincular_aluno; o aluno nasce só em cadastrar_aluno (SECURITY DEFINER), então INSERT e DELETE diretos também saem.
REVOKE INSERT, UPDATE, DELETE ON public.alunos FROM authenticated, anon;
GRANT UPDATE (nome, data_nascimento, documento, turma, turno, escola_nome, escola_endereco,
              observacoes_medicas, foto_url, endereco_busca, endereco_entrega, ativo)
  ON public.alunos TO authenticated;
