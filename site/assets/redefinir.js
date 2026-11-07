import { CONFIG } from './config.js';
import { lerRecuperacao, validarSenha, mensagemErro, ehErroDeRede } from './auth-link.js';

const mostrar = (estado) => {
  for (const s of document.querySelectorAll('[data-estado]')) s.hidden = s.dataset.estado !== estado;
  document.querySelector(`[data-estado="${estado}"] h1`)?.focus();
};
const retry = document.getElementById('tentar-de-novo');
const falhar = (texto, podeTentar = false) => {
  document.getElementById('mensagem-erro').textContent = texto;
  retry.hidden = !podeTentar;
  mostrar('erro');
};

// apaga os tokens da barra de endereço antes de qualquer trabalho assíncrono
const leitura = lerRecuperacao(location.href);
history.replaceState(null, '', location.pathname);

if (leitura.erro) {
  falhar(mensagemErro({ message: 'expired' }));
} else if (typeof supabase === 'undefined') {
  falhar('Não foi possível carregar a página. Verifique sua internet e peça um novo link no app (Esqueci a senha).');
} else {
  const client = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  // tokens de uso único: ficam só em memória para permitir nova tentativa após falha de rede
  const { accessToken, refreshToken } = leitura.sessao;
  const iniciar = async () => {
    retry.disabled = true;
    try {
      const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) throw error;
      mostrar('formulario');
      document.getElementById('senha').focus();
    } catch (e) {
      falhar(mensagemErro(e), ehErroDeRede(e));
    }
    retry.disabled = false;
  };
  retry.addEventListener('click', iniciar);
  await iniciar();

  const form = document.getElementById('form-senha');
  const botao = document.getElementById('enviar');
  const aviso = document.getElementById('erro-form');
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const senha = document.getElementById('senha').value;
    const problema = validarSenha(senha, document.getElementById('confirmacao').value);
    aviso.textContent = problema ?? '';
    if (problema) return;
    botao.disabled = true;
    try {
      const { error } = await client.auth.updateUser({ password: senha });
      if (error) throw error;
      await client.auth.signOut({ scope: 'local' });
      mostrar('sucesso');
    } catch (e) {
      aviso.textContent = mensagemErro(e);
      botao.disabled = false;
    }
  });
}
