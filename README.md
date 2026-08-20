# 🚌 VanEscolar GPS — Software de Rastreamento e Pagamentos (React Native + Expo)

Aplicativo mobile em React Native com Expo para rastreamento em tempo real de transporte escolar, notificações automáticas, controle de embarque/desembarque de alunos, gestão de pagamentos (PIX, Cartão e Boleto) e conciliação de contatos entre pais e motoristas.

---

## 📄 Documentação de Requisitos e Progresso

Todos os Requisitos Funcionais (**RF001 a RF011**) e Não Funcionais (**RNF001 a RNF007**) com seus respectivos indicadores de progresso estão documentados no arquivo:
👉 [REQUISITOS.md](./REQUISITOS.md)

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
