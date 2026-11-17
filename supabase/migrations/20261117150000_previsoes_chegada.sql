-- Previsão de chegada da van por aluno. Quem escreve é a Edge Function `rota-otimizada` (service_role), que conhece a rota inteira;
-- cada responsável lê só as linhas dos próprios dependentes (RLS), então não vê endereço, ordem nem tempo de outras famílias.
CREATE TABLE public.previsoes_chegada (
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  evento VARCHAR(7) NOT NULL CHECK (evento IN ('BUSCA', 'ENTREGA')),
  transportador_id UUID NOT NULL REFERENCES public.transportadores(id) ON DELETE CASCADE,
  minutos INT NOT NULL CHECK (minutos >= 0),
  calculado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (aluno_id, evento)
);
CREATE INDEX idx_previsoes_transportador ON public.previsoes_chegada (transportador_id);

ALTER TABLE public.previsoes_chegada ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.previsoes_chegada FROM anon, authenticated;
GRANT SELECT ON public.previsoes_chegada TO authenticated;
GRANT ALL ON public.previsoes_chegada TO service_role;

CREATE POLICY previsoes_select ON public.previsoes_chegada FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.alunos a WHERE a.id = previsoes_chegada.aluno_id
         AND ((SELECT auth.uid()) = a.responsavel_id OR (SELECT auth.uid()) = a.transportador_id)));

-- o app assina mudanças da tabela para atualizar a previsão na hora
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'previsoes_chegada') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.previsoes_chegada;
  END IF;
END $$;
