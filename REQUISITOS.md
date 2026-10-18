# 📋 Requisitos do Projeto — VanEscolar GPS

Este documento centraliza todos os **Requisitos Funcionais (RF)** e **Requisitos Não Funcionais (RNF)** do aplicativo de Rastreamento de Transporte Escolar e Gestão de Pagamentos voltado para **Transportadores Escolares Autônomos (Motoristas Independentes)**, com seus respectivos indicadores de progresso e rastreabilidade com o **Diagrama de Casos de Uso (DCU)**.

---

## 📊 Dashboard de Progresso

| Categoria | Total | Concluídos `[x]` | Em Andamento `[/]` | Pendentes `[ ]` | % Progresso |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Requisitos Funcionais (RF)** | 21 | 0 | 0 | 21 | **0%** |
| **Requisitos Não Funcionais (RNF)** | 8 | 0 | 0 | 8 | **0%** |
| **Total Geral** | **29** | **0** | **0** | **29** | **0%** |

---

## 👥 Atores do Sistema (Conforme DCU)

O Diagrama de Casos de Uso (DCU) define estritamente três atores primários:

1. **Pais (Responsáveis):** Usuários responsáveis pelos alunos, com permissão para gerenciar seus dados, alunos, pessoas autorizadas, pagamentos diretos ao motorista, comunicação de ausência, visualização de contrato e acompanhamento da van em tempo real.
2. **Transportador (Motorista Escolar Autônomo):** Profissional autônomo que atua de forma independente (sem intermédio de empresa distribuidora de serviços). É o próprio operador e condutor do serviço, responsável pelo gerenciamento de seu veículo, seus dados de condutor/substituto, lista de alunos atendidos, início de rotas, registro de embarque/desembarque e eventos de rota/emergência.
3. **Instituição de Ensino:** Escola ou colégio que mantém seus dados institucionais, calendário letivo e acompanha a movimentação do transporte escolar de seus alunos matriculados.

---

## 🟢 Requisitos Funcionais (RF)

### 📌 Mapeamento e Especificação

