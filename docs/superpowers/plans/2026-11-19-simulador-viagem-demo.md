# Simulador de viagem na demo — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os cenários congelados da demo por uma viagem simulada em tempo real (ida/volta, alunos escolhidos, ocorrência por gravidade) com atalhos de pulo.

**Architecture:** `src/services/simulacao.ts` é puro (sem React Native): `montarSimulacao(config)` devolve uma `Linha` (segmentos de movimento + eventos com horário) e `estadoEm(linha, t)` devolve o estado do app naquele instante. O `AppContext` guarda só `t` (ms), avança a cada 500 ms e copia o estado derivado para os `useState` existentes. Pular = mudar `t`; como o estado é função de `t`, pular é igual a esperar.

**Tech Stack:** TypeScript, React Native/Expo, `node:test` (`npm test`), `npm run typecheck`.

**Spec:** `docs/superpowers/specs/2026-11-19-simulador-viagem-demo-design.md`

## Global Constraints

- Tudo atrás de `isDemo`; nada da simulação roda com conta real.
- `simulacao.ts` só importa `./demoRota.ts` e `../utils/proximidade.ts` (precisa rodar no `node --test`, imports com extensão `.ts`).
- Constantes de tempo no topo de `simulacao.ts`: `S_POR_KM = 4.5`, `PERNA_MIN_S = 6`, `PERNA_ESCOLA_MIN_S = 15`, `PARADA_S = 4`, `AVISO_S = 3`; espera antes da saída: `PREPARAR` em t=0, `ESPERANDO` em 3 s, `SAIDA` em 6 s.
- Gravidades: `BAIXA | MEDIA | ALTA | EMERGENCIA` (rótulo "Urgente" na UI). Ocorrência na metade do tempo normal da viagem.
- Textos da UI e notificações em português, como o resto do app. Commits em português, Conventional Commits.
- Relógio simulado (`horaSimulada`): ida 06:30 / 06:45 / 06:50 (preparar / esperando / saída em diante); volta 11:50 / 12:05 / 12:10.
- Mapa alunos → paradas (fixo, ids da demo): `aluno-1` lucas→santaMaria, `aluno-2` beatriz→santaMaria, `aluno-3` gabriel→santaMaria, `aluno-4` sofia→santaMaria, `aluno-5` ana→aurora.

## Review Focus

- Só um aluno escolhido, e só a Ana (única da Aurora): rota garagem→casa→escola sem paradas fantasma.
- Nenhum aluno escolhido: a folha não deixa iniciar; `montarSimulacao` lança erro.
- Pular quando já está no fim, ou depois de Urgente: não faz nada e não quebra.
- Disparar ocorrência duas vezes, ou depois que ela já aconteceu: o botão some / é ignorado.
- Trocar de perfil (responsável ↔ motorista) no meio da simulação: ela continua e o estado é reaplicado no próximo tick; sair da demo ou Parar limpa tudo.

## Estrutura de arquivos

- Criar `src/services/simulacao.ts` — tipos, `montarSimulacao`, `estadoEm`, `alvoDoPulo`, `ALUNOS_SIM`.
- Criar `tests/simulacao.test.ts`.
- Modificar `src/context/AppContext.tsx` — executor; remover `simularCenario`, `simularPassoGps`, `Cenario`, `CENARIOS`.
- Criar `src/sheets/SimulacaoSheet.tsx` (escolhas) e `src/components/FaixaSimulacao.tsx` (faixa com atalhos).
- Modificar `src/screens/ViagemScreen.tsx` — menu "…" e faixa.
- Modificar `README.md` — uma linha na tabela de funcionalidades.

---

### Task 1: Linha do tempo sem ocorrência

**Files:**
- Create: `src/services/simulacao.ts`
- Test: `tests/simulacao.test.ts`

