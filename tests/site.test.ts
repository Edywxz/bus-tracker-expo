import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';

const raiz = resolve(import.meta.dirname, '../site');

function listar(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === 'node_modules' ? [] : listar(join(dir, e.name))) : [join(dir, e.name)],
  );
}

const arquivos = listar(raiz);
const paginas = arquivos.filter((f) => extname(f) === '.html');

test('links e src das páginas existem e são relativos', () => {
  for (const pagina of paginas) {
    const html = readFileSync(pagina, 'utf8');
    for (const [, , valor] of html.matchAll(/\b(href|src)="([^"]*)"/g)) {
      if (valor.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(valor)) continue;
      assert.ok(!valor.startsWith('/'), `${pagina}: link absoluto ${valor}`);
      let alvo = resolve(dirname(pagina), valor.split(/[?#]/)[0]);
      if (existsSync(alvo) && statSync(alvo).isDirectory()) alvo = join(alvo, 'index.html');
      assert.ok(existsSync(alvo), `${pagina}: alvo inexistente ${valor}`);
    }
  }
});

test('nenhum arquivo do site contém localhost', () => {
  for (const f of arquivos) assert.ok(!readFileSync(f, 'utf8').includes('localhost'), f);
});

test('JS do site não usa APIs de HTML dinâmico', () => {
  const proibidos = ['innerHTML', 'insertAdjacentHTML', 'document.write', 'eval('];
  for (const f of arquivos.filter((f) => f.startsWith(join(raiz, 'assets')) && extname(f) === '.js')) {
    const js = readFileSync(f, 'utf8');
    for (const p of proibidos) assert.ok(!js.includes(p), `${f}: ${p}`);
  }
});

test('páginas sem script, style ou style= inline', () => {
  for (const pagina of paginas) {
    const html = readFileSync(pagina, 'utf8');
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), `${pagina}: script inline`);
    assert.ok(!/<style[\s>]/i.test(html), `${pagina}: bloco style`);
    assert.ok(!/\sstyle=/i.test(html), `${pagina}: atributo style`);
  }
});
