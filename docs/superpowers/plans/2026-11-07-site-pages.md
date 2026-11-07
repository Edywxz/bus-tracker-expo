# Site do VanEscolar GPS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar um site estático no GitHub Pages (apresentação, retorno do e-mail de confirmação, nova senha, privacidade) e apontar o app para ele.

**Architecture:** Pasta `site/` com HTML/CSS/JS puro, sem build. A lógica testável (ler o fragmento da URL, validar senha, traduzir erros) fica em módulos ESM puros importados direto pelo `node:test`; as páginas só ligam essa lógica ao DOM. O app ganha `urlDoSite()` e passa `emailRedirectTo`/`redirectTo` apontando para o site.

**Tech Stack:** HTML/CSS/JS (ESM), `@supabase/supabase-js` 2.119.0 via jsDelivr com SRI, `node:test` (Node 24), GitHub Actions + GitHub Pages, TypeScript (app).

**Spec:** `docs/superpowers/specs/2026-11-07-site-pages-design.md`

## Global Constraints

- Endereço base: `https://edywxz.github.io/bus-tracker-expo/` (subcaminho: **nenhum link, `src` ou `href` interno começa com `/`**).
- Supabase: URL `https://ghcqvnxjivauvkpnpqlf.supabase.co`; chave pública = valor de `EXPO_PUBLIC_SUPABASE_ANON_KEY` do `.env` (publishable, a mesma do app). Nunca a `service_role`.
- `supabase-js` fixo em `2.119.0`: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.js`, com `integrity="sha384-…"` (calcular: `curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A`) e `crossorigin="anonymous"`.
- CSP da página de nova senha (via `<meta http-equiv>`): `default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; connect-src https://ghcqvnxjivauvkpnpqlf.supabase.co; style-src 'self'; img-src 'self' data:; frame-src 'none'; base-uri 'none'; form-action 'none'`. Mais `<meta name="referrer" content="no-referrer">`. Sem scripts inline em nenhuma página.
- Senha: mínimo 6 caracteres (regra do app). Cliente do navegador: `persistSession:false, autoRefreshToken:false, detectSessionInUrl:false`. Nenhum token em `localStorage`/cookie.
- Texto vindo da URL nunca vira HTML (só `textContent`).
- Botão "Abrir o app" usa o esquema `vanescolar://`.
- Textos em português do Brasil. Visual com as cores de `src/theme/colors.ts` (light): tinta `#111113`, sinal `#F5B400`, `onSignal #1A1300`, fundo `#F2F2F7`, branco `#FFFFFF`, texto secundário `#5E5E66`, erro `#D70015`, sucesso `#1E7B34`, link `#0066CC`.
- A política de privacidade só afirma o que o app e o banco realmente fazem; é rascunho sujeito à revisão do dono (aviso visível na página).
- Branch de trabalho: `docs/site-design` (já contém spec e este plano). Ao fim, PR para `main` (o `automerge` do CI faz o resto).

## Review Focus

1. Link de outro tipo (`type=signup`) aberto na página de nova senha: tem de ser recusado, nunca abrir o formulário.
2. Senha acima do limite do Supabase (72): mensagem clara, não erro genérico.
3. Nova senha igual à atual: mensagem específica.
4. `error_description` e outros textos da URL jamais viram HTML (sem `innerHTML`/`insertAdjacentHTML`/`document.write`/`eval` em nenhum JS do site).
5. Página aberta sem fragmento (acesso direto ou link já gasto): estado neutro, nunca "E-mail confirmado".

---

### Task 1: Lógica pura da autenticação do site

**Files:**
- Create: `site/package.json` (`{"type":"module"}` para o Node tratar os `.js` como ESM)
- Create: `site/assets/auth-link.js`
- Test: `tests/site-auth-link.test.ts`

**Interfaces:**
- Produces (usadas pela Task 3):
  - `lerRecuperacao(url: string): { sessao: { accessToken: string; refreshToken: string } } | { erro: 'expirado' | 'invalido' }`
  - `lerConfirmacao(url: string): 'confirmado' | 'expirado' | 'erro' | 'sem_link'`
  - `validarSenha(senha: string, confirmacao: string): string | null` (mensagem ou `null`)
  - `mensagemErro(erro: { message?: string } | null | undefined): string`

