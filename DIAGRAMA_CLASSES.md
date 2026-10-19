# 📐 Diagrama de Classes UML — VanEscolar GPS

Este documento detalha o **Diagrama de Classes UML** desenvolvido para o sistema **VanEscolar GPS**, integrando os requisitos do domínio, o Diagrama de Casos de Uso (DCU) e os requisitos funcionais (**RF001 a RF021**) e não funcionais (**RNF001 a RNF008**).

---

## 🎨 Integração com o Draw.io

O diagrama foi gerado nativamente e está disponível nos seguintes formatos no projeto:

1. **Arquivo Nativo Draw.io (Editável):** [`diagrama-classes.drawio`](./diagrama-classes.drawio)
2. **Exportação em Imagem com XML Embutido:** [`diagrama-classes.drawio.png`](./diagrama-classes.drawio.png)
3. **Exportação Vetorial com XML Embutido:** [`diagrama-classes.drawio.svg`](./diagrama-classes.drawio.svg)
4. **Código Fonte Mermaid:** [`diagrama-classes.mmd`](./diagrama-classes.mmd)
5. **Acesso Web Direto:** Você pode abrir e editar o diagrama imediatamente no navegador pelo link do [Draw.io Web (app.diagrams.net)](./drawio-web-link.txt).

> **Dica de Visualização no VS Code / IDE:** Se você possui a extensão **Draw.io Integration** (`hediet.vscode-drawio`), basta clicar duas vezes sobre o arquivo `diagrama-classes.drawio` ou `diagrama-classes.drawio.png` para abrir e editar visualmente direto no editor.

---

## 🧩 Visão Geral da Arquitetura de Classes

