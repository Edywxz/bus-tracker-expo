import { test } from 'node:test';
import assert from 'node:assert/strict';
import { descreverContato } from '../site/assets/contato.js';

const issuesUrl = 'https://github.com/Edywxz/bus-tracker-expo/issues';

test('descreverContato com e-mail', () => {
  assert.deepEqual(descreverContato({ email: 'a@b.com', issuesUrl }), { texto: 'a@b.com', href: 'mailto:a@b.com', aviso: null });
});

test('descreverContato sem e-mail', () => {
  assert.deepEqual(descreverContato({ email: null, issuesUrl }), {
    texto: 'página de solicitações do projeto no GitHub',
    href: issuesUrl,
    aviso: 'Esta página é pública: não envie dados pessoais.',
  });
});
