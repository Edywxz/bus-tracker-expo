# 📋 Requisitos do Projeto — VanEscolar GPS

Este documento centraliza todos os **Requisitos Funcionais (RF)** e **Requisitos Não Funcionais (RNF)** do aplicativo de Rastreamento de Transporte Escolar e Gestão de Pagamentos, com seus respectivos indicadores de progresso.

---

## 📊 Dashboard de Progresso

| Categoria | Total | Concluídos `[x]` | Em Andamento `[/]` | Pendentes `[ ]` | % Progresso |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Requisitos Funcionais (RF)** | 20 | 0 | 0 | 20 | **0%** |
| **Requisitos Não Funcionais (RNF)** | 8 | 0 | 0 | 8 | **0%** |
| **Total Geral** | **28** | **0** | **0** | **28** | **0%** |

---

## 🟢 Requisitos Funcionais (RF)

### 📌 Requisitos Originários

- [ ] **RF001 — Manter dados do Responsável**
  - **Descrição:** O sistema deverá permitir que o responsável crie uma conta informando seus dados necessários para utilização do aplicativo.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF002 — Manter dados dos Alunos**
  - **Descrição:** O sistema deverá permitir manter os dados dos alunos vinculados à conta do responsável, possibilitando seu cadastro, consulta, alteração e exclusão.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF003 — Rastreamento do transporte em Tempo Real**
  - **Descrição:** O sistema deverá permitir que os usuários autorizados acompanhem a localização do transporte escolar em tempo real durante os trajetos de ida e volta, por meio de um mapa.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF004 — Envio de Notificações Automáticas e Alertas**
  - **Descrição:** O sistema deverá enviar notificações aos usuários sobre eventos relacionados ao transporte, pagamentos e rotina escolar, incluindo início do trajeto, proximidade do transporte, vencimento de mensalidades, confirmação de pagamentos, alterações no calendário, atrasos, ocorrências e avisos gerais.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF005 — Acompanhamento e Pagamento de Mensalidades**
  - **Descrição:** O sistema deverá permitir que o responsável realize o pagamento das mensalidades do transporte escolar por meio das opções de pagamento disponíveis (Pix, Cartão ou Boleto), podendo ser único ou em até 12 parcelas.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF006 — Histórico de Transações**
  - **Descrição:** O sistema deverá permitir que o responsável consulte o histórico de mensalidades, identificando pagamentos realizados, valores e parcelas pendentes.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF007 — Registro de Embarque e Desembarque**
  - **Descrição:** O sistema deverá registrar o embarque e o desembarque do aluno, armazenando informações como data, horário e localização do registro.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF008 — Comunicação**
  - **Descrição:** O sistema deverá permitir a comunicação entre responsáveis, transportadores, monitores e instituições de ensino por meio dos canais de comunicação disponíveis.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF009 — Comunicação de Ausência / Falta do Aluno**
  - **Descrição:** O sistema deverá permitir que o responsável informe antecipadamente a ausência do aluno ao transportador.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF010 — Gerenciamento de Perfis e Permissões**
  - **Descrição:** O sistema deverá disponibilizar funcionalidades e permissões diferentes de acordo com o perfil do usuário, incluindo responsável, transportador, monitor e instituição de ensino.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF011 — Alerta de Emergência / Eventos de Rota**
  - **Descrição:** O sistema deverá permitir que o motorista registre e envie comunicados aos responsáveis e à instituição de ensino sobre situações ocorridas durante o transporte, incluindo emergências, atrasos, alterações na rota e outras ocorrências.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF012 — Emissão de Recibo de Pagamento**
  - **Descrição:** O sistema deverá disponibilizar um recibo digital após a confirmação do pagamento de uma mensalidade.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF013 — Cadastro e Identificação de Veículos**
  - **Descrição:** O sistema deverá permitir o cadastro dos veículos utilizados no transporte escolar, incluindo sua placa de identificação e sua associação ao respectivo transportador.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF014 — Manter dados de Empresas**
  - **Descrição:** O sistema deverá permitir manter os dados das empresas de transporte escolar cadastradas, incluindo sua associação aos respectivos usuários, veículos e serviços.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF015 — Manter dados de instituições de ensino**
  - **Descrição:** O sistema deverá permitir o cadastro e gerenciamento das instituições de ensino participantes do serviço de transporte escolar.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF016 — Visualização de contratos**
  - **Descrição:** O sistema deverá permitir que o responsável e o transportador visualizem as informações do contrato de prestação de serviço de transporte escolar previamente cadastrados pela instituição de ensino.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF017 — Gerenciamento de Alunos pelo Transportador**
  - **Descrição:** O sistema deverá permitir que o transportador consulte e acompanhe os alunos vinculados ao seu serviço de transporte.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF018 — Manter Pessoas Autorizadas**
  - **Descrição:** O sistema deverá permitir que o responsável mantenha os dados das pessoas autorizadas a entregar e receber o aluno durante o embarque e desembarque.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF019 — Manter Calendário Escolar**
  - **Descrição:** O sistema deverá permitir que a instituição de ensino mantenha as datas relacionadas ao calendário escolar, incluindo dias letivos e dias sem aula.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF020 — Início do Serviço de Transporte**
  - **Descrição:** O sistema deverá permitir que o transportador inicie o serviço de transporte pelo aplicativo, ativando as funcionalidades relacionadas ao acompanhamento do trajeto e comunicação com os usuários.
  - **Prioridade:** Alta
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
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF006 — Privacidade e Proteção de Dados**
  - **Descrição:** O sistema deverá atender aos requisitos da LGPD para garantir a proteção de dados pessoais dos alunos, responsáveis, motoristas e demais usuários.
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF007 — Economia de Bateria e Consumo de Dados no GPS**
  - **Descrição:** Otimização do consumo de energia e tráfego de dados na transmissão de localização pelo dispositivo da van.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RNF008 — Isolamento dos Dados entre Empresas**
  - **Descrição:** O sistema deverá garantir que os dados de uma empresa de transporte não sejam acessíveis por usuários vinculados a outras empresas.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`