- [ ] **Step 1: Escrever o teste que falha** (`tests/site-auth-link.test.ts`, imports `../site/assets/auth-link.js`). Casos e asserções:
  - `lerRecuperacao('…/#access_token=A&refresh_token=R&type=recovery')` → `deepEqual {sessao:{accessToken:'A',refreshToken:'R'}}`.
  - mesmo link com `type=signup` → `{erro:'invalido'}` (Review Focus 1); sem fragmento → `{erro:'invalido'}`; sem `refresh_token` → `{erro:'invalido'}`; `#error=access_denied&error_code=otp_expired` → `{erro:'expirado'}`; `#error=server_error` → `{erro:'invalido'}`.
  - `lerConfirmacao`: tokens com `type=signup` → `'confirmado'`; `error_code=otp_expired` → `'expirado'`; outro `error` → `'erro'`; URL sem fragmento → `'sem_link'` (Review Focus 5); fragmento só com `type=signup` e sem tokens → `'sem_link'`.
  - `validarSenha('12345','12345')` → `'Use pelo menos 6 caracteres.'`; `'a'.repeat(73)` iguais → `'Use no máximo 72 caracteres.'` (Review Focus 2); `'123456','1234567'` → `'As senhas não são iguais.'`; `'123456','123456'` → `null`; `'a'.repeat(72)` iguais → `null`.
  - `mensagemErro({message:'New password should be different from the old password.'})` → `'A nova senha precisa ser diferente da atual.'` (Review Focus 3); `{message:'Auth session missing!'}` e `{message:'JWT expired'}` → `'O link expirou ou já foi usado. Peça um novo no app (Esqueci a senha).'`; `{message:'Failed to fetch'}` → `'Sem conexão. Verifique sua internet e tente de novo.'`; `{message:'Password is known to be weak'}` → `'Escolha uma senha mais forte.'`; `null` e `{message:'qualquer coisa'}` → `'Não foi possível alterar a senha. Tente de novo.'`.
- [ ] **Step 2: Rodar e ver falhar:** `node --test tests/site-auth-link.test.ts` → falha por módulo inexistente.
- [ ] **Step 3: Implementar** os quatro exports em `site/assets/auth-link.js` (ESM). Ler o fragmento com `URLSearchParams` sobre o que vem depois de `#`; `error_code` tem prioridade sobre `error`; a ordem das regras de `mensagemErro` é: "same password"/"different from the old" → expirado (`expired`, `jwt`, `session`) → rede (`fetch`, `network`) → fraca (`weak`) → genérica.
- [ ] **Step 4: Rodar e ver passar:** `npm test` → todos passam (os 13 anteriores + os novos).
- [ ] **Step 5: Commit:** `git add site tests && git commit -m "feat(site): lógica pura de links e senha"` (com a linha `Co-Authored-By` padrão do repositório).

---

### Task 2: Base do site, apresentação, privacidade e teste de estrutura

**Files:**
- Create: `site/assets/styles.css`, `site/assets/config.js`, `site/assets/contato.js`
- Create: `site/index.html`, `site/privacidade/index.html`
- Create: `site/.well-known/.gitkeep`
- Test: `tests/site.test.ts`, `tests/site-contato.test.ts`

**Interfaces:**
- Produces:
  - `CONFIG` exportado de `config.js`: `{ supabaseUrl: string; supabaseKey: string; esquemaApp: 'vanescolar://'; contato: { email: string | null; issuesUrl: 'https://github.com/Edywxz/bus-tracker-expo/issues' } }`
  - `descreverContato(contato: CONFIG['contato']): { texto: string; href: string; aviso: string | null }` em `contato.js`. Com e-mail: `href = 'mailto:<email>'`, `texto = email`, `aviso = null`. Sem e-mail: `href = issuesUrl`, `texto = 'página de solicitações do projeto no GitHub'`, `aviso = 'Esta página é pública: não envie dados pessoais.'`. O módulo também preenche, ao carregar, todo `<a data-contato>` (texto e href) e todo `[data-contato-aviso]` (texto, ou `hidden` se `aviso` for `null`), sempre com `textContent`.
  - Estilo e cabeçalho/rodapé comuns usados por todas as páginas (Task 3 os reutiliza).
- Consumes: `CONFIG` ← nada de tarefa anterior.

