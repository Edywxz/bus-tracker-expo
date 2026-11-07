import { CONFIG } from './config.js';

export function descreverContato(contato) {
  if (contato.email) return { texto: contato.email, href: `mailto:${contato.email}`, aviso: null };
  return {
    texto: 'página de solicitações do projeto no GitHub',
    href: contato.issuesUrl,
    aviso: 'Esta página é pública: não envie dados pessoais.',
  };
}

// No Node (testes) não há document.
if (typeof document !== 'undefined') {
  const { texto, href, aviso } = descreverContato(CONFIG.contato);
  for (const a of document.querySelectorAll('a[data-contato]')) {
    a.textContent = texto;
    a.href = href;
  }
  for (const p of document.querySelectorAll('[data-contato-aviso]')) {
    if (aviso === null) p.hidden = true;
    else p.textContent = aviso;
  }
}
