-- Edge Functions usam service_role (ignora RLS, mas precisa de privilégio na tabela).
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.alunos, public.calendario_escolar, public.comunicados_ausencia, public.contratos_servico, public.eventos_rota,
  public.localizacoes_gps, public.mensagens, public.mensalidades, public.notificacoes, public.pagamentos, public.perfis,
  public.pessoas_autorizadas, public.registros_embarque_desembarque, public.responsaveis, public.transportadores,
  public.veiculos, public.viagens, public.enderecos_responsavel
TO service_role;
