-- Marca como VENCIDO, todo dia às 03:00 UTC (00:00 em Brasília), as mensalidades PENDENTE em atraso.
-- cron.schedule com nome é idempotente: reaplicar atualiza o job em vez de duplicar.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'mensalidades-vencidas',
  '0 3 * * *',
  $$SELECT public.atualizar_mensalidades_vencidas()$$
);