O sistema foi estruturado em **5 módulos principais coesos**, refletindo os atores e regras de negócio:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA DE CLASSES                          │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│ 1. Usuários & Perfis│ 2. Alunos & Presença     │ 3. Frota & Operação   │
│   • Usuario (abs)   │   • Aluno                │   • Veiculo           │
│   • Responsavel     │   • PessoaAutorizada     │   • ViagemTransporte  │
│   • Transportador   │   • ComunicadoAusencia   │   • LocalizacaoGPS    │
│   • Instituicao     │   • Turno (enum)         │   • RegEmbarqueDesemb │
│   • MotoristaSubst  │   • PeriodoAusencia(enum)│   • EventoRota        │
│   • TipoUsuario     │                          │   • CalendarioEscolar │
├─────────────────────┴──────────────────────────┴───────────────────────┤
│ 4. Financeiro & Contratos                      │ 5. Comunicação        │
│   • ContratoServico     • Pagamento (abs)      │   • Mensagem          │
│   • Mensalidade         • PagamentoPix         │   • Notificacao       │
│   • StatusMensalidade   • PagamentoCartao      │   • TipoNotificacao   │
│   • StatusContrato      • PagamentoBoleto      │                       │
│   • Recibo              • MetodoPagamento(enum)│                       │
└────────────────────────────────────────────────┴───────────────────────┘
```

---

## 🏛️ Detalhamento dos Módulos e Classes

### 1. Módulo de Usuários e Perfis de Acesso
- **`Usuario` (Classe Abstrata):** Centraliza a identidade básica de acesso, autenticação e dados de contato comuns a todos os atores (`RF021`).
  - *Atributos:* `id`, `nome`, `email`, `cpf`, `telefone`, `senhaHash`, `tipoUsuario`, `ativo`, `dataCriacao`.
  - *Métodos:* `autenticar(senha)`, `atualizarPerfil(dados)`, `alterarSenha(...)`, `desativarConta()`.
- **`Responsavel` (Especialização de Usuario):** Representa os pais ou responsáveis financeiros/legais (`RF001`).
  - *Atributos:* `enderecoResidencial`.
  - *Métodos:* `cadastrarAluno()`, `vincularPessoaAutorizada()`, `comunicarAusencia()`, `pagarMensalidade()`, `consultarHistoricoFinanceiro()`, `visualizarRecibo()`, `visualizarContrato()`, `acompanharTransporte()`.
- **`Transportador` (Especialização de Usuario):** Motorista autônomo escolar independente (`RF014`).
  - *Atributos:* `cnh`, `categoriaCnh` (D/E com EAR), `numeroCredencial`, `alvaraAutonomo`, `fotoUrl`.
  - *Métodos:* `cadastrarVeiculo()`, `cadastrarMotoristaSubstituto()`, `iniciarViagem()`, `finalizarViagem()`, `registrarEmbarque()`, `registrarDesembarque()`, `registrarEventoRota()`, `emitirContrato()`.
- **`InstituicaoEnsino` (Especialização de Usuario):** Colégio ou escola onde os alunos estudam (`RF015`).
  - *Atributos:* `cnpj`, `razaoSocial`, `endereco`, `telefoneContato`, `horarioTurnos`.
  - *Métodos:* `manterCalendarioEscolar()`, `consultarAlunosTransportados()`, `acompanharTransporte()`.
- **`MotoristaSubstituto`:** Condutor substituto homologado pelo transportador para coberturas emergenciais (`RF014`).

---

### 2. Módulo de Alunos e Segurança
- **`Aluno`:** Aluno dependente atendido no transporte escolar (`RF002`, `RF017`).
  - *Atributos:* `id`, `nome`, `dataNascimento`, `documento`, `turma`, `turno`, `enderecoBusca`, `enderecoEntrega`, `observacoesMedicas`.
- **`PessoaAutorizada`:** Pessoas de confiança autorizadas pelos pais para entregar ou receber o aluno na van (`RF018`).
  - *Atributos:* `id`, `nome`, `cpf`, `telefone`, `grauParentesco`, `fotoUrl`.
- **`ComunicadoAusencia`:** Registro de falta do aluno comunicado previamente pelos pais (`RF009`).
  - *Atributos:* `id`, `dataInicio`, `dataFim`, `periodo` (`IDA`, `VOLTA`, `AMBOS`), `motivo`, `notificadoTransportadorEm`.

---

### 3. Módulo de Transporte, Rota e Telemetria em Tempo Real
- **`Veiculo`:** Van ou micro-ônibus utilizado no transporte escolar (`RF013`).
  - *Atributos:* `id`, `placa`, `modelo`, `ano`, `capacidadeAssentos`, `renavam`, `numeroAlvara`, `validadeVistoria`.
- **`ViagemTransporte`:** Trajeto realizado pelo transportador em um determinado turno (`RF020`, `RF003`).
  - *Atributos:* `id`, `tipoViagem` (`IDA`, `VOLTA`), `turno`, `dataHoraInicio`, `dataHoraFim`, `status`, `kmPercorrido`.
- **`LocalizacaoGPS`:** Coordenadas e telemetria transmitidas pela van com baixa latência (`RF003`, `RNF002`, `RNF007`).
  - *Atributos:* `latitude`, `longitude`, `velocidade`, `direcao`, `precisaoMetros`, `timestamp`.
- **`RegistroEmbarqueDesembarque`:** Controle em tempo real e offline de entrada e saída dos alunos (`RF007`, `RNF005`).
  - *Atributos:* `id`, `tipo` (`EMBARQUE`, `DESEMBARQUE`), `dataHora`, `registradoOffline`, `sincronizadoEm`.
- **`EventoRota`:** Registro de incidentes ou emergências pelo motorista (`RF011`).
  - *Atributos:* `id`, `tipo` (Trânsito, Quebra Mecânica, Acidente, etc.), `descricao`, `dataHora`, `severidade`.
- **`CalendarioEscolar` e `EventoCalendario`:** Controle do ano letivo pela escola para planejamento das viagens (`RF019`).

---

### 4. Módulo Financeiro, Pagamentos e Contratos
- **`ContratoServico`:** Termo direto de prestação de serviços entre os pais e o transportador autônomo (`RF016`).
  - *Atributos:* `numeroContrato`, `valorMensalidade`, `diaVencimento`, `dataInicio`, `dataTermino`, `termosCondicoes`.
- **`Mensalidade`:** Cobrança gerada com base no contrato (`RF006`).
  - *Atributos:* `mesReferencia`, `anoReferencia`, `valor`, `dataVencimento`, `valorMultaJuros`, `status`.
- **`Pagamento` (Classe Abstrata) & Especializações (`RF005`):**
  - **`PagamentoPix`:** Chave PIX, QR Code Dinâmico, Linha Copia-e-Cola e TxID.
  - **`PagamentoCartao`:** Cartão de crédito, tokenização de segurança, autorização e bandeira.
  - **`PagamentoBoleto`:** Código de barras, linha digitável e PDF para pagamento.
- **`Recibo`:** Comprovante digital emitido após confirmação do pagamento com hash de autenticidade (`RF012`).

---

### 5. Módulo de Comunicação e Mensageria
- **`Mensagem`:** Canal direto de troca de recados operacionais entre pais, transportador e colégio (`RF008`).
- **`Notificacao`:** Alertas automáticos do sistema (van se aproximando, embarque realizado, avisos financeiros, emergências) (`RF004`).

---

## 📊 Matriz de Rastreabilidade (Classes ↔ Requisitos Funcionais)

| Requisito Funcional | Classes Envolvidas |
| :--- | :--- |
| **RF001 — Manter Responsável** | `Usuario`, `Responsavel` |
| **RF002 — Manter Alunos** | `Aluno`, `Responsavel` |
| **RF003 — Acompanhar Transporte em Tempo Real** | `ViagemTransporte`, `LocalizacaoGPS` |
| **RF004 — Receber Notificações e Alertas** | `Notificacao`, `TipoNotificacao` |
| **RF005 — Pagar Mensalidade** | `Pagamento`, `PagamentoPix`, `PagamentoCartao`, `PagamentoBoleto`, `Mensalidade` |
| **RF006 — Consultar Histórico** | `Mensalidade`, `StatusMensalidade`, `Pagamento` |
| **RF007 — Registrar Embarque/Desembarque** | `RegistroEmbarqueDesembarque`, `Aluno`, `PessoaAutorizada` |
| **RF008 — Enviar e Receber Mensagens** | `Mensagem`, `Usuario` |
| **RF009 — Comunicar Ausência** | `ComunicadoAusencia`, `Aluno`, `PeriodoAusencia` |
| **RF010 — Gerenciamento de Perfis e Permissões** | `Usuario`, `TipoUsuario`, `Responsavel`, `Transportador`, `InstituicaoEnsino` |
| **RF011 — Registrar Evento de Rota / Emergência** | `EventoRota`, `TipoEvento`, `SeveridadeEvento`, `ViagemTransporte` |
| **RF012 — Visualizar Recibo** | `Recibo`, `Pagamento` |
| **RF013 — Manter Veículo** | `Veiculo`, `Transportador` |
| **RF014 — Manter Motorista** | `Transportador`, `MotoristaSubstituto` |
| **RF015 — Manter Dados da Instituição** | `InstituicaoEnsino` |
| **RF016 — Visualizar Contrato** | `ContratoServico`, `StatusContrato` |
| **RF017 — Gerenciar Alunos de Transporte** | `Aluno`, `Transportador` |
| **RF018 — Manter Pessoas Autorizadas** | `PessoaAutorizada`, `Aluno` |
| **RF019 — Manter Calendário Escolar** | `CalendarioEscolar`, `EventoCalendario`, `InstituicaoEnsino` |
| **RF020 — Iniciar Serviço de Transporte** | `ViagemTransporte`, `StatusViagem`, `TipoViagem` |
| **RF021 — Efetuar Login / Autenticação** | `Usuario`, `Responsavel`, `Transportador`, `InstituicaoEnsino` |

---

## 🔄 Como Atualizar ou Reexportar o Diagrama

Caso você edite as classes no arquivo [`diagrama-classes.mmd`](./diagrama-classes.mmd), você pode recompilar todos os arquivos do Draw.io executando os comandos:

```bash
# 1. Gerar o arquivo nativo .drawio
drawio -x -f xml -o diagrama-classes.drawio diagrama-classes.mmd

# 2. Exportar PNG de alta resolução com XML embutido
drawio -x -f png -e -b 10 -o diagrama-classes.drawio.png diagrama-classes.drawio

# 3. Exportar SVG vetorial com XML embutido
drawio -x -f svg -e -b 10 -o diagrama-classes.drawio.svg diagrama-classes.drawio
```