- [ ] **Step 1: Escrever os testes que falham.**
  - `tests/site-contato.test.ts`: os dois casos acima de `descreverContato` (com e sem e-mail).
  - `tests/site.test.ts`: percorre recursivamente `site/**/*.html`; para cada `href`/`src`: ignora os que começam com `#` ou têm esquema (`https:`, `http:`, `mailto:`, `vanescolar:`); falha se começar com `/` (subcaminho do Pages); resolve relativo à pasta da página, remove `?`/`#`, se for diretório exige `index.html`; exige que o arquivo exista. Outros testes: nenhum arquivo em `site/` contém `localhost`; nenhum `.js` em `site/assets/` contém `innerHTML`, `insertAdjacentHTML`, `document.write` nem `eval(` (Review Focus 4); nenhuma página tem `<script>` sem `src` (sem JS inline).
- [ ] **Step 2: Rodar:** `npm test` → `site-contato` falha (módulo inexistente); o de estrutura passa vazio (ainda sem páginas).
- [ ] **Step 3: Implementar `descreverContato` e o preenchimento do DOM em `site/assets/contato.js`** e `config.js` com os valores das Global Constraints (copiar a chave pública do `.env`; `contato.email = null`).
- [ ] **Step 4: Criar `styles.css`** (cores das Global Constraints, fonte do sistema, layout de coluna única até 40rem, foco visível, `prefers-color-scheme` não necessário) **e as duas páginas.** Cada página: `lang="pt-BR"`, viewport, `<title>` de 2–4 palavras, cabeçalho "VanEscolar GPS", rodapé "Projeto acadêmico" com link relativo para a política.
  - `index.html`: hero com uma frase; funções reais do app: acompanhar a van em tempo real no mapa, aviso de chegada, registro de embarque e desembarque, mensalidade com Pix copia e cola, chat entre responsável e motorista, calendário letivo; blocos "Para responsáveis" e "Para motoristas"; aviso "Em breve nas lojas".
  - `privacidade/index.html`: aviso no topo "Rascunho sujeito à revisão do responsável pelo projeto"; seções fixas "Quais dados tratamos", "Para que usamos", "Com quem compartilhamos", "Por quanto tempo guardamos", "Seus direitos (LGPD)", "Como excluir sua conta", "Contato". Conteúdo conforme o spec (dados, terceiros Supabase/Geoapify/Expo push, art. 18). Retenção: "enquanto a conta existir; ao excluí-la apagamos o perfil e os dados ligados a ele". Contato via `<a data-contato>` e `<p data-contato-aviso>`, com `<script type="module" src="../assets/contato.js">`.
- [ ] **Step 5: Rodar `npm test`** → tudo passa, e o teste de estrutura agora varre as duas páginas. Abrir `npx serve site` e conferir as duas páginas no navegador (celular e desktop).
- [ ] **Step 6: Commit:** `git add site tests && git commit -m "feat(site): apresentação, privacidade e teste de estrutura"`.

---

### Task 3: Páginas de confirmação e de nova senha

**Files:**
- Create: `site/confirmado/index.html`, `site/redefinir-senha/index.html`
- Create: `site/assets/confirmado.js`, `site/assets/redefinir.js`
- Modify: `tests/site.test.ts` (novas asserções)

**Interfaces:**
- Consumes: `lerConfirmacao`, `lerRecuperacao`, `validarSenha`, `mensagemErro` (Task 1); `CONFIG` (Task 2); estilo comum (Task 2).
- Produces: nada para outras tarefas.

Cada página usa seções `<section data-estado="…" hidden>`; o JS mostra uma só.
- `confirmado`: estados `confirmado` (texto "E-mail confirmado", botão `<a href="vanescolar://">Abrir o app</a>` e a frase "Se o app não abrir, abra-o manualmente e entre com seu e-mail e senha."), `expirado` ("Este link expirou ou já foi usado. No app, toque em Reenviar e-mail na tela de confirmação."), `erro`, `sem_link` (texto neutro: "Esta página é aberta pelo link do e-mail de confirmação.").
- `redefinir-senha`: estados `carregando`, `erro` (usa `mensagemErro` ou o texto do `erro` de `lerRecuperacao`: expirado/invalido → mensagem de link expirado), `formulario` (nova senha, confirmação, botão), `sucesso` ("Senha alterada. Abra o app e entre com a nova senha." + botão `vanescolar://`).

