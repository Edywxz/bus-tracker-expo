-- O usuário logado só pode alterar nome, telefone e CPF do próprio perfil.
-- Antes ele podia atualizar também tipo_usuario (virar motorista), email, ativo e id: o papel é decidido no cadastro, no servidor.
REVOKE UPDATE ON public.perfis FROM authenticated;
GRANT UPDATE (nome, telefone, cpf) ON public.perfis TO authenticated;