- [ ] **RF001 — Manter Responsável**
  - **Caso de Uso (DCU):** `Manter responsável`
  - **Ator(es):** Pais
  - **Descrição:** O sistema deverá permitir que o responsável realize seu cadastro, consulta, atualização e manutenção de seus dados pessoais necessários para acesso e uso da plataforma.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF002 — Manter Alunos**
  - **Caso de Uso (DCU):** `Manter Alunos`
  - **Ator(es):** Pais
  - **Descrição:** O sistema deverá permitir cadastrar, consultar, atualizar e excluir os dados dos alunos (dependentes) vinculados à conta do responsável.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF003 — Acompanhar Transporte em Tempo Real**
  - **Caso de Uso (DCU):** `Acompanhar transporte`
  - **Ator(es):** Pais, Instituição de Ensino
  - **Descrição:** O sistema deverá permitir que os pais/responsáveis e a instituição de ensino acompanhem a localização geográfica da van do motorista em tempo real durante os trajetos de ida e volta por meio de mapa interativo.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF004 — Receber Notificações e Alertas**
  - **Caso de Uso (DCU):** `Receber notificações/Alertas`
  - **Ator(es):** Pais, Transportador
  - **Descrição:** O sistema deverá enviar notificações automáticas e alertas aos usuários sobre eventos do transporte (início de rota pelo motorista, van se aproximando, atrasos, ocorrências), status de pagamentos (vencimento, confirmação) e avisos gerais.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF005 — Pagar Mensalidade**
  - **Caso de Uso (DCU):** `Pagar Mensalidade` (com especializações: `Pagar com PIX`, `Pagar com Cartão`, `Pagar com Boleto`)
  - **Ator(es):** Pais
  - **Descrição:** O sistema deverá permitir que o responsável efetue o pagamento das mensalidades diretamente ao transportador autônomo, disponibilizando os métodos de pagamento: PIX, Cartão de Crédito e Boleto Bancário.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF006 — Consultar Histórico**
  - **Caso de Uso (DCU):** `Consultar histórico`
  - **Ator(es):** Pais
  - **Descrição:** O sistema deverá permitir que o responsável consulte o histórico financeiro de mensalidades, visualizando parcelas pagas, pendentes, datas de vencimento e valores devidos ao transportador.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF007 — Registrar Embarque e Desembarque**
  - **Caso de Uso (DCU):** `Registrar embarque/desembarque`
  - **Ator(es):** Transportador
  - **Descrição:** O sistema deverá permitir que o transportador registre diretamente o momento de embarque e desembarque de cada aluno na van, armazenando data, horário e localização geográfica do registro.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF008 — Enviar e Receber Mensagens**
  - **Caso de Uso (DCU):** `Enviar/Receber Mensagens`
  - **Ator(es):** Pais, Transportador, Instituição de Ensino
  - **Descrição:** O sistema deverá disponibilizar canal de comunicação direta por mensagens entre pais, o transportador autônomo e a instituição de ensino para troca de recados e avisos operacionais.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF009 — Comunicar Ausência**
  - **Caso de Uso (DCU):** `Comunicar ausência`
  - **Ator(es):** Pais
  - **Descrição:** O sistema deverá permitir que o responsável informe com antecedência a ausência ou falta do aluno no trajeto, notificando o motorista autônomo para otimização de sua rota de coleta.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF010 — Gerenciamento de Perfis e Permissões**
  - **Caso de Uso (DCU):** Representado pela segregação de papéis dos atores
  - **Ator(es):** Pais, Transportador, Instituição de Ensino
  - **Descrição:** O sistema deverá disponibilizar funcionalidades e visões restritas compatíveis com o perfil do usuário logado (Pais, Transportador Autônomo ou Instituição de Ensino), resguardando a privacidade das informações.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF011 — Registrar Evento de Rota / Emergência**
  - **Caso de Uso (DCU):** `Registrar evento de rota/emergência`
  - **Ator(es):** Transportador
  - **Descrição:** O sistema deverá permitir que o transportador autônomo registre imprevistos de trânsito, quebras mecânicas ou situações de emergência, disparando alertas imediatos aos pais dos alunos da rota e à escola.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF012 — Visualizar Recibo**
  - **Caso de Uso (DCU):** `Visualizar Recibo` (`<<extends>>` de `Pagar Mensalidade`)
  - **Ator(es):** Pais
  - **Descrição:** O sistema deverá permitir a visualização e emissão do comprovante/recibo digital de pagamento após a liquidação de uma mensalidade pelo responsável.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF013 — Manter Veículo**
  - **Caso de Uso (DCU):** `Manter veículo`
  - **Ator(es):** Transportador
  - **Descrição:** O sistema deverá permitir que o transportador autônomo cadastre e mantenha os dados do seu veículo de transporte escolar (van/micro-ônibus), incluindo placa, modelo, capacidade de assentos e dados de vistoria/alvará.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF014 — Manter Motorista**
  - **Caso de Uso (DCU):** `Manter Motorista`
  - **Ator(es):** Transportador
  - **Descrição:** O sistema deverá permitir que o transportador autônomo cadastre e gerencie seus dados profissionais de condutor (CNH categoria D/E com EAR, credencial de transporte escolar, alvará de autônomo e foto), além de viabilizar o cadastro de condutor auxiliar/substituto previamente autorizado para coberturas emergenciais.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF015 — Manter Dados da Instituição**
  - **Caso de Uso (DCU):** `Manter dados da instituição`
  - **Ator(es):** Instituição de Ensino
  - **Descrição:** O sistema deverá permitir que a instituição de ensino mantenha atualizados seus dados cadastrais, endereço, horários de entrada/saída dos turnos e contatos da coordenação.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF016 — Visualizar Contrato**
  - **Caso de Uso (DCU):** `Visualizar Contrato`
  - **Ator(es):** Pais, Transportador
  - **Descrição:** O sistema deverá permitir que os pais e o transportador autônomo visualizem as condições, valores e termos do contrato direto de prestação de serviços de transporte escolar.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF017 — Gerenciar Alunos de Transporte**
  - **Caso de Uso (DCU):** `Gerenciar alunos de transporte`
  - **Ator(es):** Transportador
  - **Descrição:** O sistema deverá permitir que o transportador consulte, organize e gerencie a lista dos alunos matriculados em seu roteiro de transporte, com endereços de busca/entrega e turnos.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF018 — Manter Pessoas Autorizadas**
  - **Caso de Uso (DCU):** `Manter pessoas autorizadas`
  - **Ator(es):** Pais
  - **Descrição:** O sistema deverá permitir que o responsável cadastre e mantenha os dados (nome, parentesco/vínculo, documento e telefone) de pessoas terceiras autorizadas a entregar e receber o aluno nos pontos de embarque/desembarque da van.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF019 — Manter Calendário Escolar**
  - **Caso de Uso (DCU):** `Manter Calendário escolar`
  - **Ator(es):** Instituição de Ensino
  - **Descrição:** O sistema deverá permitir que a instituição de ensino cadastre e atualize as datas do ano letivo, incluindo feriados, recessos, eventos e dias sem aula, auxiliando o motorista no planejamento de dias úteis de trabalho.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF020 — Iniciar Serviço de Transporte**
  - **Caso de Uso (DCU):** `Iniciar serviço`
  - **Ator(es):** Transportador
  - **Descrição:** O sistema deverá permitir que o transportador autônomo inicie formalmente o percurso de transporte pelo aplicativo, acionando a transmissão de geolocalização e os alertas em tempo real para os pais e a escola.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF021 — Efetuar Login / Autenticação**
  - **Caso de Uso (DCU):** `Efetuar Login`
  - **Ator(es):** Pais, Transportador, Instituição de Ensino
  - **Descrição:** O sistema deverá permitir que todos os atores cadastrados realizem autenticação segura por meio de credenciais (e-mail/CPF e senha ou autenticação biométrica), obtendo acesso seguro às funções de seu respectivo perfil.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

