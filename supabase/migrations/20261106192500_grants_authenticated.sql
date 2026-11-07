-- O papel authenticated precisa de privilégios nas tabelas; a RLS (ligada em todas) decide as linhas.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.alunos, public.calendario_escolar, public.comunicados_ausencia, public.contratos_servico, public.eventos_rota,
  public.localizacoes_gps, public.mensagens, public.mensalidades, public.notificacoes, public.pagamentos, public.perfis,
  public.pessoas_autorizadas, public.registros_embarque_desembarque, public.responsaveis, public.transportadores,
  public.veiculos, public.viagens
TO authenticated;
