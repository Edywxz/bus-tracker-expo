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

- [ ] **RF001 — Rastreamento em Tempo Real via GPS**
  - **Descrição:** Exibição da localização ao vivo da van/ônibus no mapa com traçado de rota em movimento.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF002 — Envio de Notificações Automáticas e Alertas**
  - **Descrição:** Envio de alertas de proximidade (ex: 500m), confirmação de pagamento, lembretes de aula e avisos gerais.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF003 — Processamento de Pagamentos de Mensalidades**
  - **Descrição:** Suporte a pagamentos via Cartão de Crédito, PIX (QR Code e Copia e Cola) e Boleto Bancário.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF004 — Histórico de Transações e Comprovantes**
  - **Descrição:** Exibição do histórico de faturas pagas e pendentes com download/visualização de comprovante.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF005 — Registro de Embarque e Desembarque com Timestamp**
  - **Descrição:** Carimbo de data, hora e coordenadas do momento em que o aluno entra e sai do transporte.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF006 — Gestão e Conciliação de Contatos**
  - **Descrição:** Lista de contatos entre motoristas, monitores, escola e responsáveis com acesso direto a chamadas/chat.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF007 — Comunicação de Ausência / Falta do Aluno**
  - **Descrição:** Permite ao responsável notificar com antecedência a falta do aluno para o motorista otimizar a rota.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF008 — Controle de Acesso Baseado em Perfis (RBAC)**
  - **Descrição:** Visões diferenciadas no app para o perfil *Responsável* (rastreio/pagamento) e *Motorista/Monitor* (GPS/chamada).
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF009 — Suporte a Multi-Dependentes**
  - **Descrição:** Permite que um mesmo responsável alterne facilmente a visualização entre múltiplos filhos cadastrados.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

- [ ] **RF010 — Botão de Alerta de Emergência / Eventos de Rota (SOS)**
  - **Descrição:** Disparo imediato de comunicados de emergência ou atraso de rota pelo motorista para os pais.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RF011 — Lembretes de Vencimento e Recibo Automatizado**
  - **Descrição:** Envio prévio de alertas de vencimento da mensalidade e emissão de recibo digital formatado.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`

---

## 🔵 Requisitos Não Funcionais (RNF)

### 📌 Requisitos Originários

- [ ] **RNF001 — Criptografia de Dados Sensíveis (Segurança)**
  - **Descrição:** Garantir criptografia (ex: AES-256 / SSL/TLS) de dados pessoais dos alunos, responsáveis e dados financeiros.
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF002 — Baixa Latência de Atualização do GPS (Performance)**
  - **Descrição:** Atualização da posição no mapa com atraso máximo de 10 segundos.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RNF003 — Interface Responsiva Mobile (Usabilidade)**
  - **Descrição:** Layout otimizado e responsivo para sistemas Android e iOS.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RNF004 — Alta Disponibilidade (Disponibilidade)**
  - **Descrição:** Garantia de uptime de 99,9% durante os horários de operação comercial escolar.
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF005 — Operação Offline Parcial e Sincronização**
  - **Descrição:** Armazenamento local temporário dos registros de embarque no app do motorista caso ocorra queda de sinal.
  - **Prioridade:** Alta
  - **Status:** `[ ] Pendente`

- [ ] **RNF006 — Conformidade com LGPD (Proteção de Dados de Menores)**
  - **Descrição:** Mecanismos de consentimento explícito e políticas estritas de retenção e privacidade de localização dos alunos.
  - **Prioridade:** Crítica
  - **Status:** `[ ] Pendente`

- [ ] **RNF007 — Economia de Bateria e Consumo de Dados no GPS**
  - **Descrição:** Otimização do consumo de energia e tráfego de dados na transmissão de localização pelo dispositivo da van.
  - **Prioridade:** Média
  - **Status:** `[ ] Pendente`
