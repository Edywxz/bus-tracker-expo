import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerRecuperacao, lerConfirmacao, validarSenha, mensagemErro, ehErroDeRede } from '../site/assets/auth-link.js';

const base = 'https://x.github.io/site/nova-senha.html';

test('lerRecuperacao', () => {
  assert.deepEqual(lerRecuperacao(`${base}#access_token=A&refresh_token=R&type=recovery`), {
    sessao: { accessToken: 'A', refreshToken: 'R' },
  });
  assert.deepEqual(lerRecuperacao(`${base}#access_token=A&refresh_token=R&type=signup`), { erro: 'invalido' });
  assert.deepEqual(lerRecuperacao(base), { erro: 'invalido' });
  assert.deepEqual(lerRecuperacao(`${base}#access_token=A&type=recovery`), { erro: 'invalido' });
  assert.deepEqual(lerRecuperacao(`${base}#error=access_denied&error_code=otp_expired`), { erro: 'expirado' });
  assert.deepEqual(lerRecuperacao(`${base}#error=server_error`), { erro: 'invalido' });
});

test('lerConfirmacao', () => {
  assert.equal(lerConfirmacao(`${base}#access_token=A&refresh_token=R&type=signup`), 'confirmado');
  assert.equal(lerConfirmacao(`${base}#error=access_denied&error_code=otp_expired`), 'expirado');
  assert.equal(lerConfirmacao(`${base}#error=server_error`), 'erro');
  assert.equal(lerConfirmacao(base), 'sem_link');
  assert.equal(lerConfirmacao(`${base}#type=signup`), 'sem_link');
});

const longa = 'Senha longa demais (máximo 72; letras com acento contam como 2).';

test('validarSenha', () => {
  assert.equal(validarSenha('12345', '12345'), 'Use pelo menos 6 caracteres.');
  assert.equal(validarSenha('a'.repeat(73), 'a'.repeat(73)), longa);
  assert.equal(validarSenha('ç'.repeat(37), 'ç'.repeat(37)), longa);
  assert.equal(validarSenha('ç'.repeat(36), 'ç'.repeat(36)), null);
  assert.equal(validarSenha('123456', '1234567'), 'As senhas não são iguais.');
  assert.equal(validarSenha('123456', '123456'), null);
  assert.equal(validarSenha('a'.repeat(72), 'a'.repeat(72)), null);
});

test('mensagemErro', () => {
  const exp = 'O link expirou ou já foi usado. Peça um novo no app (Esqueci a senha).';
  assert.equal(mensagemErro({ message: 'New password should be different from the old password.' }), 'A nova senha precisa ser diferente da atual.');
  assert.equal(mensagemErro({ message: 'Auth session missing!' }), exp);
  assert.equal(mensagemErro({ message: 'JWT expired' }), exp);
  assert.equal(mensagemErro({ message: 'Failed to fetch' }), 'Sem conexão. Verifique sua internet e tente de novo.');
  assert.equal(mensagemErro({ message: 'Password is known to be weak' }), 'Escolha uma senha mais forte.');
  assert.equal(mensagemErro({ message: 'Password cannot be longer than 72 characters' }), longa);
  assert.equal(mensagemErro(null), 'Não foi possível alterar a senha. Tente de novo.');
  assert.equal(mensagemErro({ message: 'qualquer coisa' }), 'Não foi possível alterar a senha. Tente de novo.');
});

test('ehErroDeRede', () => {
  assert.equal(ehErroDeRede({ message: 'Failed to fetch' }), true);
  assert.equal(ehErroDeRede({ message: 'NetworkError when attempting' }), true);
  assert.equal(ehErroDeRede({ message: 'JWT expired' }), false);
  assert.equal(ehErroDeRede(null), false);
});
