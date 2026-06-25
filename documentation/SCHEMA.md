# Schema do Banco de Dados — WeFinance

> PostgreSQL via Supabase. ORM: Drizzle. Todos os IDs são UUID.

---

## Enums

```sql
user_role:           admin | member
household_role:      owner | member
split_type:          equal | percent
account_type:        checking | savings | credit | cash | investment
category_kind:       expense | income | transfer
cadence_unit:        day | week | month | year
subscription_type:   expense | income
transaction_type:    income | expense | transfer
transaction_status:  draft | cleared | reconciled
event_action:        create | update | delete | reconcile | import | generate
```

---

## Tabelas

### `users`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `email` | VARCHAR(255) UNIQUE NOT NULL | Login |
| `password` | VARCHAR(255) NOT NULL | Hash bcrypt |
| `name` | VARCHAR(255) NOT NULL | Nome completo |
| `role` | user_role DEFAULT 'member' | Papel global |
| `birth_date` | DATE | Data de nascimento |
| `phone_number` | VARCHAR(30) | Telefone |
| `is_active` | BOOLEAN DEFAULT true | Conta ativa |
| `avatar_url` | TEXT | URL do avatar no Cloudinary |
| `created_at` | TIMESTAMP | Criação |
| `updated_at` | TIMESTAMP | Atualização |

---

### `households`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `name` | VARCHAR(100) NOT NULL | Nome do grupo |
| `currency` | VARCHAR(3) DEFAULT 'BRL' | Moeda |
| `default_split_type` | split_type DEFAULT 'equal' | Divisão padrão |
| `color` | VARCHAR(20) | Cor de identificação visual |
| `invite_code` | VARCHAR(12) UNIQUE | Código de convite |
| `created_at` | TIMESTAMP | Criação |
| `updated_at` | TIMESTAMP | Atualização |

---

### `household_members`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `household_id` | UUID FK households | Grupo |
| `user_id` | UUID FK users | Membro |
| `role` | household_role DEFAULT 'member' | Permissão |
| `split_value` | DECIMAL(10,2) DEFAULT 0 | Valor/percentual de participação |
| `joined_at` | TIMESTAMP | Data de entrada |

---

### `accounts`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `household_id` | UUID FK households | Grupo |
| `user_id` | UUID FK users NULLABLE | Titular (opcional) |
| `name` | VARCHAR(100) NOT NULL | Nome da conta |
| `type` | account_type NOT NULL | Tipo |
| `institution` | VARCHAR(100) | Banco / instituição |
| `balance_manual` | DECIMAL(12,2) DEFAULT 0 | **Saldo automático** (atualizado a cada transação) |
| `color` | VARCHAR(20) | Cor de identificação visual |
| `created_at` | TIMESTAMP | Criação |
| `updated_at` | TIMESTAMP | Atualização |

> `balance_manual` é mantido automaticamente pelo sistema a cada `create`, `update` e `delete` de transação.

---

### `categories`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `household_id` | UUID FK households | Grupo |
| `parent_id` | UUID FK categories NULLABLE | Categoria pai (hierarquia) |
| `name` | VARCHAR(100) NOT NULL | Nome |
| `kind` | category_kind NOT NULL | Tipo (expense/income/transfer) |
| `is_fixed` | BOOLEAN DEFAULT false | Despesa fixa (para análise fixo vs variável) |
| `color` | VARCHAR(20) | Cor de identificação visual |
| `created_at` | TIMESTAMP | Criação |
| `updated_at` | TIMESTAMP | Atualização |

> `is_fixed = true` é bloqueado pelo sistema se a categoria pertence exclusivamente a assinaturas de receita (`subscription.type = 'income'`).

---

### `payees`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `household_id` | UUID FK households | Grupo |
| `default_category_id` | UUID FK categories NULLABLE | Categoria sugerida |
| `name` | VARCHAR(120) NOT NULL | Nome do favorecido |
| `regex_rule` | TEXT | Regra regex para auto-categorização na importação CSV |
| `created_at` | TIMESTAMP | Criação |
| `updated_at` | TIMESTAMP | Atualização |

---

### `transactions`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `household_id` | UUID FK households | Grupo |
| `account_id` | UUID FK accounts | Conta de origem |
| `payee_id` | UUID FK payees NULLABLE | Favorecido |
| `category_id` | UUID FK categories NULLABLE | Categoria |
| `type` | transaction_type NOT NULL | Tipo da operação |
| `amount` | DECIMAL(12,2) NOT NULL | Valor |
| `description` | TEXT | Descrição livre |
| `date` | DATE NOT NULL | Data da transação |
| `status` | transaction_status DEFAULT 'cleared' | Estado |
| `transfer_to_id` | UUID FK accounts NULLABLE | Conta destino (transferências) |
| `transfer_link_id` | UUID FK transactions NULLABLE | Transação espelho |
| `metadata` | JSONB | Dados auxiliares (ex: hash CSV) |
| `created_by_id` | UUID FK users | Criador |
| `created_at` | TIMESTAMP | Criação |
| `updated_at` | TIMESTAMP | Atualização |

---

### `transaction_splits`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `transaction_id` | UUID FK transactions CASCADE | Transação |
| `user_id` | UUID FK users | Membro participante |
| `share` | DECIMAL(12,2) NOT NULL | Valor absoluto do rateio |
| `category_id` | UUID FK categories NULLABLE | Categoria específica do participante |

---

### `subscriptions`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `household_id` | UUID FK households | Grupo |
| `account_id` | UUID FK accounts | Conta de débito/crédito |
| `category_id` | UUID FK categories NULLABLE | Categoria |
| `name` | VARCHAR(100) NOT NULL | Nome (ex: "Netflix", "Salário") |
| `amount` | DECIMAL(12,2) NOT NULL | Valor |
| `type` | subscription_type DEFAULT 'expense' | **Despesa ou Receita** |
| `cadence_unit` | cadence_unit NOT NULL | Unidade de cadência |
| `cadence_every` | INTEGER DEFAULT 1 | Intervalo da cadência |
| `next_run_at` | DATE NOT NULL | Próxima execução |
| `active` | BOOLEAN DEFAULT true | Se está ativa |
| `created_at` | TIMESTAMP | Criação |
| `updated_at` | TIMESTAMP | Atualização |

> `type = 'income'` permite cadastrar receitas fixas (ex: salário mensal). O cron gera automaticamente a transação de receita.

---

### `events`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `household_id` | UUID FK households | Grupo |
| `entity` | VARCHAR(50) | Nome da entidade |
| `entity_id` | UUID | ID da entidade |
| `action` | event_action | Ação executada |
| `data` | JSONB | Dados do snapshot |
| `user_id` | UUID FK users NULLABLE | Usuário responsável |
| `occurred_at` | TIMESTAMP | Momento do evento |

---

### `import_sessions`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador |
| `household_id` | UUID FK households | Grupo |
| `account_id` | UUID FK accounts | Conta alvo |
| `filename` | VARCHAR(255) | Nome do arquivo |
| `imported_count` | INTEGER DEFAULT 0 | Transações importadas |
| `duplicate_count` | INTEGER DEFAULT 0 | Duplicatas ignoradas |
| `error_count` | INTEGER DEFAULT 0 | Erros |
| `created_by_id` | UUID FK users | Usuário |
| `created_at` | TIMESTAMP | Criação |

---

## Migrations

Gerenciadas via **Drizzle Kit**:

```bash
cd server
npm run db:generate   # gera migration a partir do schema.ts
npm run db:migrate    # aplica no banco
npm run db:studio     # UI visual do banco
```

Migrations geradas ficam em `server/drizzle/migrations/`.
