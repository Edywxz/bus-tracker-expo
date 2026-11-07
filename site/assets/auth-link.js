function fragmento(url) {
  const i = url.indexOf('#');
  return new URLSearchParams(i < 0 ? '' : url.slice(i + 1));
}

function tokens(p) {
  const accessToken = p.get('access_token');
  const refreshToken = p.get('refresh_token');
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

const expirado = (p) => p.get('error_code') === 'otp_expired';

export function lerRecuperacao(url) {
  const p = fragmento(url);
  if (expirado(p)) return { erro: 'expirado' };
  const sessao = tokens(p);
  if (p.get('error') || p.get('type') !== 'recovery' || !sessao) return { erro: 'invalido' };
  return { sessao };
}

export function lerConfirmacao(url) {
  const p = fragmento(url);
  if (expirado(p)) return 'expirado';
  if (p.get('error') || p.get('error_code')) return 'erro';
  return p.get('type') === 'signup' && tokens(p) ? 'confirmado' : 'sem_link';
}

const SENHA_LONGA = 'Senha longa demais (máximo 72; letras com acento contam como 2).';

export function validarSenha(senha, confirmacao) {
  if (senha.length < 6) return 'Use pelo menos 6 caracteres.';
  if (new TextEncoder().encode(senha).length > 72) return SENHA_LONGA;
  if (senha !== confirmacao) return 'As senhas não são iguais.';
  return null;
}

export const ehErroDeRede = (erro) => /fetch|network/.test((erro?.message ?? '').toLowerCase());

export function mensagemErro(erro) {
  const m = (erro?.message ?? '').toLowerCase();
  if (m.includes('same password') || m.includes('different from the old')) return 'A nova senha precisa ser diferente da atual.';
  if (/expired|jwt|session/.test(m)) return 'O link expirou ou já foi usado. Peça um novo no app (Esqueci a senha).';
  if (ehErroDeRede(erro)) return 'Sem conexão. Verifique sua internet e tente de novo.';
  if (m.includes('longer than')) return SENHA_LONGA;
  if (m.includes('weak')) return 'Escolha uma senha mais forte.';
  return 'Não foi possível alterar a senha. Tente de novo.';
}
