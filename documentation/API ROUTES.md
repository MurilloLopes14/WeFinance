# Finanças a Dois

## 🌍 Convenções Gerais

- Todas as rotas seguem o padrão **resource-oriented**:
    
    - `/households/:id/accounts` → obtém as contas de um grupo.
        
    - `/transactions/:id/reconcile` → executa uma ação específica sobre o recurso.
        
- Todas as respostas retornam objetos JSON com campos em **camelCase**.
    
- Rotas autenticadas exigem o header:
    
    `Authorization: Bearer <JWT_TOKEN>`
    

---

## 🔐 1. Autenticação (`/auth`)

|Método|Rota|Descrição|
|---|---|---|
|`POST`|`/auth/register`|Cria um novo usuário|
|`POST`|`/auth/login`|Retorna access e refresh token|
|`POST`|`/auth/refresh`|Atualiza o token de acesso|
|`GET`|`/auth/me`|Retorna dados do usuário autenticado|

### DTOs

`// POST /auth/register {   name: string;   email: string;   password: string; }  // POST /auth/login {   email: string;   password: string; }`

---

## 👥 2. Households (`/households`)

|Método|Rota|Descrição|
|---|---|---|
|`GET`|`/households`|Lista todos os grupos do usuário|
|`POST`|`/households`|Cria um novo grupo|
|`GET`|`/households/:id`|Detalhes de um grupo específico|
|`PATCH`|`/households/:id`|Atualiza informações básicas|
|`DELETE`|`/households/:id`|Exclui grupo (somente owner)|

### Membros (`/households/:id/members`)

|Método|Rota|Descrição|
|---|---|---|
|`GET`|`/households/:id/members`|Lista membros do grupo|
|`POST`|`/households/:id/members`|Adiciona um novo membro|
|`DELETE`|`/households/:id/members/:memberId`|Remove membro|

---

## 💰 3. Accounts (`/households/:id/accounts`)

|Método|Rota|Descrição|
|---|---|---|
|`GET`|`/households/:id/accounts`|Lista contas do grupo|
|`POST`|`/households/:id/accounts`|Cria nova conta|
|`GET`|`/households/:id/accounts/:accountId`|Detalhes de uma conta|
|`PATCH`|`/households/:id/accounts/:accountId`|Atualiza conta|
|`DELETE`|`/households/:id/accounts/:accountId`|Remove conta|

### DTO – Criação

`{   name: string;   type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';   institution?: string;   balanceManual?: number; }`

---

## 🏷️ 4. Categories (`/households/:id/categories`)

|Método|Rota|Descrição|
|---|---|---|
|`GET`|`/households/:id/categories`|Lista categorias do grupo|
|`POST`|`/households/:id/categories`|Cria categoria|
|`PATCH`|`/households/:id/categories/:categoryId`|Atualiza categoria|
|`DELETE`|`/households/:id/categories/:categoryId`|Remove categoria|

### DTO – Criação

`{   name: string;   kind: 'expense' | 'income' | 'transfer';   parentId?: number;   isFixed?: boolean; }`

---

## 🧾 5. Transactions (`/households/:id/transactions`)

|Método|Rota|Descrição|
|---|---|---|
|`GET`|`/households/:id/transactions`|Lista transações (com filtros)|
|`POST`|`/households/:id/transactions`|Cria nova transação|
|`GET`|`/households/:id/transactions/:txId`|Detalhes da transação|
|`PATCH`|`/households/:id/transactions/:txId`|Atualiza transação (se não reconciliada)|
|`DELETE`|`/households/:id/transactions/:txId`|Exclui transação|
|`POST`|`/households/:id/transactions/:txId/reconcile`|Marca transação como reconciliada|
|`GET`|`/households/:id/transactions/report/summary`|Resumo mensal e por categoria|

### Filtros

`GET /households/1/transactions?month=2025-10&type=expense&accountId=2`

### DTO – Criação

`{   accountId: number;   payeeId?: number;   categoryId?: number;   type: 'expense' | 'income' | 'transfer';   amount: number;   description?: string;   date: string; // ISO   split?: { userId: number; share: number; categoryId?: number }[];   transfer?: { toAccountId: number }; }`

---

## 🔁 6. Subscriptions (`/households/:id/subscriptions`)

|Método|Rota|Descrição|
|---|---|---|
|`GET`|`/households/:id/subscriptions`|Lista assinaturas|
|`POST`|`/households/:id/subscriptions`|Cria nova assinatura|
|`GET`|`/households/:id/subscriptions/:subId`|Detalhes de assinatura|
|`PATCH`|`/households/:id/subscriptions/:subId`|Atualiza assinatura|
|`DELETE`|`/households/:id/subscriptions/:subId`|Remove assinatura|
|`POST`|`/households/:id/subscriptions/:subId/run`|Força execução manual|

### DTO – Criação

`{   name: string;   amount: number;   categoryId: number;   accountId: number;   cadenceUnit: 'day' | 'week' | 'month' | 'year';   cadenceEvery?: number;   nextRunAt: string; }`

---

## 📦 7. Imports (`/households/:id/imports`)

|Método|Rota|Descrição|
|---|---|---|
|`POST`|`/households/:id/imports/csv`|Envia arquivo CSV|
|`GET`|`/households/:id/imports/history`|Lista importações anteriores|

### Regras

- O upload retorna estatísticas:
    
    `{ "imported": 42, "duplicates": 3, "errors": 1 }`
    
- Arquivos são processados linha a linha, aplicando regras de `payees.regex_rule`.
    

---

## 📊 8. Reports (`/households/:id/reports`)

|Método|Rota|Descrição|
|---|---|---|
|`GET`|`/households/:id/reports/summary`|Resumo geral do mês|
|`GET`|`/households/:id/reports/categories`|Gastos por categoria|
|`GET`|`/households/:id/reports/members`|Despesas por pessoa (via splits)|
|`GET`|`/households/:id/reports/cashflow`|Evolução de saldo mensal|

---

## 🧾 9. Events (`/households/:id/events`)

|Método|Rota|Descrição|
|---|---|---|
|`GET`|`/households/:id/events`|Lista eventos do grupo (auditoria)|
|`GET`|`/households/:id/events/:entity/:entityId`|Eventos de uma entidade específica|

---

## 🧩 10. Estrutura de Resposta Padrão

Todas as respostas seguem o padrão:

`{   "success": true,   "data": { ... },   "meta": { "page": 1, "limit": 20, "total": 83 } }`

Em caso de erro:

`{   "success": false,   "message": "Invalid credentials",   "statusCode": 401 }`

---

## 🔐 11. Segurança & Políticas

- JWT válido obrigatório para todas as rotas exceto `/auth`.
    
- Cada operação é escopada pelo `household_id`.
    
- Somente `owner` pode adicionar/remover membros e contas.
    
- Reconciliação e exclusão exigem confirmação via token válido.
    

---

## 🧭 Próximos Passos

1. Implementar controladores NestJS conforme rotas acima.
    
2. Criar DTOs e validações (Class Validator + Transform).
    
3. Adicionar documentação Swagger no backend.
    
4. Integrar React Query com endpoints de `transactions`, `subscriptions` e `reports`.