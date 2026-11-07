import { lerConfirmacao } from './auth-link.js';

const estado = lerConfirmacao(location.href);
history.replaceState(null, '', location.pathname);
for (const s of document.querySelectorAll('[data-estado]')) s.hidden = s.dataset.estado !== estado;
