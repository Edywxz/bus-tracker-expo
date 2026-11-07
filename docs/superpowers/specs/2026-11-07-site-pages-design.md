# Site do VanEscolar GPS (apresentação, retorno de e-mail, nova senha, privacidade)

Data: 2026-11-07 · Estado: desenho aprovado em conversa, aguardando revisão deste documento.

## Objetivo e contexto

O VanEscolar GPS é um projeto acadêmico com cliente real (um motorista). A apresentação começa em **30/11/2026**. As lojas (App Store e Google Play) vêm "em breve", sem data. Não há domínio nem e-mail de contato do projeto.

Hoje o link do e-mail de confirmação de cadastro leva a "localhost null" (o *Site URL* do Supabase é localhost e o app não envia `emailRedirectTo`), e o link de redefinição de senha é ignorado pelo app.

Um site estático resolve isso e ainda entrega uma página de apresentação e a política de privacidade pública que as lojas exigem.

### Critérios de sucesso

1. Cadastrar uma conta, clicar no link do e-mail e cair em uma página do projeto que diz "E-mail confirmado" (sem erro de navegador).
2. "Esqueci a senha" no app, clicar no link do e-mail, definir a nova senha na página e entrar no app com ela.
3. Existe uma URL pública de política de privacidade e uma página de apresentação.
4. Nada disso depende de domínio próprio, e trocar de endereço no futuro não exige reescrever páginas.

## Decisões já tomadas

- Hospedagem: **GitHub Pages**, endereço `https://edywxz.github.io/bus-tracker-expo/` (aceito pelo usuário; poderá evoluir).
- Site **estático simples**, pasta `site/` no mesmo repositório, HTML + CSS + JS puro, sem framework e sem etapa de build.
- Descartado: exportar o app Expo como web. Traria o app inteiro (mapas que não funcionam na web, regra que redireciona visitante sem login para a tela de entrada).
- Um e-mail = uma conta = um perfil (responsável ou motorista).

## Estrutura

```
site/
  index.html                 apresentação
  confirmado/index.html      retorno do e-mail de confirmação
  redefinir-senha/index.html nova senha
  privacidade/index.html     política de privacidade
  assets/
    styles.css               cores/fontes do src/theme
    config.js                supabaseUrl, chave pública, e-mail/canal de contato, esquema do app
    auth-link.js             lógica pura: ler fragmento da URL, validar senha (testada)
    redefinir.js             comportamento da página de nova senha
  .well-known/               reservada (links universais no futuro)
```

Todos os links são relativos. O Pages publica em subcaminho (`/bus-tracker-expo/`), então nenhum link começa com `/`.

## Fluxo 1: confirmação de e-mail

1. App chama `signUp` com `emailRedirectTo = <SITE>/confirmado/`, onde `<SITE>` vem da variável `EXPO_PUBLIC_SITE_URL`.
2. O Supabase confirma o e-mail no servidor dele e redireciona para a página, com `#access_token=...` ou `#error=...` no fragmento.
3. A página **não cria sessão no navegador** e não usa os tokens. Apaga o fragmento da barra de endereço (`history.replaceState`) e mostra:
   - sucesso: "E-mail confirmado", botão "Abrir o app" (`vanescolar://`) e a instrução "ou abra o app e entre com e-mail e senha";
   - erro (`otp_expired` ou outro): "Este link expirou ou já foi usado. No app, toque em *Reenviar e-mail* na tela de confirmação".
4. O tratamento do link dentro do app (`AuthService.tratarLink`) continua existindo para links com esquema `vanescolar://` (desenvolvimento).

## Fluxo 2: redefinir senha (resolve a pendência 6)

1. App chama `resetPasswordForEmail(email, { redirectTo: <SITE>/redefinir-senha/ })`.
2. O link do e-mail leva à página com `#access_token=...&refresh_token=...&type=recovery`. O fragmento nunca é enviado ao servidor do Pages.
3. `redefinir.js` lê o fragmento com `auth-link.js`, apaga-o da URL imediatamente e abre uma sessão temporária (`setSession`) com `persistSession: false` e `detectSessionInUrl: false`.
4. Formulário: nova senha e confirmação. Validação no navegador: mínimo de 6 caracteres (mesma regra do app) e as duas iguais.
5. `updateUser({ password })`, depois `signOut({ scope: 'local' })`. Mostra "Senha alterada. Abra o app e entre".
6. Erros tratados: sem fragmento ou token inválido/expirado, senhas diferentes, senha curta, sem rede, falha do Supabase (mensagem genérica em português).

### Segurança da página de nova senha