- [ ] **Step 1: Estender `tests/site.test.ts` (falha primeiro):**
  - existem exatamente as quatro páginas: `index.html`, `confirmado/index.html`, `redefinir-senha/index.html`, `privacidade/index.html`;
  - `redefinir-senha/index.html` contém a CSP completa das Global Constraints, `<meta name="referrer" content="no-referrer">`, o `<script>` do `supabase-js` com a URL fixa `@2.119.0`, `integrity="sha384-` e `crossorigin="anonymous"`;
  - `confirmado/index.html` e `redefinir-senha/index.html` têm um `<a href="vanescolar://">`.
- [ ] **Step 2: Rodar `npm test`** → as novas asserções falham (páginas inexistentes).
- [ ] **Step 3: Implementar `confirmado.js`:** ao carregar, chama `lerConfirmacao(location.href)`, **apaga o fragmento antes de qualquer outra coisa** (`history.replaceState(null, '', location.pathname)`), mostra o estado correspondente.
- [ ] **Step 4: Implementar `redefinir.js`** (módulo; usa o global `supabase` do script UMD): `lerRecuperacao` → apaga o fragmento → se erro, estado `erro`; senão `createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, { auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } })` e `setSession`; falha → `mensagemErro`. No `submit`: `preventDefault`, `validarSenha` (mensagem no `<p role="alert">` do formulário), desabilita o botão durante o envio (evita duplo clique), `updateUser({ password })`; erro → `mensagemErro`; sucesso → `signOut({ scope: 'local' })` e estado `sucesso`. Todo texto dinâmico com `textContent`.
- [ ] **Step 5: Criar as duas páginas HTML** seguindo as Global Constraints (CSP e referrer só na de nova senha; ambas com o estilo e o rodapé comuns; foco automático no primeiro campo; `autocomplete="new-password"` e `type="password"` nos campos; rótulos visíveis).
- [ ] **Step 6: Calcular o SRI** do `supabase.js` 2.119.0 (comando das Global Constraints) e preencher `integrity`.
- [ ] **Step 7: Rodar `npm test`** → passa. Teste manual local (`npx serve site`): abrir `http://localhost:3000/redefinir-senha/#access_token=x&refresh_token=y&type=recovery` (deve mostrar erro de link inválido após o `setSession` falhar, e a barra de endereço deve ficar sem o `#...`); abrir `/confirmado/#access_token=x&refresh_token=y&type=signup` (mostra "E-mail confirmado"); abrir as duas sem fragmento (estado neutro/erro, nunca sucesso).
- [ ] **Step 8: Commit:** `git add site tests && git commit -m "feat(site): páginas de confirmação e de nova senha"`.

---

### Task 4: Deploy no GitHub Pages

**Files:**
- Create: `.github/workflows/site.yml`

**Interfaces:** Produz o deploy de `site/`; nenhuma API.

- [ ] **Step 1: Criar `site.yml`:** gatilhos `push` em `main` com `paths: ['site/**', '.github/workflows/site.yml']` e `workflow_dispatch`; `permissions: { contents: read, pages: write, id-token: write }`; `concurrency: { group: pages, cancel-in-progress: false }`; um job `deploy` com `environment: { name: github-pages, url: ${{ steps.deploy.outputs.page_url }} }`, passos `actions/checkout@v4`, `actions/upload-pages-artifact@v3` com `path: site`, e `actions/deploy-pages@v4` com `id: deploy`.
- [ ] **Step 2: Validar a sintaxe:** `npx -y js-yaml .github/workflows/site.yml > /dev/null && echo OK` → imprime `OK`.
- [ ] **Step 3: Commit:** `git add .github && git commit -m "ci: publica o site no GitHub Pages"`.

---

### Task 5: App aponta para o site

**Files:**
- Create: `src/utils/siteUrl.ts`
- Modify: `src/services/authService.ts` (linhas ~51 e ~63: `emailRedirectTo`; linha ~87: `resetPasswordForEmail`; comentário de `tratarLink` sobre `recovery`)
- Modify: `.env.example`, `supabase/README.md` (seção "Link do e-mail de confirmação")
- Test: `tests/utils.test.ts` (acrescentar)

