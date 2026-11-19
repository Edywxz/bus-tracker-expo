# Simulador de viagem no modo demonstração

Data: 2026-11-19 · Estado: aguardando aprovação · Escopo: **PR 1 de 2** (o PR 2, perfis "novos", está no fim)

## Objetivo e contexto

Hoje a demo mostra "cenários" congelados (`simularCenario`: Van a caminho, Van chegando, Aluno a bordo…) e um botão que
teleporta a van até a próxima parada. A simulação **substitui** os dois: os atalhos passam a ser pulos dentro da simulação. Nada acontece sozinho e nada segue uma situação real de ponta a ponta. A demo serve
para testar o app e para apresentá-lo (a apresentação do projeto é em 30/11/2026), então ela precisa mostrar o app vivo.

Meta: o usuário monta uma viagem e ela roda em tempo real, com tempos proporcionais à distância, e o app reage como reagiria
de verdade (posição da van, "van chegando", embarques, desembarques, previsão de chegada, ocorrência).

- **Meta:** escolher quais alunos entram, ida ou volta, e se há ocorrência no meio do caminho (com gravidade); ver tudo
  acontecer nas duas visões (responsável e motorista) trocando o perfil na demo.
- **Fora do escopo:** roteamento real, velocidade 1×/2×/4×, salvar simulações, mexer no backend, os perfis "novos" (PR 2).
- **Anti-meta:** a simulação não pode vazar para contas reais (tudo atrás de `isDemo`), e nenhum estado que os botões de
  cenário antigos mostravam pode deixar de ser alcançável (ver "Atalhos" abaixo).

## Restrições encontradas no código

- A demo tem **uma só rota guardada** (`DEMO_ROTA`, 115 pontos): garagem → Beatriz → Sofia → Gabriel → Lucas → Ana → Colégio
  Santa Maria → Escola Aurora. Não há serviço de rotas na demo. Qualquer subconjunto de alunos sai de **fatias** dessa linha,
  na mesma ordem; a volta é a mesma linha **de trás para frente**. A ordem é a melhor para todos os alunos juntos, não
  necessariamente a melhor para um subconjunto (aceito: é demo).
- Alunos: Lucas, Beatriz, Gabriel e Sofia vão ao Santa Maria; **Ana vai à Aurora**. Lucas e Ana são do responsável da demo
  (`resp-1`), com escolas diferentes; os demais são de outros responsáveis. O responsável só enxerga os próprios filhos.
- `gpsIndex` (posição da van na linha) já alimenta mapa, previsão e velocidade. A simulação reaproveita isso.
- `estimativaRota` assume que o índice só cresce até o fim da linha; na volta (índice decrescente) e com pausas ela erra.
  Na simulação ela passa a vir da própria linha do tempo (tempo restante), não da distância pelos pontos.
- Distâncias das pernas da rota: garagem→Beatriz 2,19 km, →Sofia 1,38, →Gabriel 2,88, →Lucas 0,94, →Ana 0,79,
  →Santa Maria 0,73, →Aurora 0,74. As escolas ficam perto das casas, então "20 s até a escola" não sai só da distância.
- Gravidades que já existem: `BAIXA | MEDIA | ALTA | EMERGENCIA` (a tela "Avisar ocorrência" chama de Urgente).

## Abordagens consideradas

- **A. Linha do tempo + executor (escolhida).** Uma função pura monta a lista de eventos com horário a partir da escolha do
  usuário; um executor reproduz. Testável sem tela, reaproveita `gpsIndex`.
- **B. Encadear os botões de cenário com timers.** Mais barato, mas sem tempos por distância nem escolha de alunos.
- **C. Gravar GPS falso no backend real.** Exercita também o alerta do servidor, mas exige contas reais; não é demo.

## Desenho (PR 1)

**Escolhas do usuário** — folha "Simular viagem" no menu "…" da demo: ida ou volta; alunos (um chip por aluno, com a
escola ao lado; mínimo 1; quem fica de fora vira `AUSENTE` na viagem); ocorrência: nenhuma, ou gravidade Baixa/Média/Alta/
Urgente. A folha mostra "N alunos · 1 escola / 2 escolas" para deixar claro o caso montado.

