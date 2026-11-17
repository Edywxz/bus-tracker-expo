-- Avisa o responsável (notificação + push) quando a van chega perto da casa do dependente: na ida, enquanto o aluno
-- ainda não embarcou; na volta, enquanto ele está a bordo. Roda no servidor a cada posição gravada, então funciona
-- mesmo com o app do responsável fechado. Um aviso por aluno e viagem.
CREATE TABLE IF NOT EXISTS public.alertas_proximidade (
  viagem_id UUID NOT NULL REFERENCES public.viagens(id) ON DELETE CASCADE,
  aluno_id  UUID NOT NULL REFERENCES public.alunos(id)  ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (viagem_id, aluno_id)
);
ALTER TABLE public.alertas_proximidade ENABLE ROW LEVEL SECURITY; -- sem policy: só a função abaixo (SECURITY DEFINER) usa
REVOKE ALL ON public.alertas_proximidade FROM anon, authenticated;
GRANT ALL ON public.alertas_proximidade TO service_role;
CREATE INDEX IF NOT EXISTS idx_registros_viagem_aluno ON public.registros_embarque_desembarque (viagem_id, aluno_id);

CREATE OR REPLACE FUNCTION public.alertar_van_chegando()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v public.viagens%ROWTYPE;
  r RECORD;
BEGIN
  SELECT * INTO v FROM public.viagens WHERE id = NEW.viagem_id AND status = 'EM_ANDAMENTO';
  IF NOT FOUND THEN RETURN NEW; END IF;

  FOR r IN
    SELECT a.id, a.nome, a.responsavel_id
    FROM public.alunos a
    JOIN public.enderecos_responsavel e ON e.id = a.endereco_busca_id AND e.latitude IS NOT NULL
    WHERE a.transportador_id = v.transportador_id AND a.ativo
      AND public.ST_DWithin(public.ST_SetSRID(public.ST_MakePoint(e.longitude, e.latitude), 4326)::public.geography, NEW.posicao::public.geography, 400)
      AND NOT EXISTS (SELECT 1 FROM public.alertas_proximidade p WHERE p.viagem_id = v.id AND p.aluno_id = a.id)
      AND NOT EXISTS (SELECT 1 FROM public.comunicados_ausencia c WHERE c.aluno_id = a.id
                      AND current_date BETWEEN c.data_inicio AND c.data_fim AND c.periodo::text IN (v.tipo_viagem::text, 'AMBOS'))
      AND CASE v.tipo_viagem
            WHEN 'IDA' THEN NOT EXISTS (SELECT 1 FROM public.registros_embarque_desembarque g WHERE g.viagem_id = v.id AND g.aluno_id = a.id)
            ELSE EXISTS (SELECT 1 FROM public.registros_embarque_desembarque g WHERE g.viagem_id = v.id AND g.aluno_id = a.id AND g.tipo = 'EMBARQUE')
             AND NOT EXISTS (SELECT 1 FROM public.registros_embarque_desembarque g WHERE g.viagem_id = v.id AND g.aluno_id = a.id AND g.tipo = 'DESEMBARQUE')
          END
  LOOP
    INSERT INTO public.alertas_proximidade (viagem_id, aluno_id) VALUES (v.id, r.id) ON CONFLICT DO NOTHING;
    IF FOUND THEN
      PERFORM public.notificar(r.responsavel_id, 'CHEGANDO', 'A van está chegando',
        CASE v.tipo_viagem WHEN 'IDA' THEN 'A van está perto: ' || split_part(r.nome, ' ', 1) || ' será buscado em instantes.'
                           ELSE 'A van está perto de casa com ' || split_part(r.nome, ' ', 1) || '.' END);
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.alertar_van_chegando() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_alertar_van_chegando ON public.localizacoes_gps;
CREATE TRIGGER trg_alertar_van_chegando AFTER INSERT ON public.localizacoes_gps
  FOR EACH ROW EXECUTE FUNCTION public.alertar_van_chegando();