- `supabase-js` carregado do jsDelivr em **versão fixa com SRI** (hash de integridade), sem outros scripts de terceiros.
- Política de conteúdo (`<meta http-equiv="Content-Security-Policy">`): `default-src 'self'`; `script-src 'self' https://cdn.jsdelivr.net`; `connect-src` apenas o domínio do projeto Supabase; `frame-src 'none'`; `base-uri 'none'`; `form-action 'none'`.
- `<meta name="referrer" content="no-referrer">`.
- Usa só a chave **pública** (publishable) do Supabase, a mesma já embutida no app. Nunca a `service_role`.
- Nenhum token em `localStorage`/cookie. O GitHub Pages não permite cabeçalhos HTTP próprios, por isso a política vai em `<meta>` (limitação conhecida; `frame-ancestors` não funciona em `<meta>`).

## Página de apresentação

Hero (nome, uma frase), três ou quatro funções reais (acompanhar a van em tempo real, aviso de chegada, embarque/desembarque, mensalidade e Pix, chat), duas colunas "Para responsáveis" e "Para motoristas", aviso "Em breve nas lojas" e rodapé "Projeto acadêmico". Sem capturas de tela por enquanto (não existem imagens prontas).

## Política de privacidade

Rascunho em português baseado no que o app realmente trata:

- Dados: nome, e-mail, telefone, CPF (opcional), dados e endereços de menores, localização do motorista durante a rota, mensagens, registros de embarque.
- Finalidade e base legal, retenção, direitos do titular (LGPD art. 18) e como excluir a conta (Conta > Excluir conta no app).
- Terceiros: **Supabase** (hospedagem e banco), **Geoapify** (recebe só o texto do endereço), **serviço de push da Expo** (recebe o texto do aviso, que pode conter o nome do aluno).
- **Rascunho do assistente, não é parecer jurídico.** O responsável pelo projeto revisa antes de publicar.
- Canal de contato: ler de `config.js`. **Provisório: página de *issues* do repositório, com aviso de que é pública e de que não se deve enviar dados pessoais.** O usuário vai criar um e-mail do projeto; quando existir, troca-se uma linha em `config.js` e a política passa a usá-lo.

## Publicação

- Workflow novo `.github/workflows/site.yml`: dispara em `push` no `main` com mudanças em `site/**` e em `workflow_dispatch`. Usa `actions/upload-pages-artifact` com `path: site` e `actions/deploy-pages`. Permissões: `pages: write`, `id-token: write`, `contents: read`. Ambiente `github-pages`.
- Passo manual do dono do repositório: **Settings > Pages > Source = GitHub Actions**.
- Passos manuais no Supabase (Authentication > URL Configuration):
  - Site URL: `https://edywxz.github.io/bus-tracker-expo/`
  - Redirect URLs: `https://edywxz.github.io/bus-tracker-expo/**`, `vanescolar://**` e `exp://**` (esta só para desenvolvimento).
- Mudanças no app: constante `SITE_URL` (variável `EXPO_PUBLIC_SITE_URL` com valor padrão do endereço acima) usada em `AuthService.cadastrar`, `reenviarConfirmacao` e `recuperarSenha`.

## Testes

Automáticos (rodam no CI atual, `npm test`):

1. `auth-link.js` (módulo puro, importado direto pelo `node:test`): fragmento de sucesso, de erro `otp_expired`, ausente, malformado; validação de senha (curta, diferente, ok).
2. Estrutura do site: cada página existe, todos os links relativos e `src`/`href` locais apontam para arquivos que existem, nenhuma página contém `localhost`, a página de nova senha contém a CSP e o SRI.

Manual (obrigatório antes de dar como pronto), em aparelho real com o app de teste:

- Cadastro completo (e-mail chega, link abre a página certa, aparece "E-mail confirmado", login funciona).
- Link vencido ou clicado duas vezes mostra o aviso.
- Redefinição de senha completa e login com a senha nova.
- Conferir em celular (Safari iOS e Chrome Android) e no desktop.

## Suposições a verificar na implementação

- O cliente do app usa o fluxo padrão (implícito), então os tokens chegam no fragmento (`#`). Se algum dia o app passar a usar PKCE, os links trarão `?code=` e a página de nova senha precisará de `exchangeCodeForSession`.
- Versão fixa do `supabase-js` e o hash SRI serão definidos na implementação (a versão em uso no projeto é a 2.119.x).
- O Gmail e outros clientes de e-mail abrem o link `https://` normalmente (é o motivo de usar página https em vez de esquema próprio).

## Fora do escopo

Domínio próprio, botões das lojas, links universais e App Links (a pasta `.well-known` fica reservada), capturas de tela, análise de acessos, outros idiomas, blog.

## Riscos

- Contato público provisório fraco até existir o e-mail do projeto (mitigado: uma linha em `config.js`).
- Política de privacidade sem revisão jurídica (mitigado: aviso e revisão do dono do projeto).
- `<meta>` CSP não cobre tudo que cabeçalhos HTTP cobririam (aceito para esta fase).
- Quem não tiver o app instalado clica em "Abrir o app" e nada acontece (mitigado: instrução escrita ao lado do botão).
