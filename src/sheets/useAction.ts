import { useCallback, useState } from 'react';
import { mensagemErro } from '../utils/format';

/** Executa uma ação assíncrona controlando carregamento e erro. Retorna true se deu certo. */
export function useAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setLoading(true); setError(null);
    try { await fn(); return true; }
    catch (e) { setError(mensagemErro(e)); return false; }
    finally { setLoading(false); }
  }, []);
  return { run, loading, error, setError };
}