---

## 🗺️ Matriz de Rastreabilidade (DCU ↔ Requisitos Funcionais)

| Caso de Uso no DCU | Ator(es) Conectado(s) | Requisito Funcional Vinculado |
| :--- | :--- | :--- |
| `Manter responsável` | Pais | **RF001** — Manter Responsável |
| `Manter Alunos` | Pais | **RF002** — Manter Alunos |
| `Manter pessoas autorizadas` | Pais | **RF018** — Manter Pessoas Autorizadas |
| `Comunicar ausência` | Pais | **RF009** — Comunicar Ausência |
| `Consultar histórico` | Pais | **RF006** — Consultar Histórico |
| `Pagar Mensalidade` | Pais | **RF005** — Pagar Mensalidade |
| `Pagar com Cartão` | *(Especialização de Pagar Mensalidade)* | **RF005** — Pagar Mensalidade |
| `Pagar com Boleto` | *(Especialização de Pagar Mensalidade)* | **RF005** — Pagar Mensalidade |
| `Pagar com PIX` | *(Especialização de Pagar Mensalidade)* | **RF005** — Pagar Mensalidade |
| `Visualizar Recibo` | Pais *(<<extends>> de Pagar Mensalidade)* | **RF012** — Visualizar Recibo |
| `Visualizar Contrato` | Pais, Transportador | **RF016** — Visualizar Contrato |
| `Receber notificações/Alertas` | Pais, Transportador | **RF004** — Receber Notificações e Alertas |
| `Efetuar Login` | Pais, Transportador, Instituição de Ensino | **RF021** — Efetuar Login / Autenticação |
| `Enviar/Receber Mensagens` | Pais, Transportador, Instituição de Ensino | **RF008** — Enviar e Receber Mensagens |
| `Acompanhar transporte` | Pais, Instituição de Ensino | **RF003** — Acompanhar Transporte em Tempo Real |
| `Manter dados da instituição`| Instituição de Ensino | **RF015** — Manter Dados da Instituição |
| `Manter Calendário escolar` | Instituição de Ensino | **RF019** — Manter Calendário Escolar |
| `Iniciar serviço` | Transportador | **RF020** — Iniciar Serviço de Transporte |
| `Gerenciar alunos de transporte` | Transportador | **RF017** — Gerenciar Alunos de Transporte |
| `Registrar embarque/desembarque` | Transportador | **RF007** — Registrar Embarque e Desembarque |
| `Registrar evento de rota/emergência` | Transportador | **RF011** — Registrar Evento de Rota / Emergência |
| `Manter veículo` | Transportador | **RF013** — Manter Veículo |
| `Manter Motorista` | Transportador | **RF014** — Manter Motorista |

---

## 🔵 Requisitos Não Funcionais (RNF)

### 📌 Requisitos Originários

- [ ] **RNF001 — Criptografia de Dados Sensíveis (Segurança)**
  - **Descrição:** Garantir criptografia de dados pessoais dos alunos, responsáveis e dados financeiros em repouso e em trânsito (TLS/AES).
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF002 — Baixa Latência de Atualização do GPS (Performance)**
  - **Descrição:** Atualização da posição no mapa com atraso máximo de 10 segundos durante o rastreamento em tempo real.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RNF003 — Compatibilidade com Dispositivos Móveis (Usabilidade)**
  - **Descrição:** O sistema deverá apresentar interface responsiva e adaptada para dispositivos Android e iOS com diferentes tamanhos de tela.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RNF004 — Alta Disponibilidade (Disponibilidade)**
  - **Descrição:** Garantia de que o app e serviços de retaguarda permanecerão operando em 99,9% do tempo durante os horários de operação comercial escolar.
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF005 — Operação Offline Parcial e Sincronização**
  - **Descrição:** O sistema deverá armazenar temporariamente os registros de embarque no aplicativo do transportador autônomo em caso de perda de conexão celular, realizando sincronização automática assim que a conectividade for restabelecida.
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF006 — Privacidade e Proteção de Dados (LGPD)**
  - **Descrição:** O sistema deverá atender às diretrizes da LGPD (Lei Geral de Proteção de Dados) para salvaguarda dos dados sensíveis de menores, responsáveis e motoristas.
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF007 — Economia de Bateria e Consumo de Dados no GPS**
  - **Descrição:** Otimização do consumo de energia e transmissão de telemetria para evitar desgaste excessivo de bateria e franquia de dados do dispositivo do transportador.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RNF008 — Isolamento de Dados entre Transportadores Autônomos**
  - **Descrição:** O sistema deverá garantir que as informações de rotas, localização, alunos, responsáveis, contratos e histórico financeiro de um transportador autônomo sejam estritamente isoladas e confidenciais, não sendo acessíveis por outros motoristas cadastrados na plataforma.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`
