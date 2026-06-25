# API Routes — WeFinance

## Convenções Gerais

- Base URL: `http://localhost:PORT/api/v1`
- Todas as rotas autenticadas exigem: `Authorization: Bearer <JWT_TOKEN>`
- Respostas em JSON com campos em **camelCase**
- Rotas escopadas por `householdId` — cada membro só acessa dados do seu grupo
- Documentação interativa disponível em `/docs` (Swagger)

---

## 1. Auth (`/auth`)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/register` | Cria novo usuário |
| `POST` | `/auth/login` | Retorna access + refresh token |
| `POST` | `/auth/refresh` | Renova access token |
| `GET` | `/auth/me` | Dados do usuário autenticado |

**POST /auth/register**
```json
{ "name": "string", "email": "string", "password": "string" }
```

**POST /auth/login**
```json
{ "email": "string", "password": "string" }
```

---

## 2. Users (`/users`)

| Método | Rota | Descrição | Permissão |
|---|---|---|---|
| `GET` | `/users` | Lista usuários (com filtros) | Admin |
| `POST` | `/users` | Cria usuário | Admin |
| `GET` | `/users/me` | Perfil do usuário logado | Autenticado |
| `POST` | `/users/me/avatar` | Upload de foto de perfil (Cloudinary) | Autenticado |
| `GET` | `/users/:id` | Perfil por ID | Admin ou próprio |
| `PATCH` | `/users/:id` | Atualiza perfil | Admin ou próprio |
| `DELETE` | `/users/:id` | Remove usuário | Admin |

**POST /users/me/avatar** — `multipart/form-data`
- Campo: `file` (JPEG, PNG ou WebP, máx 2MB)
- Retorna `UserResponseDto` com `avatarUrl` preenchido

**PATCH /users/:id** — campos editáveis pelo próprio usuário:
```json
{ "name": "string", "email": "string", "password": "string", "birthDate": "YYYY-MM-DD", "phoneNumber": "string" }
```

> `role` e `isActive` são restritos a admin.

---

## 3. Households (`/households`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/households` | Lista grupos do usuário autenticado |
| `POST` | `/households` | Cria novo grupo |
| `GET` | `/households/:id` | Detalhes do grupo |
| `PATCH` | `/households/:id` | Atualiza grupo (owner) |
| `DELETE` | `/households/:id` | Remove grupo (owner) |

### Membros (`/households/:id/members`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/households/:id/members` | Lista membros |
| `POST` | `/households/:id/members` | Adiciona membro |
| `DELETE` | `/households/:id/members/:memberId` | Remove membro (owner) |
| `POST` | `/households/:id/join` | Entra no grupo via invite code |

---

## 4. Accounts (`/households/:id/accounts`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/households/:id/accounts` | Lista contas |
| `POST` | `/households/:id/accounts` | Cria conta |
| `GET` | `/households/:id/accounts/:accountId` | Detalhes |
| `PATCH` | `/households/:id/accounts/:accountId` | Atualiza |
| `DELETE` | `/households/:id/accounts/:accountId` | Remove |

**POST body:**
```json
{
  "name": "string",
  "type": "checking | savings | credit | cash | investment",
  "institution": "string (opcional)",
  "balanceManual": 0,
  "color": "#hexcolor (opcional)"
}
```

> `balanceManual` é o saldo inicial. A partir daí, o sistema o mantém automaticamente a cada transação.

---

## 5. Categories (`/households/:id/categories`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/households/:id/categories` | Lista categorias |
| `POST` | `/households/:id/categories` | Cria categoria |
| `PATCH` | `/households/:id/categories/:categoryId` | Atualiza |
| `DELETE` | `/households/:id/categories/:categoryId` | Remove |

**POST body:**
```json
{
  "name": "string",
  "kind": "expense | income | transfer",
  "parentId": "uuid (opcional)",
  "isFixed": false,
  "color": "#hexcolor (opcional)"
}
```

> `isFixed = true` é bloqueado se a categoria estiver vinculada exclusivamente a assinaturas de receita.

---

## 6. Payees (`/households/:id/payees`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/households/:id/payees` | Lista favorecidos |
| `POST` | `/households/:id/payees` | Cria favorecido |
| `GET` | `/households/:id/payees/:payeeId` | Detalhes |
| `PATCH` | `/households/:id/payees/:payeeId` | Atualiza |
| `DELETE` | `/households/:id/payees/:payeeId` | Remove |

---