**Interfaces:**
- Produces (exatos, as tarefas 2–4 dependem deles):
  ```ts
  export type Sentido = 'IDA' | 'VOLTA';
  export type Gravidade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA';
  export interface ConfigSim { sentido: Sentido; alunoIds: string[]; ocorrencia: Gravidade | null; ocorrenciaEmMs?: number }
  export type StatusAlunoSim = 'AGUARDANDO' | 'EMBARCADO' | 'DESEMBARCADO' | 'AUSENTE';
  export interface Segmento { t0: number; t1: number; de: number; para: number } // índices em DEMO_ROTA.pontos; parado quando de === para
  export type EventoSim =
    | { t: number; tipo: 'FASE'; fase: 'PREPARAR' | 'ESPERANDO' | 'SAIDA' }
    | { t: number; tipo: 'PARADA'; lugar: string }
    | { t: number; tipo: 'CHEGANDO' | 'EMBARQUE' | 'DESEMBARQUE'; alunoId: string }
    | { t: number; tipo: 'OCORRENCIA'; gravidade: Gravidade }
    | { t: number; tipo: 'FIM' | 'ENCERRADA' };
  export interface Linha { config: ConfigSim; duracaoMs: number; segmentos: Segmento[]; eventos: EventoSim[]; ocorrenciaEm: number | null; pausaManualEm: number | null }
  export interface NotifSim { id: string; tipo: 'CHEGANDO' | 'EMBARQUE' | 'EMERGENCIA'; titulo: string; mensagem: string; alunoId?: string }
  export interface EstadoSim {
    indice: number; fase: 'PREPARAR' | 'ESPERANDO' | 'EM_ROTA' | 'FIM' | 'ENCERRADA'; viagem: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA';
    hora: [number, number]; statusAluno: Record<string, StatusAlunoSim>; notificacoes: NotifSim[]; parada: boolean;
    kmRestantes: number; progresso: number; ocorrencia: Gravidade | null; esperandoRetomar: boolean;
  }
  export const ALUNOS_SIM: Record<string, { casa: string; escola: string }>;
  export function montarSimulacao(c: ConfigSim): Linha;
  export function estadoEm(l: Linha, t: number): EstadoSim;
  export function alvoDoPulo(l: Linha, t: number, alvo: 'SAIDA' | 'PARADA' | 'FIM'): number;
  ```

- [ ] **Step 1: Escrever os testes que falham** em `tests/simulacao.test.ts` (estilo de `tests/demoRota.test.ts`):
  - `ida com todos: paradas na ordem da rota` — `eventos` do tipo `PARADA` têm `lugar` = `['beatriz','sofia','gabriel','lucas','ana','santaMaria','aurora']`.
  - `ida: primeira casa em ~10 s` — instante da 1ª `PARADA` menos 6000 (a saída) fica entre 9000 e 11000 ms.
  - `ida: perna até a escola tem no mínimo 15 s` e `perna curta tem no mínimo 6 s` (lucas→ana: 0,79 km).
  - `subconjunto: só Lucas e Ana` → paradas `['lucas','ana','santaMaria','aurora']`; `só Ana` → `['ana','aurora']`; `só Beatriz` → `['beatriz','santaMaria']`.
  - `volta: ordem inversa, começa na escola` — com todos, paradas `['aurora','santaMaria','ana','lucas','gabriel','sofia','beatriz']`, a 1ª em `t === 6000`, e `de > para` nos segmentos de movimento.
  - `estadoEm: fases e relógio` — em t=0 `fase 'PREPARAR'`, `hora [6,30]`, `viagem 'AGENDADA'`; t=3000 `'ESPERANDO'`, `[6,45]`; t=6000 `viagem 'EM_ANDAMENTO'`, `hora [6,50]`.
  - `estadoEm: embarque e entrega` — logo após o `EMBARQUE` do aluno-2 `statusAluno['aluno-2'] === 'EMBARCADO'`; em `duracaoMs` todos os escolhidos `'DESEMBARCADO'`, `fase 'FIM'`, `viagem 'CONCLUIDA'`, `progresso === 1`; não escolhidos ficam `'AUSENTE'`.
  - `estadoEm: van chegando 3 s antes` — existe notificação `CHEGANDO` do aluno-2 e seu tempo é `PARADA(beatriz).t − 3000`.
  - `estadoEm: o mesmo t dá o mesmo estado` (`deepEqual` de duas chamadas) e `indice` é monotônico crescente na ida / decrescente na volta.
  - `alvoDoPulo`: `'SAIDA'` → 6000; `'PARADA'` em t=7000 → instante da 1ª parada; em t após a última → `duracaoMs`; `'FIM'` → `duracaoMs`.
  - `montarSimulacao lança sem alunos` (`alunoIds: []`).
