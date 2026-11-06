# 🚌 VanEscolar GPS — Software de Rastreamento e Gestão Escolar

Aplicativo mobile desenvolvido em **React Native** com **Expo** e **TypeScript**, voltado para **Transportadores Escolares Autônomos (Motoristas Independentes)**, **Pais/Responsáveis** e **Instituições de Ensino**.

A interface visual foi concebida seguindo rigorosamente as diretrizes da **Apple Human Interface Guidelines (HIG)**, entregando uma experiência minimalista, limpa, fluida e com padrão nativo premium para **iOS** e **Android**.

---

## 📑 Documentação do Projeto

- 📋 **Requisitos Funcionais e DCU (RF001 a RF021 / RNF001 a RNF008):** 👉 [REQUISITOS.md](./REQUISITOS.md)
- 📐 **Diagrama de Classes UML (Draw.io e Mermaid):** 👉 [DIAGRAMA_CLASSES.md](./DIAGRAMA_CLASSES.md)
- 🗄️ **Modelagem de Banco de Dados e RLS (PostGIS):** 👉 [`supabase/schema.sql`](./supabase/schema.sql)

---

## 📱 Visão Geral dos Módulos e Telas

| Módulo / Tela | Descrição e Requisitos Atendidos |
| :--- | :--- |
| **Rastreamento** | Mapa interativo estilo Apple Maps com telemetria GPS em tempo real, velocímetro, cálculo de ETA, itinerário sequencial de paradas, botão de simulação de avanço e aviso de chegada (**RF003, RF020, RF011**). |
| **Embarque** | Lista de alunos atendidos no roteiro, registro de entrada e saída na van em 1 toque, suporte completo a **operação offline** com fila local no AsyncStorage e sincronização em lote (**RF007, RF017, RNF005**). |
| **Financeiro** | Resumo financeiro anual, histórico de mensalidades e liquidação via **PIX** (QR Code + Copia e Cola), **Cartão de Crédito** (prévia Apple Card) e **Boleto Bancário**, com emissão de **Recibo Digital Autenticado com Hash** e consulta de **Contrato de Transporte** (**RF005, RF006, RF012, RF016**). |
| **Recados & Chat** | Alertas automáticos do sistema (aproximação da van, confirmação de embarque, avisos de trânsito) e canal de **Chat Direto operacional** no estilo iMessage entre pais, motorista e coordenação (**RF004, RF008**). |
| **Escola & Contatos** | Cadastro e gerenciamento de **Pessoas Autorizadas** com documentos e parentesco, dados da instituição de ensino vinculada e **Calendário Escolar Oficial** com feriados e recessos (**RF018, RF015, RF019**). |
| **Perfil & Frota** | Identificação estilo Apple ID, alternador rápido de atores (Pais, Motorista e Escola), gestão do veículo (Placa Mercosul, Alvará e vistoria) e dados de condutor substituto (**RF001, RF010, RF013, RF014, RF021**). |

---

## 🛠️ Pré-requisitos

Antes de iniciar, certifique-se de ter instalado no seu computador:

- **Node.js** (versão 20.x ou superior)
- **NPM** (versão 10.x ou superior)
- **Git**

---

## 📦 Instalação e Configuração

