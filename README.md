# 🚌 VanEscolar GPS — Software de Rastreamento e Pagamentos (React Native + Expo)

Aplicativo mobile em React Native com Expo para rastreamento em tempo real de transporte escolar, notificações automáticas, controle de embarque/desembarque de alunos, gestão de pagamentos (PIX, Cartão e Boleto) e conciliação de contatos entre pais e motoristas.

---

## 📄 Documentação de Requisitos e Modelagem UML

- 📋 **Requisitos Funcionais e DCU:** 👉 [REQUISITOS.md](./REQUISITOS.md)
- 📐 **Diagrama de Classes UML (Draw.io):** 👉 [DIAGRAMA_CLASSES.md](./DIAGRAMA_CLASSES.md)
  - Arquivo editável: [`diagrama-classes.drawio`](./diagrama-classes.drawio)
  - Imagem PNG de alta resolução: [`diagrama-classes.drawio.png`](./diagrama-classes.drawio.png)
  - Vetor SVG: [`diagrama-classes.drawio.svg`](./diagrama-classes.drawio.svg)
  - Código Mermaid: [`diagrama-classes.mmd`](./diagrama-classes.mmd)

---

## 🛠️ Estrutura do Projeto

```
bus-tracker-expo/
├── REQUISITOS.md              # Lista completa de RFs e RNFs com checklist de progresso
├── package.json
├── app.json
├── tsconfig.json
├── babel.config.js
├── App.tsx
└── src/
    ├── types/                 # Modelos TypeScript
    ├── theme/                 # Design System (Cores, Tipografia e Estilos)
    ├── services/              # Serviços de GPS, Pagamentos e Criptografia
    ├── components/            # Componentes reutilizáveis
    ├── screens/               # Telas do aplicativo
    └── navigation/            # Navegação por Abas e Stack
```

---

## 🚀 Como Executar (Após Instalação das Dependências)

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento Expo
npm run start
```