- [ ] **Step 2: Rodar e ver falhar** — `npm test` → falha por `simulacao.ts` inexistente.
- [ ] **Step 3: Implementar `montarSimulacao`, `estadoEm`, `alvoDoPulo` e `ALUNOS_SIM`** em `src/services/simulacao.ts` conforme as constantes dos Global Constraints. Regras: perna = soma de `distanciaKm` entre pontos consecutivos do trecho × `S_POR_KM`, com os mínimos; a ida começa no índice 0 (garagem) em t=6000 e a volta começa já parada na primeira escola (a de maior índice entre as escolhidas) com `PARADA` em t=6000; cada parada dura `PARADA_S` (segmento parado); `CHEGANDO` em `max(início da perna, chegada − AVISO_S)` só para casas; `EMBARQUE`/`DESEMBARQUE` em chegada + 2 s (ida: embarque na casa, desembarque na escola; volta: embarque na escola, desembarque na casa); `FIM` ao fim da última parada; `indice` interpolado linearmente (arredondado) dentro do segmento; `kmRestantes` = km ainda por percorrer nos segmentos. Notificações: ids `sim-<tipo>-<alunoId>-<t>`, texto de `CHEGANDO` igual ao do servidor (`A van está perto: <primeiro nome> será buscado em instantes.` / na volta `A van está perto de casa com <primeiro nome>.`; o nome vem de um mapa `NOMES` interno só para a demo: Lucas, Beatriz, Gabriel, Sofia, Ana). `ocorrenciaEm` e `pausaManualEm` ficam `null` nesta tarefa.
- [ ] **Step 4: Rodar e ver passar** — `npm test` e `npm run typecheck` → verdes.
- [ ] **Step 5: Commit** — `git add src/services/simulacao.ts tests/simulacao.test.ts && git commit -m "feat(demo): linha do tempo da viagem simulada"`.

### Task 2: Ocorrência por gravidade

**Files:**
- Modify: `src/services/simulacao.ts`
- Test: `tests/simulacao.test.ts`

**Interfaces:**
- Consumes: Task 1 (`montarSimulacao`, `estadoEm`, `Linha`, `ConfigSim.ocorrencia`, `ConfigSim.ocorrenciaEmMs`).
- Produces: com `ocorrencia` definida, `Linha.ocorrenciaEm` = `ocorrenciaEmMs ?? floor(duração normal / 2)`; evento `OCORRENCIA` nesse instante; `Linha.pausaManualEm` = esse instante só para `ALTA`; `EstadoSim.ocorrencia` / `parada` / `esperandoRetomar` refletem a ocorrência.

- [ ] **Step 1: Escrever os testes que falham:**
  - `sem ocorrência: ocorrenciaEm e pausaManualEm são null`.
  - `BAIXA: a viagem dura 7,5 s a mais e o trecho do aviso anda à metade da velocidade` (duração = normal + 7500; entre `ocorrenciaEm` e `+15000` o `indice` avança metade do que avançaria sem ocorrência).
  - `MEDIA: para 10 s e segue` (duração = normal + 10000; `parada === true` em `ocorrenciaEm + 5000`, `false` em `+ 11000`).
  - `ALTA: pausaManualEm === ocorrenciaEm` e `estadoEm(l, ocorrenciaEm).esperandoRetomar === true`; a duração total não muda.
  - `EMERGENCIA: viagem encerra` — `duracaoMs === ocorrenciaEm`, último evento `ENCERRADA`, `estadoEm(l, duracaoMs)` com `fase 'ENCERRADA'`, `viagem 'CONCLUIDA'`, alunos a bordo continuam `'EMBARCADO'`; nenhum evento de embarque/entrega depois de `ocorrenciaEm`.
  - `todas notificam: existe NotifSim tipo 'EMERGENCIA' em ocorrenciaEm` com título `Alerta de rota: <rótulo>` (BAIXA `Trânsito intenso`, MEDIA `Desvio de via`, ALTA `Pane mecânica`, EMERGENCIA `Acidente na pista`).
  - `ocorrenciaEmMs força o instante` e `ocorrência no mesmo t não altera nada antes dela` (os eventos com `t < ocorrenciaEm` são iguais aos da linha sem ocorrência).
