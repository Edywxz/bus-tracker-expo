-- Push notifications: guarda o token Expo de cada aparelho e dispara a Edge Function `enviar-push`
-- a cada notificação criada. O disparo só funciona depois de cadastrar os 2 segredos no Vault
-- (ver supabase/README.md); sem eles o gatilho não faz nada e o app segue normal.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.push_tokens (
    token TEXT PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    plataforma VARCHAR(10) NOT NULL CHECK (plataforma IN ('ios', 'android')),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_usuario ON public.push_tokens(usuario_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_tokens_proprios_select" ON public.push_tokens;
CREATE POLICY "push_tokens_proprios_select" ON public.push_tokens FOR SELECT USING (auth.uid() = usuario_id);
DROP POLICY IF EXISTS "push_tokens_proprios_delete" ON public.push_tokens;
CREATE POLICY "push_tokens_proprios_delete" ON public.push_tokens FOR DELETE USING (auth.uid() = usuario_id);

GRANT SELECT, DELETE ON public.push_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO service_role;

-- Registro via RPC: se o mesmo aparelho trocar de conta, o token passa para quem está logado
-- (um upsert direto falharia na RLS porque a linha antiga pertence a outro usuário).
CREATE OR REPLACE FUNCTION public.registrar_push_token(p_token TEXT, p_plataforma TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_token !~ '^(Expo|Exponent)PushToken\[.+\]$' THEN RAISE EXCEPTION 'Token inválido'; END IF;
  INSERT INTO public.push_tokens (token, usuario_id, plataforma)
  VALUES (p_token, auth.uid(), p_plataforma)
  ON CONFLICT (token) DO UPDATE SET usuario_id = auth.uid(), plataforma = EXCLUDED.plataforma, atualizado_em = NOW();
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_push_token(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_push_token(TEXT, TEXT) TO authenticated;

-- Chama a Edge Function a cada notificação. Segredos lidos do Vault: push_function_url e push_webhook_secret.
CREATE OR REPLACE FUNCTION public.trg_notificacao_push()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_url TEXT; v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'push_function_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'push_webhook_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN RETURN NEW; END IF;
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := jsonb_build_object('usuario_id', NEW.usuario_id, 'tipo', NEW.tipo, 'titulo', NEW.titulo, 'mensagem', NEW.mensagem)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- o push nunca pode impedir a gravação da notificação
END;
$$;
REVOKE ALL ON FUNCTION public.trg_notificacao_push() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notificacao_push ON public.notificacoes;
CREATE TRIGGER trg_notificacao_push AFTER INSERT ON public.notificacoes
  FOR EACH ROW EXECUTE FUNCTION public.trg_notificacao_push();
