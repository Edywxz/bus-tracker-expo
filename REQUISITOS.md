# 📋 Requisitos do Projeto — VanEscolar GPS

Este documento centraliza todos os **Requisitos Funcionais (RF)** e **Requisitos Não Funcionais (RNF)** do aplicativo de Rastreamento de Transporte Escolar e Gestão de Pagamentos, com seus respectivos indicadores de progresso.

---

## 📊 Dashboard de Progresso

| Categoria | Total | Concluídos `[x]` | Em Andamento `[/]` | Pendentes `[ ]` | % Progresso |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Requisitos Funcionais (RF)** | 11 | 0 | 0 | 11 | **0%** |
| **Requisitos Não Funcionais (RNF)** | 7 | 0 | 0 | 7 | **0%** |
| **Total Geral** | **18** | **0** | **0** | **18** | **0%** |

---

## 🟢 Requisitos Funcionais (RF)

### 📌 Requisitos Originários

- [ ] **RF001 — Cadastro de Responsável**
  - **Descrição:** O sistema deverá permitir que o responsável crie uma conta informando seus dados necessários para utilização do aplicativo.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

  - [ ] **RF002 — Cadastro de Aluno**
  - **Descrição:** O sistema deverá permitir que o responsável cadastre um ou mais alunos vinculados à sua conta.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF003 — Rastreamento em Tempo Real via GPS**
  - **Descrição:** Permitir que o responsável acompanhe a localização do transporte escolar em tempo real por meio de um mapa.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF004 — Envio de Notificações Automáticas e Alertas**
  - **Descrição:** O sistema deverá enviar notificações ao responsável sobre eventos relacionados ao transporte, pagamentos e rotina escolar, incluindo alertas de proximidade, vencimento de mensalidades, confirmação de pagamentos e avisos gerais.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF005 — Processamento de Pagamentos de Mensalidades**
  - **Descrição:** O sistema deverá permitir que o responsável realize o pagamento das mensalidades do transporte escolar por meio das opções de pagamento disponíveis (Pix, Cartão ou Boleto).
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF006 — Histórico de Transações e Comprovantes**
  - **Descrição:** O sistema deverá permitir que o responsável consulte o histórico de mensalidades pagas e pendentes e visualize os respectivos comprovantes de pagamento.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF007 — Registro de Embarque e Desembarque**
  - **Descrição:** Registro de data, hora e coordenadas do momento em que o aluno entra e sai do transporte.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF008 — Comunicação entre Usuários**
  - **Descrição:** O sistema deverá permitir a comunicação entre responsáveis, motoristas, monitores e escola por meio dos canais de comunicação disponíveis.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF009 — Comunicação de Ausência / Falta do Aluno**
  - **Descrição:** Permite ao responsável notificar com antecedência a falta do aluno para o motorista otimizar a rota.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF010 — Perfis de Usuário**
  - **Descrição:** O sistema deverá disponibilizar funcionalidades diferentes de acordo com o perfil do usuário, como responsável, motorista e monitor.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF011 — Cadastro e Acompanhamento de Múltiplos Alunos**
  - **Descrição:** O sistema deverá permitir que um responsável cadastre e acompanhe múltiplos alunos vinculados á sua conta.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF012 — Alerta de Emergência / Eventos de Rota (SOS)**
  - **Descrição:** O sistema deverá permitir que o motorista envie comunicados aos responsáveis sobre situações de emergência, atrasos ou alterações na rota.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF013 — Recibo Automatizado**
  - **Descrição:** O sistema deverá disponibilizar um recibo digital após a confirmação do pagamento de uma mensalidade.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

---

## 🔵 Requisitos Não Funcionais (RNF)

### 📌 Requisitos Originários

- [ ] **RNF001 — Criptografia de Dados Sensíveis (Segurança)**
  - **Descrição:** Garantir criptografia de dados pessoais dos alunos, responsáveis e dados financeiros.
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF002 — Baixa Latência de Atualização do GPS (Performance)**
  - **Descrição:** Atualização da posição no mapa com atraso máximo de 10 segundos.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RNF003 — Compatibilidade com Dispositivos móveis (Usabilidade)**
  - **Descrição:** O sistema deverá apresentar interface adequada pra utilização em dispositivos Android e iOS, se adaptando a diferente tamanhos de tela.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RNF004 — Alta Disponibilidade (Disponibilidade)**
  - **Descrição:** Garantia de que o app permanecerá funcionando em 99,9% do tempo durante os horários de operação comercial escolar.
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF005 — Operação Offline Parcial e Sincronização**
  - **Descrição:** O sistema deverá armazenar temporariamente os registros de embarque no aplicativo do motorista em caso da conexão cair, realizando a sincronização dos dados quando a conexão for reestabelecida.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RNF006 — Privacidade e Proteção de Dados**
  - **Descrição:** O sistema deverá atender aos requisitos da LGPD para garantir a proteção de dados pessoais dos alunos, responsáveis, motoristas e demais usuários.
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF007 — Economia de Bateria e Consumo de Dados no GPS**
  - **Descrição:** Otimização do consumo de energia e tráfego de dados na transmissão de localização pelo dispositivo da van.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`