- [ ] **Step 2: Rodar e ver falhar** — `npm test`.
- [ ] **Step 3: Implementar** em `montarSimulacao`: montar a linha normal e depois aplicar a ocorrência como deformação do tempo (dividir o segmento em `ocorrenciaEm` e, para BAIXA, em `ocorrenciaEm + 7500`; BAIXA estica a janela de 7500 ms normais para 15000 ms; MEDIA insere 10000 ms parados; ALTA não desloca nada; EMERGENCIA corta eventos e segmentos depois de `ocorrenciaEm` e acrescenta `ENCERRADA`). Atualizar `estadoEm` para ler `OCORRENCIA`/`ENCERRADA`.
- [ ] **Step 4: Rodar e ver passar** — `npm test`, `npm run typecheck`.
- [ ] **Step 5: Commit** — `feat(demo): ocorrência na viagem simulada, por gravidade`.

### Task 3: Executor no `AppContext`

**Files:**
- Modify: `src/context/AppContext.tsx` (remove `Cenario`/`CENARIOS` ~linhas 131-137, `simularCenario` ~471-490, `simularPassoGps` ~492-496 e as entradas em `AppContextType` e no `value`)

**Interfaces:**
- Consumes: Tasks 1–2 (`montarSimulacao`, `estadoEm`, `alvoDoPulo`, `ConfigSim`, `Gravidade`, `EstadoSim`, `Linha`).
- Produces (exatos, a Task 4 usa):
  ```ts
  simulacao: { linha: Linha; t: number; estado: EstadoSim } | null;
  iniciarSimulacao: (c: ConfigSim) => void;
  pararSimulacao: () => void;
  retomarSimulacao: () => void;
  pularSimulacao: (alvo: 'SAIDA' | 'PARADA' | 'FIM') => void;
  dispararOcorrencia: (g: Gravidade) => void;
  ```
  Continua exportado `horaSimulada: Date | null`.

- [ ] **Step 1: Implementar o estado e as ações** (tudo com `if (!isDemo) return`): `iniciarSimulacao` monta a linha e zera `t`/`retomado`; `pararSimulacao` zera a simulação, `setHoraSimulada(null)`, `setGpsIndex(PARADAS_ROTA[1])` e chama `carregarDemo(role)`; `retomarSimulacao` marca `retomado = true`; `pularSimulacao` faz `t = alvoDoPulo(...)` (respeitando `pausaManualEm` se não retomado); `dispararOcorrencia(g)` refaz a linha com `{...config, ocorrencia: g, ocorrenciaEmMs: t}` e mantém `t` (ignora se `ocorrenciaEm !== null && t >= ocorrenciaEm`).
- [ ] **Step 2: Implementar o tick** — `useEffect` com `setInterval` de 500 ms que soma 500 a `t` (limite `duracaoMs`; limite `pausaManualEm` enquanto não retomado); limpa ao desmontar e quando `simulacao` vira `null`.
- [ ] **Step 3: Sincronizar** — `useEffect` em `[simulacao.t, simulacao.linha]` copia o `EstadoSim` para `setGpsIndex(estado.indice)`, `setViagemAtiva` (`status`, `tipo_viagem = config.sentido`, `id` não vazio), `setAlunos` (`statusEmbarque` por `statusAluno`, só dos alunos presentes), `setNotificacoes` (acrescentar as de `estado.notificacoes` cujo `id` ainda não existe; as com `alunoId` só se o aluno estiver em `alunos`) e `setHoraSimulada` (data de hoje, próximo dia de aula, hora de `estado.hora`, como o código atual faz).
- [ ] **Step 4: Estimativa** — em `estimativaRota`, quando `simulacao` existe usar `{ km: estado.kmRestantes, minutos: Math.max(1, Math.round(estado.kmRestantes / 30 * 60)), progresso: estado.progresso }`. Limpar `simulacao` em `sair`/`limpar` e ao entrar na demo (`entrarDemo`).
- [ ] **Step 5: Remover a API antiga** e ajustar `ViagemScreen.tsx` só o suficiente para compilar (a UI nova vem na Task 4).
- [ ] **Step 6: Verificar** — `npm run typecheck` e `npm test` verdes; `git grep -n "simularCenario\|CENARIOS\|simularPassoGps" -- src` sem resultados.
- [ ] **Step 7: Commit** — `feat(demo): executor da simulação no AppContext`.

