# Estrutura do Front-End (React + Vite + Tailwind)

## ⚛️ Visão Geral

A aplicação web do **Finanças a Dois** será construída com **React + TypeScript + Vite**, priorizando leveza, performance e componentização clara.  
O layout será **responsivo**, preparado para futuras unificações com o app mobile (React Native via Expo Router).

O **objetivo principal do front** é oferecer uma experiência fluida, intuitiva e empática: poucos cliques, dados claros e visual coerente com a proposta de controle compartilhado.

---

## 🧱 Estrutura de Pastas

`web/   src/     api/                 # Hooks e clientes HTTP (React Query)     components/          # Componentes reutilizáveis (UI + lógica)     contexts/            # Contextos globais (auth, tema, household)     hooks/               # Custom hooks     layouts/             # Layouts principais (DashboardLayout, AuthLayout)     pages/       Auth/         Login.tsx         Register.tsx       Dashboard/         index.tsx       Transactions/         index.tsx         NewTransactionForm.tsx       Subscriptions/         index.tsx       Reports/         index.tsx       Settings/         index.tsx     router/              # Configuração do React Router     store/               # Zustand ou Context API (estados leves)     styles/              # Tailwind + temas customizados     types/               # Tipos e interfaces globais     utils/               # Funções auxiliares   vite.config.ts   tailwind.config.js   package.json`

---

## 🪄 1. Tecnologias e Bibliotecas

|Área|Lib / Tech|Função|
|---|---|---|
|UI|Tailwind CSS + Headless UI|Interface reativa e customizável|
|Estado|React Query|Fetching e cache de dados (API REST)|
|Navegação|React Router v6|Rotas declarativas e protegidas|
|Autenticação|JWT via Context|Sessões e controle de escopo|
|Formulários|React Hook Form + Zod|Validação e UX fluida|
|Ícones|Lucide React|Ícones leves e elegantes|
|Notificações|React Toastify|Feedback visual|
|Charts|Recharts|Gráficos simples para relatórios|
|Tema|Dark/Light toggle via Context|Personalização de experiência|

---

## 🧭 2. Fluxo de Navegação

`Login/Register → Dashboard Dashboard → [Transactions, Subscriptions, Reports, Settings]`

### Autenticação

- Rota `/login`: autentica o usuário e guarda token no `localStorage`.
    
- Middleware de rota protege todas as páginas exceto `/login` e `/register`.
    
- Após login, carrega o contexto `household` (grupo padrão).
    

---

## 🧾 3. Dashboard

### Objetivo

Mostrar um **resumo consolidado** do mês atual.

### Componentes

- **Saldo total** (contas + transferências);
    
- **Receitas vs Despesas** (gráfico de barras);
    
- **Gastos fixos e variáveis**;
    
- **Assinaturas ativas**;
    
- **Resumo por categoria**.
    

### Hooks

`const { data: summary } = useQuery(['dashboard'], () =>   api.get('/households/1/reports/summary').then(r => r.data) );`

---

## 💸 4. Transactions

### Objetivo

Permitir ao usuário **criar, listar e editar** lançamentos de forma rápida e clara.

### Componentes principais

- `TransactionTable.tsx`: lista paginada e filtrável.
    
- `NewTransactionForm.tsx`: formulário de criação/edição.
    
- `SplitEditor.tsx`: divisão de valores entre usuários.
    

### Fluxo

`Dashboard → Transactions → [Nova Transação] → Modal → POST /transactions → Atualiza listagem automaticamente (React Query invalidate)`

### Campos obrigatórios

- Conta
    
- Tipo (`expense`, `income`, `transfer`)
    
- Valor
    
- Data
    
- (Opcional) Categoria, Payee, Split
    

---

## 🔁 5. Subscriptions

### Objetivo

Gerenciar **assinaturas e despesas recorrentes**.

### Componentes

- `SubscriptionList.tsx`
    
- `NewSubscriptionForm.tsx`
    
- `NextRunLabel.tsx`
    

### Ações disponíveis

- Criar nova assinatura;
    
- Pausar/reativar (`PATCH active=false`);
    
- Executar manualmente (`POST /run`).
    

### UI

Lista simples, agrupada por tipo e data de renovação, destacando:

> “Netflix – R$ 39,90 – Próxima: 15/10/2025”

---

## 📊 6. Reports

### Objetivo

Gerar **visões analíticas** sobre o uso financeiro.

### Tipos de relatórios

1. **Resumo geral** – receitas, despesas, saldo.
    
2. **Categorias** – top gastos e percentuais.
    
3. **Membros** – rateio individual (via splits).
    
4. **Evolução temporal** – gráfico de linha (últimos 6 meses).
    

### Componentes

- `ReportSummary.tsx`
    
- `ReportCategoriesChart.tsx`
    
- `ReportMembers.tsx`
    
- `CashflowChart.tsx`
    

---

## ⚙️ 7. Settings

### Objetivo

Gerenciar:

- Perfil do usuário;
    
- Contas e categorias;
    
- Preferências de tema (dark/light);
    
- Parâmetros de divisão padrão (`equal`, `percent`, `fixed`).
    

### Componentes

- `ProfileSettings.tsx`
    
- `AccountsSettings.tsx`
    
- `CategoriesManager.tsx`
    
- `ThemeSwitcher.tsx`
    

---

## 📦 8. API Layer

### Client

`import axios from 'axios';  export const api = axios.create({   baseURL: import.meta.env.VITE_API_URL,   headers: { 'Content-Type': 'application/json' }, });`

### React Query Hooks

``export const useTransactions = (params) =>   useQuery(['transactions', params], () =>     api.get(`/households/1/transactions`, { params }).then((r) => r.data)   );  export const useCreateTransaction = () =>   useMutation((data) => api.post(`/households/1/transactions`, data));``

---

## 🎨 9. Estilo e Design

- **Paleta base:** tons de teal, azul e branco (inspirados no “tea lightning” que tu mencionou).
    
- **Fontes:** `Inter` e `Poppins`.
    
- **Cards e painéis** com sombras suaves, bordas arredondadas (`rounded-2xl`).
    
- **Modo escuro** com fundo `#0f172a` e tons de azul petróleo.
    
- Layout “zen”: foco nos dados, não nos elementos.
    

---

## 🧩 10. Integração com Backend

|Módulo|Hook/API|Endpoint|
|---|---|---|
|Auth|`useAuth()`|`/auth/login`, `/auth/register`|
|Households|`useHousehold()`|`/households`|
|Accounts|`useAccounts()`|`/households/:id/accounts`|
|Categories|`useCategories()`|`/households/:id/categories`|
|Transactions|`useTransactions()`|`/households/:id/transactions`|
|Subscriptions|`useSubscriptions()`|`/households/:id/subscriptions`|
|Reports|`useReports()`|`/households/:id/reports`|

---

## 🚀 11. Scripts

`// package.json {   "scripts": {     "dev": "vite",     "build": "vite build",     "preview": "vite preview",     "lint": "eslint src --ext .ts,.tsx"   } }`

---

## 🧭 Próximos Passos

1. Criar estrutura inicial com `npm create vite@latest web -- --template react-ts`.
    
2. Adicionar Tailwind e configurar tema.
    
3. Configurar React Router + React Query.
    
4. Implementar páginas: `Login`, `Dashboard`, `Transactions`, `Reports`.
    
5. Integrar endpoints do NestJS conforme documentado no `API_ROUTES.md`.
    
6. Criar componentes visuais reutilizáveis (`Card`, `Button`, `Input`, `Modal`).