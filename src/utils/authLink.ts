/** Lê o link que o Supabase manda por e-mail (confirmação de cadastro): os tokens vêm no fragmento (#...). */
export interface LinkAuth {
  sessao?: { accessToken: string; refreshToken: string };
  tipo?: string;
  erro?: string;
}

export function lerLinkAuth(url: string): LinkAuth | null {
  const i = url.indexOf('#');
  if (i < 0) return null;
  const p = new URLSearchParams(url.slice(i + 1));
  const erroCodigo = p.get('error_code') ?? p.get('error');
  if (erroCodigo) {
    return { erro: erroCodigo === 'otp_expired' ? 'O link expirou ou já foi usado. Peça um novo e-mail de confirmação.' : 'Não foi possível validar o link.' };
  }
  const accessToken = p.get('access_token');
  const refreshToken = p.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { sessao: { accessToken, refreshToken }, tipo: p.get('type') ?? undefined };
}