**Linha do tempo** (`montarSimulacao(config)`, função pura em `src/services/simulacao.ts`):

- Ida: garagem → casas dos alunos escolhidos (ordem da rota) → escola(s) na ordem da rota. Volta: começa na primeira escola,
  embarca os alunos, volta pelas casas na ordem inversa, desembarcando cada um.
- Tempo de cada perna = distância × 4,5 s/km (garagem → 1ª casa da rota completa ≈ 10 s), com mínimo de 6 s por perna e de
  15 s para a perna até a escola; 4 s parados em cada parada. Constantes no topo do arquivo, fáceis de ajustar.
- Eventos: "van chegando" 3 s antes de cada casa, embarque ao parar na casa, desembarque na escola (ou na casa, na volta),
  notificações como as da demo hoje, fim da viagem. O responsável vê só os eventos dos próprios filhos.
- A ocorrência dispara na metade do tempo total. Por gravidade: **Baixa**: meia velocidade por 15 s, depois segue sozinha.
  **Média**: para 10 s, depois segue. **Alta**: para até o usuário tocar em Retomar. **Urgente**: para e encerra a viagem
  (alunos a bordo seguem como "a bordo"). Todas disparam o alerta aos responsáveis, como `registrarEventoRota` na demo.

**Atalhos (pular dentro da simulação)** — substituem `simularCenario`, `CENARIOS` e o "Avançar van (simulação)". Ficam na
faixa da simulação: **Próxima parada** (teleporta a van até a seguinte, rodando os eventos que ficaram pelo caminho),
**Ir para o fim** (chegada ao destino, viagem concluída) e **Disparar ocorrência** (agora, com a gravidade escolhida na
folha; se a folha estava em "nenhuma", pede a gravidade). Antes da saída há uma fase curta de espera (ida: 06:30 "hora de
preparar" → 06:55 "esperando o motorista"; a van sai após ~6 s) com o atalho **Pular para a saída**. Cobertura dos antigos
cenários: Hora de preparar e Esperando o motorista = fase de espera; Van a caminho, Van chegando e Aluno a bordo = durante
a viagem; Voltando para casa = volta; Corrida finalizada = Ir para o fim. "Fora do horário" = a demo parada, sem
simulação, com a hora real (Parar restaura).

**Executor** (em `AppContext`, atrás de `isDemo`): um `setInterval` lê a linha do tempo e move `gpsIndex`, atualiza
`alunos`, `notificacoes`, `viagemAtiva` e `horaSimulada` (ida 06:50, volta 12:30). Uma faixa na viagem, nas duas visões,
mostra "Simulação em andamento" com os atalhos acima, Retomar (quando parada) e Parar; Parar restaura o estado inicial da demo.

**Testes** (`tests/simulacao.test.ts`, como `demoRota.test.ts`): ordem das paradas e subconjuntos, volta invertida, duração
por perna e mínimos, comportamento de cada gravidade, alunos fora viram ausentes, e cada atalho (próxima parada, fim,
ocorrência) deixando o estado igual ao de quem esperou a simulação chegar lá.

## Parte decidida pelo usuário / parte decidida por mim

Decididas na conversa: simulação em tempo real por distância; escolher quantidade de alunos e se são da mesma escola ou
não; escolher ida ou volta; ocorrência no meio do caminho com comportamento **dependente da gravidade**.
Minhas escolhas (ajustáveis): a tabela de comportamento por gravidade, as constantes de tempo, ocorrência na metade, a
faixa Retomar/Parar, a fase de espera antes da saída, remover os botões de cenário antigos (ideia sua, no lugar de
mantê-los) e não incluir controle de velocidade.

## PR 2 (outro desenho, depois deste)

A demo hoje começa sempre "completa": responsável com filhos e motorista com veículo e alunos. Falta mostrar o começo da
vida no app: **responsável novo** (sem dependente: cadastrar o filho com o código do transportador, pessoas autorizadas) e
**motorista novo** (sem veículo nem alunos: cadastrar veículo, ver o código de convite, receber o primeiro aluno). Hoje
`cadastrarAluno` na demo só devolve um erro; precisaria de versão demo, e a entrada da demo ganharia a escolha entre perfil
completo e perfil novo. É grande o bastante para ter perguntas próprias; entra depois do PR 1.