## 7. Transactions (`/households/:id/transactions`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/households/:id/transactions` | Lista paginada (com filtros) |
| `POST` | `/households/:id/transactions` | Cria transação |
| `GET` | `/households/:id/transactions/:txId` | Detalhes |
| `PATCH` | `/households/:id/transactions/:txId` | Atualiza (se não reconciliada) |
| `DELETE` | `/households/:id/transactions/:txId` | Remove |
| `POST` | `/households/:id/transactions/:txId/reconcile` | Reconcilia |

### Filtros disponíveis
```
?month=2026-06&type=expense&accountId=uuid&categoryId=uuid&status=cleared&order=desc&page=1&limit=20
```

### Resposta de transação inclui:
```json
{
  "id": "uuid",
  "type": "expense",
  "amount": 150.00,
  "owner": { "id": "uuid", "name": "Murillo", "avatarUrl": "https://..." },
  "splitPreview": {
    "totalMembers": 3,
    "members": [
      { "id": "uuid", "name": "Ana", "avatarUrl": null }
    ]
  },
  "splits": [...]
}
```

### Relatórios de Dashboard

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/households/:id/transactions/report/personal-summary` | Resumo pessoal do mês |
| `GET` | `/households/:id/transactions/report/category-breakdown` | Gastos por categoria |
| `GET` | `/households/:id/transactions/report/daily-summary` | Evolução diária (calendário) |

**personal-summary** — query: `?month=2026-06`
```json
{
  "month": "2026-06",
  "totalIncome": 5000,
  "totalExpenses": 1800,
  "balance": 3200,
  "transactionCount": 14,
  "totalAccountsBalance": 12500
}
```

**category-breakdown** — query: `?month=2026-06&scope=household|personal`
```json
{
  "month": "2026-06",
  "scope": "household",
  "totalExpenses": 3200,
  "categories": [
    { "categoryId": "uuid", "categoryName": "Alimentação", "amount": 800, "percentage": 25, "isFixed": false, "color": "#ff6b6b" }
  ]
}
```

**daily-summary** — query: `?month=2026-06`
```json
{
  "month": "2026-06",
  "days": [
    { "date": "2026-06-01", "income": 5000, "expenses": 0, "balance": 5000, "runningBalance": 5000, "transactionCount": 1 }
  ]
}
```

---

## 8. Transaction Splits (`/households/:id/transactions/:txId/splits`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `.../splits` | Lista todos os splits |
| `PUT` | `.../splits` | Substitui todos os splits |
| `PATCH` | `.../splits/:splitId` | Atualiza split individual |
| `DELETE` | `.../splits/:splitId` | Remove split |

---

## 9. Subscriptions (`/households/:id/subscriptions`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/households/:id/subscriptions` | Lista assinaturas |
| `POST` | `/households/:id/subscriptions` | Cria assinatura |
| `GET` | `/households/:id/subscriptions/:subId` | Detalhes |
| `PATCH` | `/households/:id/subscriptions/:subId` | Atualiza |
| `DELETE` | `/households/:id/subscriptions/:subId` | Remove |
| `POST` | `/households/:id/subscriptions/:subId/run` | Execução manual |

**POST body:**
```json
{
  "name": "Netflix",
  "type": "expense | income",
  "amount": 39.90,
  "accountId": "uuid",
  "categoryId": "uuid (opcional)",
  "cadenceUnit": "day | week | month | year",
  "cadenceEvery": 1,
  "nextRunAt": "2026-07-01",
  "active": true
}
```

> `type = 'income'` permite receitas fixas recorrentes (ex: salário). O cron diário gera automaticamente a transação e atualiza o saldo da conta.

---

## 10. Imports (`/households/:id/imports`)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/households/:id/imports/csv` | Envia CSV para importação |
| `GET` | `/households/:id/imports/history` | Histórico de importações |

**Resposta do CSV:**
```json
{ "imported": 42, "duplicates": 3, "errors": 1 }
```

---

## 11. Events (`/households/:id/events`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/households/:id/events` | Lista eventos de auditoria |
| `GET` | `/households/:id/events/:entity/:entityId` | Eventos de entidade específica |

---

## 12. Insights (`/households/:id/insights`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/households/:id/insights` | Lista insights financeiros automáticos |

---

## Segurança

- JWT obrigatório em todas as rotas exceto `/auth`
- Todas as operações são escopadas por `householdId`
- `owner` pode adicionar/remover membros e contas
- Transações reconciliadas são imutáveis
- Upload de avatar: máx 2MB, JPEG/PNG/WebP