1. **Clone o repositório e acesse a pasta:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd bus-tracker-expo
   ```

2. **Configure as Variáveis de Ambiente:**
   Copie o arquivo de exemplo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Caso utilize o backend na nuvem, preencha as chaves `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`. O app também opera com dados locais demonstrativos e suporte offline caso o Supabase não esteja configurado).*

3. **Instale as dependências do projeto:**
   ```bash
   npm install
   ```

---

## 🚀 Como Visualizar e Executar o App

O Expo oferece múltiplas formas de visualização e teste:

### Opção 1: No Celular Físico via Expo Go (Mais Recomendado)

1. Baixe o aplicativo gratuito **Expo Go** no seu celular:
   - [Baixar na App Store (iOS / iPhone)](https://apps.apple.com/app/expo-go/id982107779)
   - [Baixar no Google Play (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Garanta que o celular e o computador estejam conectados na **mesma rede Wi-Fi**.
3. No terminal do computador, inicie o servidor:
   ```bash
   npm start
   # ou limpe o cache com:
   npx expo start -c
   ```
4. **No iPhone:** Abra o app nativo da **Câmera** e aponte para o QR Code gerado no terminal.
5. **No Android:** Abra o app **Expo Go**, toque em **Scan QR Code** e aponte para o terminal.

---

### Opção 2: No Emulador iOS (macOS com Xcode)

1. **Primeira configuração do Xcode (caso nunca tenha usado):**
   ```bash
   # Aponta para a instalação completa do Xcode
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

   # Conclui a instalação de pacotes e runtimes pendentes do simulador
   sudo xcodebuild -runFirstLaunch
   ```

2. **Iniciar o app no simulador iOS:**
   ```bash
   npm run ios
   # ou execute 'npm start' e pressione a tecla 'i'
   ```

---

### Opção 3: No Emulador Android (Android Studio)

1. Tenha o **Android Studio** instalado com um dispositivo virtual (AVD) configurado no *Device Manager*.
2. Garanta que as variáveis estejam no seu `~/.zshrc` ou `~/.bash_profile`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
3. Inicie o emulador Android pelo Android Studio.
4. Execute:
   ```bash
   npm run android
   # ou execute 'npm start' e pressione a tecla 'a'
   ```

---

### Opção 4: No Navegador Web

Para inspeção rápida de layout e responsividade desktop/mobile:
```bash
npm run web
# ou execute 'npm start' e pressione a tecla 'w'
```

---

## 🎨 Design System

Guia vivo em [`design-system/index.html`](./design-system/index.html) (abra no navegador). Implementação em `src/components/ds/` e tokens em `src/theme/`. Navegação 100% nativa com Expo Router: `NativeTabs` (Liquid Glass no iOS 26, Material 3 no Android), cabeçalhos nativos e sheets nativas.

---

## 🏗️ Como Gerar Builds do Aplicativo (EAS Build)

O projeto utiliza o **EAS (Expo Application Services)** para compilação em nuvem de instaladores para Android e iOS:

### 1. Instalar o EAS CLI e Efetuar Login
```bash
npm install -g eas-cli
eas login
```

### 2. Configurar o Projeto no EAS
```bash
eas build:configure
```

### 3. Gerar Build para Android

- **Gerar APK direto para testes no aparelho (sem precisar publicar na loja):**
  ```bash
  eas build -p android --profile preview
  ```
  *(Ao concluir, o EAS disponibiliza um link com QR Code para download direto do arquivo `.apk` no celular).*

- **Gerar pacote `.aab` (Android App Bundle) para a Google Play Store:**
  ```bash
  eas build -p android --profile production
  ```

### 4. Gerar Build para iOS

- **Gerar versão de teste interno / simulador:**
  ```bash
  eas build -p ios --profile preview
  ```

- **Gerar versão de distribuição final para TestFlight / App Store:**
  ```bash
  eas build -p ios --profile production
  ```

### 5. Compilação Local de Código Nativo (Prebuild)
Caso deseje inspecionar as pastas nativas geradas (`/ios` e `/android`) para compilação local no Xcode ou Android Studio:
```bash
npx expo prebuild
```

---

## 🧪 Verificação de Qualidade e Tipagem

Para garantir a estabilidade do código antes de submeter alterações:

```bash
# Verificação estática com TypeScript (0 erros esperados)
npx tsc --noEmit

# Diagnóstico de integridade do ambiente Expo
npx expo-doctor
```

---

## 🏛️ Estrutura de Diretórios

```
bus-tracker-expo/
├── app/                         # Rotas (Expo Router): _layout raiz, (tabs) com NativeTabs, telas de detalhe
├── app.json                     # Metadados e configuração do Expo
├── package.json                 # Dependências e scripts
├── tsconfig.json                # Configuração do TypeScript
├── REQUISITOS.md                # Matriz completa de Requisitos Funcionais e Não Funcionais
├── DIAGRAMA_CLASSES.md          # Especificação UML e rastreabilidade
├── supabase/
│   └── schema.sql               # Script DDL com PostgreSQL, PostGIS e políticas RLS
└── src/
    ├── components/ds/           # Design System "Faixa escolar" (HIG + Liquid Glass, equivalentes Material no Android)
    ├── components/              # RouteMap e kit (reexporta o design system)
    ├── context/                 # Estado global (AppContext) com persistência e ações
    ├── navigation/              # Atalhos de rota (routes.ts)
    ├── screens/                 # Telas da aplicação (Rastreamento, Embarque, Financeiro, etc.)
    ├── services/                # Regras de negócio (Boarding, Pagamento, GPS, Segurança/LGPD)
    ├── theme/                   # Tokens: colors.ts (claro/escuro), tokens.ts (espaço, raio, elevação, movimento), type.ts
    └── types/                   # Definições de tipos TypeScript do domínio
```

---

## ⚖️ Licença

Projeto desenvolvido para fins educacionais e profissionais de transporte escolar. Todos os direitos reservados.
