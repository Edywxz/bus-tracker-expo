-- Conversa privada: cada thread é entre o motorista e UM responsável.
ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE;
DELETE FROM public.mensagens WHERE responsavel_id IS NULL; -- mensagens do antigo canal em grupo não têm dono e não podem ser expostas
ALTER TABLE public.mensagens ALTER COLUMN responsavel_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mensagens_thread ON public.mensagens (transportador_id, responsavel_id, criado_em);

DROP POLICY IF EXISTS mensagens_select ON public.mensagens;
DROP POLICY IF EXISTS mensagens_insert ON public.mensagens;
CREATE POLICY mensagens_select ON public.mensagens FOR SELECT
  USING (auth.uid() = transportador_id OR auth.uid() = responsavel_id);
CREATE POLICY mensagens_insert ON public.mensagens FOR INSERT WITH CHECK (
  remetente_id = auth.uid() AND (
    (origem = 'MOTORISTA' AND transportador_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.responsavel_id = mensagens.responsavel_id AND a.transportador_id = auth.uid()))
    OR
    (origem = 'PAIS' AND responsavel_id = auth.uid()
      AND EXISTS (SELECT 1 FROM public.alunos a WHERE a.responsavel_id = auth.uid() AND a.transportador_id = mensagens.transportador_id))
  )
);

-- Coordenadas (opcionais) para indicar a chegada ao endereço mais próximo.
ALTER TABLE public.alunos
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS entrega_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS entrega_longitude DOUBLE PRECISION;
