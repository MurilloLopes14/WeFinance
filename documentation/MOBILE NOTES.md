# Estrutura do App Mobile (React Native + Expo)
## 📱 Visão Geral

O aplicativo **Finanças a Dois Mobile** será construído em **React Native (via Expo)**, com foco em **uso offline**, **sincronização automática** e **experiência simplificada**.

Ele deve permitir que o casal registre gastos rapidamente, consulte saldos e visualize relatórios resumidos, **sem depender de conexão constante**.

O app se comunica com a API NestJS (mesma base do projeto web) e armazena dados localmente via **SQLite** enquanto estiver offline.

---

## 🧱 Estrutura de Pastas

`mobile/   src/     api/              # Client API + sync handlers     components/       # Botões, inputs, cards, gráficos     hooks/            # React Query + sync hooks     navigation/       # Expo Router ou React Navigation     screens/       Auth/         LoginScreen.tsx       Home/         DashboardScreen.tsx       Transactions/         TransactionListScreen.tsx         NewTransactionScreen.tsx       Subscriptions/         SubscriptionsScreen.tsx       Reports/         ReportsScreen.tsx       Settings/         SettingsScreen.tsx     store/            # Zustand ou AsyncStorage wrapper     db/               # SQLite schemas e operações locais     utils/   app.json   package.json`

---

## ⚙️ 1. Stack Técnica

|Camada|Tecnologia|Função|
|---|---|---|
|Base|**Expo SDK**|Desenvolvimento rápido multiplataforma|
|Estado|**React Query + Zustand**|Cache e controle de estado|
|Offline|**SQLite + AsyncStorage**|Banco local e cache persistente|
|UI|**NativeWind (Tailwind for RN)**|Estilização unificada com web|
|Navegação|**Expo Router**|Rotas simples e previsíveis|
|Notificações|**Expo Notifications**|Alertas para despesas/assinaturas|
|Gráficos|**Victory Native / Recharts**|Relatórios compactos|
|Auth|**JWT + Refresh local**|Sessões com revalidação automática|

---

## 🔗 2. Sincronização Offline (Sync Layer)

### Objetivo

Permitir que o usuário:

- Cadastre transações mesmo offline;
    
- Visualize saldos e relatórios locais;
    
- Sincronize automaticamente quando reconectar.
    

### Estrutura Lógica

`flowchart LR A[User Action] --> B[Store in Local Queue] B -->|Online| C[Send to API NestJS] C --> D[Update Remote + Local SQLite] B -->|Offline| E[Persist in AsyncStorage] E -->|Reconnect| C`

### Estratégia de Implementação

1. **Tabela local `pending_mutations`** no SQLite;
    
2. Cada ação (create/update/delete) gera uma entrada nessa tabela;
    
3. Um hook `useSync()` monitora o status de rede;
    
4. Quando volta a ficar online → reenvia tudo à API e remove da fila.
    

---

## 🧾 3. Telas Principais

### 🔐 LoginScreen

- Campos: email e senha;
    
- Armazena tokens em `SecureStore`;
    
- Após sucesso → redireciona para `DashboardScreen`.
    

### 🏠 DashboardScreen

- Exibe resumo mensal:
    
    - Saldo consolidado;
        
    - Total de receitas/despesas;
        
    - Gráfico de pizza com top categorias;
        
    - Próximas assinaturas.
        
- Sincroniza dados do backend ao abrir.
    

### 💸 TransactionListScreen

- Lista paginada das transações recentes;
    
- Filtros por tipo, data e categoria;
    
- Botão flutuante “+” para criar nova transação.
    

### 📝 NewTransactionScreen

- Formulário simplificado:
    
    - Conta, valor, categoria, tipo, data, descrição.
        
- Botão “Salvar” → grava localmente (mesmo offline).
    

### 🔁 SubscriptionsScreen

- Lista assinaturas com valor e próxima data;
    
- Opção para pausar ou rodar manualmente (`POST /run`);
    
- Exibe lembrete se alguma estiver próxima de vencer.
    

### 📊 ReportsScreen

- Gráficos de resumo:
    
    - Gastos x Receitas (mês atual);
        
    - Evolução de saldo (últimos 6 meses);
        
    - Gastos por categoria.
        

### ⚙️ SettingsScreen

- Gerencia preferências locais:
    
    - Tema (claro/escuro);
        
    - Sincronização automática (on/off);
        
    - Logout (limpa dados locais e tokens).
        

---

## 🔐 4. Autenticação Local

- Tokens JWT são armazenados via `SecureStore` (Expo);
    
- O app usa um `AuthProvider` que:
    
    - Carrega tokens na inicialização;
        
    - Valida expiração e renova via `/auth/refresh`;
        
    - Intercepta requisições via Axios.
        

``const api = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL });  api.interceptors.request.use(async (config) => {   const token = await SecureStore.getItemAsync('accessToken');   if (token) config.headers.Authorization = `Bearer ${token}`;   return config; });``

---

## 💾 5. Banco Local (SQLite)

### Tabelas Locais (simplificadas)

- `transactions_local`
    
- `accounts_local`
    
- `categories_local`
    
- `subscriptions_local`
    
- `pending_mutations`
    

### Exemplo de schema

`CREATE TABLE IF NOT EXISTS transactions_local (   id TEXT PRIMARY KEY,   account_id INTEGER,   category_id INTEGER,   amount NUMERIC,   description TEXT,   date TEXT,   type TEXT,   synced BOOLEAN DEFAULT 0 );`

---

## ⚙️ 6. Hooks Principais

### `useSync()`

Gerencia fila de mutações e reconciliação.

`useEffect(() => {   if (isOnline && pendingMutations.length > 0) {     syncMutations();   } }, [isOnline, pendingMutations]);`

### `useTransactions()`

Busca transações locais e remotas com fallback.

`const { data: localTx } = useSQLiteQuery('SELECT * FROM transactions_local'); const { data: remoteTx } = useQuery(['transactions'], fetchRemote);`

---

## 🎨 7. Estilo e UX

- **Design minimalista**, tipografia consistente (Inter);
    
- Ícones grandes e legíveis;
    
- **Cards interativos** com feedback tátil (Haptics);
    
- **Botão flutuante universal (FAB)** para novas transações;
    
- **Modo escuro padrão** (melhor contraste para uso noturno);
    
- Layout inspirado no web: identidade visual unificada.
    

---

## 🚀 8. Scripts e Dev Setup

`npx create-expo-app mobile cd mobile npm install react-query @react-navigation/native nativewind expo-sqlite @react-native-async-storage/async-storage`

Executar:

`npm run start`

---

## 🧭 9. Roadmap Mobile (MVP → M1)

|Etapa|Descrição|Status|
|---|---|---|
|Auth + Login persistente|Implementar SecureStore + Refresh|🟢|
|Dashboard|Exibir resumo mensal + sync inicial|🟢|
|Transações|CRUD offline + sync|🟡|
|Assinaturas|Listagem e execução manual|🟡|
|Reports|Gráficos locais simples|⚪|
|Settings|Tema e logout|⚪|
|Sync Layer|Fila + reconciliador|🟡|

---

## 🧩 10. Integração com Backend

O mobile utiliza as **mesmas rotas** documentadas em `API_ROUTES.md`.  
Os endpoints são consumidos via `api.ts` (Axios) e sincronizados com o SQLite local.

---

## 🔒 11. Considerações Finais

- O app deve funcionar **100% offline** para operações básicas.
    
- A sincronização nunca sobrescreve dados sem confirmação.
    
- As regras de rateio e reconciliação seguem a mesma lógica do backend.
    
- O design mantém coerência visual e semântica com o web app.