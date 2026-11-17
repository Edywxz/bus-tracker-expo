-- A van grava uma posição a cada poucos segundos: sem limpeza a tabela só cresce, e o trajeto de crianças é dado
-- sensível (LGPD, minimização). Ficam 30 dias; a última posição de uma viagem em andamento é sempre recente.
CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON public.localizacoes_gps ("timestamp");

CREATE OR REPLACE FUNCTION public.limpar_localizacoes_gps()
RETURNS integer LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.localizacoes_gps WHERE "timestamp" < now() - interval '30 days';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.limpar_localizacoes_gps() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('limpeza-localizacoes-gps', '30 3 * * *', $$SELECT public.limpar_localizacoes_gps()$$);
