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

const ler = (rel: string) => readFileSync(join(raiz, rel), 'utf8');

test('existem exatamente as quatro páginas', () => {
  const rel = paginas.map((p) => p.slice(raiz.length + 1)).sort();
  assert.deepEqual(rel, ['confirmado/index.html', 'index.html', 'privacidade/index.html', 'redefinir-senha/index.html']);
});

test('página de nova senha tem CSP, referrer e supabase-js fixo com SRI', () => {
  const html = ler('redefinir-senha/index.html');
  const csp =
    "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; connect-src https://ghcqvnxjivauvkpnpqlf.supabase.co; style-src 'self'; img-src 'self' data:; frame-src 'none'; base-uri 'none'; form-action 'none'";
  assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${csp}">`));
  assert.ok(html.includes('<meta name="referrer" content="no-referrer">'));
  const tag = html.match(/<script[^>]*supabase-js@2\.119\.0\/dist\/umd\/supabase\.js[^>]*>/)?.[0] ?? '';
  assert.ok(tag.includes('src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.js"'));
  assert.ok(tag.includes('integrity="sha384-'));
  assert.ok(tag.includes('crossorigin="anonymous"'));
});

test('páginas de retorno têm o botão para abrir o app', () => {
  for (const p of ['confirmado/index.html', 'redefinir-senha/index.html'])
    assert.ok(ler(p).includes('<a href="vanescolar://"'), p);
});

test('página de nova senha: noscript e campos de senha', () => {
  const html = ler('redefinir-senha/index.html');
  assert.ok(html.includes('<noscript><p class="aviso aviso-erro">Ative o JavaScript para definir a nova senha.</p></noscript>'));
  for (const id of ['senha', 'confirmacao']) {
    const tag = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] ?? '';
    assert.ok(tag.includes('type="password"') && tag.includes('autocomplete="new-password"'), id);
  }
});

test('privacidade: sem promessa falsa de exclusão e com dados novos', () => {
  const html = ler('privacidade/index.html');
  assert.ok(!html.includes('apagamos o perfil'));
  assert.ok(!html.includes('remove o perfil'));
  assert.ok(/<li>[^<]*autorizadas[^<]*CPF[^<]*<\/li>/.test(html));
  assert.ok(html.includes('histórico de posições'));
});