**Interfaces:**
- Produces: `SITE_URL_PADRAO = 'https://edywxz.github.io/bus-tracker-expo/'` e `urlDoSite(caminho: string, base?: string): string`.
- Regra: usa `base` (ou o padrão, se `undefined` ou vazio), garante exatamente uma `/` no fim da base e junta `caminho` sem `/` inicial.

- [ ] **Step 1: Teste que falha** (em `tests/utils.test.ts`, import de `../src/utils/siteUrl.ts`): `urlDoSite('confirmado/')` → `'https://edywxz.github.io/bus-tracker-expo/confirmado/'`; base `'https://x.dev/app'` → `'https://x.dev/app/confirmado/'`; base com `/` no fim → mesma saída; caminho `'/redefinir-senha/'` → sem barra dupla; base `''` → usa o padrão.
- [ ] **Step 2: Rodar `npm test`** → falha (módulo inexistente).
- [ ] **Step 3: Implementar `urlDoSite`** em `src/utils/siteUrl.ts`.
- [ ] **Step 4: Em `authService.ts`:** `cadastrar` e `reenviarConfirmacao` passam `emailRedirectTo: urlDoSite('confirmado/', process.env.EXPO_PUBLIC_SITE_URL)`; `recuperarSenha` passa `{ redirectTo: urlDoSite('redefinir-senha/', process.env.EXPO_PUBLIC_SITE_URL) }`. Referenciar `process.env.EXPO_PUBLIC_SITE_URL` literalmente (o Expo só embute variáveis lidas assim). Remover o import de `Linking` se ficar sem uso. Atualizar o comentário do ramo `recovery` de `tratarLink`: agora tratado pela página web.
- [ ] **Step 5: Documentar:** `.env.example` ganha `EXPO_PUBLIC_SITE_URL=https://edywxz.github.io/bus-tracker-expo/`; no README, a seção passa a mandar configurar Site URL = endereço do site e Redirect URLs = `https://edywxz.github.io/bus-tracker-expo/**`, `vanescolar://**` e `exp://**` (só desenvolvimento).
- [ ] **Step 6: Verificar:** `npm run typecheck && npm test` → sem erros, todos passam.
- [ ] **Step 7: Commit:** `git add src tests .env.example supabase/README.md && git commit -m "feat(auth): links do e-mail apontam para o site"`.

---

### Task 6: Publicação e verificação ponta a ponta

**Files:** nenhum arquivo de produto (atualiza a memória do projeto).

- [ ] **Step 1: Ativar o Pages** (antes do merge, com a confirmação do dono do repositório): `gh api -X POST repos/Edywxz/bus-tracker-expo/pages -f build_type=workflow`; conferir `gh api repos/Edywxz/bus-tracker-expo/pages --jq .build_type` → `workflow`.
- [ ] **Step 2: PR:** `git push -u origin docs/site-design && gh pr create --fill --base main` (o `automerge` mescla quando `app`, `edge-functions` e `database` passam). Conferir com `gh pr checks`.
- [ ] **Step 3: Deploy:** após o merge, `gh run list --workflow site.yml --limit 1` → `completed success` (se não disparou: `gh workflow run site.yml`).
- [ ] **Step 4: Páginas no ar:** `curl -s -o /dev/null -w '%{http_code}\n'` em cada uma das quatro URLs (`…/`, `…/confirmado/`, `…/redefinir-senha/`, `…/privacidade/`) → `200` em todas.
- [ ] **Step 5 (manual, dono do projeto):** Supabase → Authentication → URL Configuration: Site URL e Redirect URLs conforme Task 5/Step 5.
- [ ] **Step 6 (manual, em aparelho real com o app de teste):** (a) cadastro novo, e-mail chega, link abre `/confirmado/` com "E-mail confirmado", login funciona; (b) clicar o mesmo link de novo mostra o aviso de expirado; (c) "Esqueci a senha" → link → definir nova senha → entrar no app com ela; (d) tentar a mesma senha de antes mostra a mensagem específica; (e) conferir no Safari iOS, Chrome Android e desktop.
- [ ] **Step 7: Registrar:** atualizar na memória `pendencias-backend-frontend` o item 6 e parte do 22 para FEITO (ou PARCIAL, se a revisão da política ou o e-mail de contato ainda faltarem) e `paginas-web-ideia` com o estado final.