### Task 4: Folha de escolhas, faixa e menu

**Files:**
- Create: `src/sheets/SimulacaoSheet.tsx`, `src/components/FaixaSimulacao.tsx`
- Modify: `src/screens/ViagemScreen.tsx` (menu `acoes` ~linha 213), `README.md`

**Interfaces:**
- Consumes: Task 3 (`simulacao`, `iniciarSimulacao`, `pararSimulacao`, `retomarSimulacao`, `pularSimulacao`, `dispararOcorrencia`); componentes de `src/components/ui/kit` (`Sheet`, `SegmentedControl`, `Chip`, `Button`, `Notice`, `Card`) como em `src/sheets/Sheets.tsx`.
- Produces: `SimulacaoSheet: React.FC<{ visible: boolean; onClose: () => void }>`; `FaixaSimulacao: React.FC` (não recebe props, lê `useApp()`).

- [ ] **Step 1: `SimulacaoSheet`** — título "Simular viagem"; `SegmentedControl` Ida/Volta; um `Chip` por aluno de `ALUNOS_SIM` (rótulo `<nome> · <escola>`, nomes de `initialMockData`), todos marcados por padrão; resumo `"N alunos · 1 escola"` / `"2 escolas"`; `SegmentedControl` de ocorrência (Nenhuma / Baixa / Média / Alta / Urgente); botão "Iniciar simulação" desabilitado com 0 alunos; ao confirmar chama `iniciarSimulacao` e fecha.
- [ ] **Step 2: `FaixaSimulacao`** — só renderiza se `simulacao`; mostra a fase em português (Hora de preparar / Esperando o motorista / Em rota / Chegou / Viagem encerrada) e `Pausada por ocorrência` quando `esperandoRetomar`; botões: **Pular para a saída** (só nas fases de espera), **Próxima parada**, **Ir para o fim**, **Disparar ocorrência** (usa a gravidade escolhida na folha; se era "Nenhuma", abre a escolha de gravidade em um `Sheet` pequeno; some se `linha.ocorrenciaEm !== null && t >= ocorrenciaEm`), **Retomar** (só com `esperandoRetomar`), **Parar**. Botões de pulo desabilitados em `FIM`/`ENCERRADA`.
- [ ] **Step 3: `ViagemScreen`** — no menu `acoes` trocar os itens de simulação/cenário por um único "Simular viagem" (abre a folha; só `isDemo`) e renderizar `<FaixaSimulacao />` no painel para as duas visões; remover o import de `CENARIOS`/`Cenario`.
- [ ] **Step 4: README** — acrescentar na linha de Rastreamento (tabela de funcionalidades) "simulação de viagem em tempo real na demonstração".
- [ ] **Step 5: Verificar** — `npm run typecheck` e `npm test` verdes. Verificação manual no simulador (anotar o resultado no PR): entrar na demo como responsável → Simular viagem (todos, ida, Média) → ver espera, saída, "van chegando", embarque, parada de 10 s, desembarque; trocar para motorista no meio; Disparar ocorrência Alta e Retomar; Ir para o fim; Parar volta à demo normal; repetir com volta e Urgente.
- [ ] **Step 6: Commit** — `feat(demo): folha de simulação e faixa com atalhos`.

### Task 5: PR e revisão do Gemini

- [ ] **Step 1:** `git push -u origin feat/demo-simulador-viagem` e `gh pr create --base main` com descrição (o que muda, tabela de gravidades, lista da verificação manual, o que não foi testado em aparelho) terminando com a linha de atribuição do Claude Code.
- [ ] **Step 2:** Esperar o CI e a revisão do Gemini (o `automerge` espera até 10 min). Se o Gemini comentar, o workflow "Corrige revisão do Gemini" corrige; acompanhar com `gh pr checks` e `gh run list`.
- [ ] **Step 3:** Reportar ao usuário: resultado do CI, o que o Gemini apontou, o que foi corrigido ou recusado, e se o laço funcionou ou estourou o prazo.
