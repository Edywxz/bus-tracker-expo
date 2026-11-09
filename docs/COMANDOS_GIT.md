# 📚 Guia de Comandos Git

> Guia rápido de Git para consulta durante o desenvolvimento de projetos.
>
> **Legenda:**
> 🟢 Essencial · 🔵 Útil · 🟣 Avançado · 🟠 Cuidado

---

## 📑 Índice

* [🟢 1. Comandos principais](#-1-comandos-principais)

  * [`git init`](#git-init)
  * [`git clone`](#git-clone)
  * [`git status`](#git-status)
  * [`git add`](#git-add)
  * [`git commit`](#git-commit)
  * [`git log`](#git-log)
  * [`git branch`](#git-branch)
  * [`git switch`](#git-switch)
  * [`git push`](#git-push)
  * [`git pull`](#git-pull)
  * [`git fetch`](#git-fetch)
* [🔵 2. Comandos úteis](#-2-comandos-úteis)

  * [`git diff`](#git-diff)
  * [`git remote`](#git-remote)
  * [`git merge`](#git-merge)
  * [`git restore`](#git-restore)
  * [`git rm`](#git-rm)
  * [`git mv`](#git-mv)
  * [`git branch -d`](#git-branch--d)
  * [`git tag`](#git-tag)
* [🟣 3. Comandos opcionais / avançados](#-3-comandos-opcionais--avançados)

  * [`git stash`](#git-stash)
  * [`git rebase`](#git-rebase)
  * [`git cherry-pick`](#git-cherry-pick)
  * [`git reset`](#git-reset)
  * [`git revert`](#git-revert)
  * [`git reflog`](#git-reflog)
  * [`git show`](#git-show)
  * [`git blame`](#git-blame)
  * [`git clean`](#git-clean)
* [⚙️ 4. Configuração](#️-4-configuração)
* [🔄 5. Fluxo básico](#-5-fluxo-básico)
* [🧠 6. Resumo rápido](#-6-resumo-rápido)

---

# 🟢 1. Comandos principais

> **Prioridade máxima:** são os comandos que você provavelmente vai usar no dia a dia.

---

## `git init`

📌 **Função:** Inicializa um novo repositório Git na pasta atual.

```bash
git init
```

💡 **Use quando:** estiver começando um projeto do zero e quiser colocar o projeto sob controle do Git.

---

## `git clone`

📌 **Função:** Baixa uma cópia de um repositório existente.

```bash
git clone URL_DO_REPOSITORIO
```

**Exemplo:**

```bash
git clone https://github.com/usuario/projeto.git
```

💡 **Use quando:** alguém já criou o repositório e você precisa baixá-lo para trabalhar.

---

## `git status`

📌 **Função:** Mostra o estado atual do repositório.

```bash
git status
```

Mostra, por exemplo:

* arquivos modificados;
* arquivos novos;
* arquivos preparados para commit;
* branch atual;
* alterações que ainda não foram registradas.

> ⭐ **Dica:** Se você não sabe o que está acontecendo no Git, tente `git status`.

---

## `git add`

📌 **Função:** Adiciona alterações à área de preparação (*staging*).

Adicionar um arquivo:

```bash
git add arquivo.txt
```

Adicionar todos os arquivos:

```bash
git add .
```

> ⚠️ `git add` **não cria um commit**. Ele apenas prepara as alterações.

---

## `git commit`

📌 **Função:** Registra as alterações preparadas no histórico.

```bash
git commit -m "Mensagem do commit"
```

**Exemplo:**

```bash
git commit -m "Adiciona sistema de login"
```

### 💡 Boas mensagens

```text
Adiciona sistema de login
Corrige colisão do jogador
Atualiza tela de cadastro
Remove botão duplicado
```

Evite:

```text
mudanças
teste
coisas
aaaa
commit final 2 definitivo agora vai
```

---

## `git log`

📌 **Função:** Exibe o histórico de commits.

```bash
git log
```

Versão resumida:

```bash
git log --oneline
```

💡 A versão `--oneline` é ótima para consultar rapidamente o histórico.

---

## `git branch`

📌 **Função:** Gerencia branches.

Listar branches:

```bash
git branch
```

Criar uma branch:

```bash
git branch nome-da-branch
```

**Exemplo:**

```bash
git branch feature/login
```

---

## `git switch`

📌 **Função:** Troca de branch.

```bash
git switch nome-da-branch
```

Criar **e** entrar em uma nova branch:

```bash
git switch -c nome-da-branch
```

**Exemplo:**

```bash
git switch -c feature/login
```

> 💡 Para quem está começando, prefira `git switch` em vez das formas antigas de usar `git checkout` para trocar de branch.

---

## `git push`

📌 **Função:** Envia commits locais para o repositório remoto.

```bash
git push
```

Na primeira vez que enviar uma branch:

```bash
git push -u origin nome-da-branch
```

**Exemplo:**

```bash
git push -u origin feature/login
```

---

## `git pull`

📌 **Função:** Baixa alterações do repositório remoto e tenta integrá-las à branch atual.

```bash
git pull
```

> ⭐ **Boa prática:** Antes de começar a trabalhar em um projeto compartilhado, verifique se existem alterações novas.

```bash
git pull
```

---

## `git fetch`

📌 **Função:** Atualiza as informações sobre o repositório remoto **sem alterar seus arquivos locais**.

```bash
git fetch
```

💡 **Diferença rápida:**

| Comando     | O que faz                                |
| ----------- | ---------------------------------------- |
| `git fetch` | Baixa informações sobre alterações       |
| `git pull`  | Baixa **e tenta integrar** as alterações |

---

# 🔵 2. Comandos úteis

> São comandos que você não precisa decorar imediatamente, mas que ficam muito úteis conforme o projeto cresce.

---

## `git diff`

📌 **Função:** Mostra exatamente o que foi alterado.

```bash
git diff
```

Alterações que já foram adicionadas ao staging:

```bash
git diff --staged
```

💡 Excelente para revisar seu código antes de fazer um commit.

---

## `git remote`

📌 **Função:** Gerencia os repositórios remotos.

Ver os remotos:

```bash
git remote -v
```

Adicionar um remoto:

```bash
git remote add origin URL_DO_REPOSITORIO
```

---

## `git merge`

📌 **Função:** Junta uma branch com a branch atual.

Exemplo:

```bash
git switch main
git merge feature/login
```

Isso incorpora as alterações de `feature/login` na `main`.

> ⚠️ Pode gerar **conflitos** caso as duas branches tenham alterações incompatíveis.

---

## `git restore`

📌 **Função:** Desfaz alterações locais.

```bash
git restore arquivo.txt
```

Remover um arquivo do staging:

```bash
git restore --staged arquivo.txt
```

> 🟠 **Cuidado:** `git restore arquivo.txt` pode apagar alterações que ainda não foram commitadas.

---

## `git rm`

📌 **Função:** Remove um arquivo do projeto e registra a remoção.

```bash
git rm arquivo.txt
```

---

## `git mv`

📌 **Função:** Move ou renomeia um arquivo.

```bash
git mv arquivo-antigo.txt arquivo-novo.txt
```

---

## `git branch -d`

📌 **Função:** Exclui uma branch que já foi integrada.

```bash
git branch -d nome-da-branch
```

---

## `git tag`

📌 **Função:** Marca um commit específico, normalmente para identificar versões.

```bash
git tag v1.0.0
```

Enviar a tag para o remoto:

```bash
git push origin v1.0.0
```

Exemplos:

```text
v1.0.0
v1.1.0
v2.0.0
```

---

# 🟣 3. Comandos opcionais / avançados

> ⚠️ **Atenção:** você não precisa dominar esses comandos para trabalhar normalmente com Git. Alguns podem alterar ou apagar partes do histórico.

---

## `git stash`

📌 **Função:** Guarda temporariamente alterações que ainda não foram commitadas.

```bash
git stash
```

Recuperar as alterações:

```bash
git stash pop
```

Listar alterações guardadas:

```bash
git stash list
```

💡 **Exemplo de situação:**

Você está trabalhando em uma funcionalidade, mas precisa trocar de branch rapidamente e ainda não quer criar um commit.

```bash
git stash
git switch outra-branch
```

Depois:

```bash
git switch minha-branch
git stash pop
```

---

## `git rebase`

📌 **Função:** Reorganiza o histórico de commits de uma branch.

```bash
git rebase main
```

> 🟠 **Cuidado:** `rebase` pode reescrever o histórico. Evite utilizá-lo em commits compartilhados com outras pessoas sem entender as consequências.

---

## `git cherry-pick`

📌 **Função:** Aplica um commit específico de outra branch na branch atual.

```bash
git cherry-pick HASH_DO_COMMIT
```

**Exemplo:**

```bash
git cherry-pick a1b2c3d
```

💡 Útil quando você precisa trazer **uma alteração específica**, sem fazer merge de toda a branch.

---

## `git reset`

📌 **Função:** Move a referência da branch para outro commit.

### `--soft`

```bash
git reset --soft HEAD~1
```

Remove o último commit, mas mantém as alterações no staging.

### `--mixed`

```bash
git reset --mixed HEAD~1
```

Remove o commit e tira as alterações do staging, mas mantém os arquivos modificados.

### `--hard`

```bash
git reset --hard HEAD~1
```

Remove o commit **e as alterações correspondentes**.

> 🛑 **MUITO CUIDADO:** `git reset --hard` pode apagar trabalho que ainda não foi salvo em outro lugar.

---

## `git revert`

📌 **Função:** Desfaz um commit criando **um novo commit** que reverte suas alterações.

```bash
git revert HASH_DO_COMMIT
```

💡 Geralmente é mais seguro que `reset` para branches que já foram compartilhadas com outras pessoas.

---

## `git reflog`

📌 **Função:** Mostra movimentações anteriores do `HEAD` e referências do repositório.

```bash
git reflog
```

💡 Pode ajudar a recuperar commits que parecem ter desaparecido depois de um `reset`, `rebase` ou operação semelhante.

---

## `git show`

📌 **Função:** Mostra detalhes de um commit.

```bash
git show HASH_DO_COMMIT
```

Exemplo:

```bash
git show a1b2c3d
```

---

## `git blame`

📌 **Função:** Mostra qual commit e autor estão associados a cada linha de um arquivo.

```bash
git blame arquivo.txt
```

💡 Útil para descobrir quando e em qual commit determinada parte do código foi alterada.

---

## `git clean`

📌 **Função:** Remove arquivos que não estão sendo rastreados pelo Git.

### Primeiro, veja o que seria removido:

```bash
git clean -n
```

### Depois, se tiver certeza:

```bash
git clean -f
```

> 🛑 **Cuidado:** arquivos removidos pelo `git clean` podem não ser recuperáveis pelo Git.

---

# ⚙️ 4. Configuração

## `git config`

📌 **Função:** Configura informações e comportamentos do Git.

### Definir nome

```bash
git config --global user.name "Seu Nome"
```

### Definir e-mail

```bash
git config --global user.email "seu@email.com"
```

### Ver configurações

```bash
git config --list
```

---

# 🔄 5. Fluxo básico

## 🟢 Trabalhando sozinho

O fluxo mais simples costuma ser:

```bash
git status
git add .
git commit -m "Descrição da alteração"
git push
```

---

## 🔵 Começando a trabalhar em um projeto compartilhado

```bash
git pull
```

Faça suas alterações e depois:

```bash
git status
git add .
git commit -m "Descrição da alteração"
git push
```

---

## 🟣 Trabalhando com branches

```bash
git pull
git switch -c feature/nova-funcionalidade
```

Faça as alterações e depois:

```bash
git status
git add .
git commit -m "Adiciona nova funcionalidade"
git push -u origin feature/nova-funcionalidade
```

---

# 🧠 6. Resumo rápido

| Comando              | Função                            |
| -------------------- | --------------------------------- |
| 🟢 `git init`        | Inicializa um repositório         |
| 🟢 `git clone`       | Baixa um repositório              |
| 🟢 `git status`      | Verifica o estado do projeto      |
| 🟢 `git add`         | Prepara alterações                |
| 🟢 `git commit`      | Registra alterações               |
| 🟢 `git push`        | Envia alterações                  |
| 🟢 `git pull`        | Baixa e integra alterações        |
| 🟢 `git fetch`       | Baixa informações do remoto       |
| 🟢 `git log`         | Consulta o histórico              |
| 🟢 `git branch`      | Gerencia branches                 |
| 🟢 `git switch`      | Troca/cria branches               |
| 🔵 `git diff`        | Visualiza alterações              |
| 🔵 `git remote`      | Gerencia repositórios remotos     |
| 🔵 `git merge`       | Junta branches                    |
| 🔵 `git restore`     | Desfaz alterações                 |
| 🔵 `git rm`          | Remove arquivos                   |
| 🔵 `git mv`          | Move/renomeia arquivos            |
| 🔵 `git tag`         | Marca versões                     |
| 🟣 `git stash`       | Guarda alterações temporariamente |
| 🟣 `git rebase`      | Reorganiza histórico              |
| 🟣 `git cherry-pick` | Aplica um commit específico       |
| 🟣 `git reset`       | Reposiciona a branch              |
| 🟣 `git revert`      | Desfaz um commit através de outro |
| 🟣 `git reflog`      | Consulta referências anteriores   |
| 🟣 `git show`        | Mostra detalhes de um commit      |
| 🟣 `git blame`       | Mostra origem das linhas          |
| 🟣 `git clean`       | Remove arquivos não rastreados    |
| ⚙️ `git config`      | Configura o Git                   |

---

## 🚨 Comandos que exigem atenção

Se você está começando, **não execute estes no automático**:

```bash
git reset --hard
git clean -f
git rebase
```

Antes de usar, certifique-se de entender **o que será alterado ou apagado**.

> 💾 **Regra de ouro:** se você não sabe o que um comando vai fazer, pare e confira antes de executá-lo.
