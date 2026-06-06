# Estrutura do Banco de Dados (PostgreSQL / Supabase)

## 💾 Visão Geral

O banco de dados utiliza **PostgreSQL** hospedado no **Supabase**, aproveitando sua estrutura SQL robusta, suporte a **JSONB**, e plano gratuito para desenvolvimento.

O modelo é **relacional**, garantindo consistência em operações financeiras, mas flexível o suficiente para permitir extensões futuras (ex: budgets e metas).

---

## 🧱 Tabelas Principais

### 1. `users`

Representa cada pessoa que utiliza o sistema (ex.: Murillo e parceira).

|Campo|Tipo|Descrição|
|---|---|---|
|`id`|SERIAL PRIMARY KEY|Identificador único do usuário|
|`name`|VARCHAR(100)|Nome completo|
|`email`|VARCHAR(150) UNIQUE NOT NULL|Email de login|
|`password_hash`|TEXT|Senha criptografada com bcrypt|
|`created_at`|TIMESTAMP DEFAULT NOW()|Data de criação|
|`updated_at`|TIMESTAMP DEFAULT NOW()|Última atualização|

---

### 2. `households`

Grupos de controle compartilhado (ex.: casal ou família).

|Campo|Tipo|Descrição|
|---|---|---|
|`id`|SERIAL PRIMARY KEY|Identificador do grupo|
|`name`|VARCHAR(100)|Nome do grupo (ex.: “Murillo & Parceira”)|
|`currency`|CHAR(3) DEFAULT 'BRL'|Moeda padrão|
|`default_split_type`|ENUM('equal','percent','fixed')|Tipo padrão de divisão de gastos|
|`created_at`|TIMESTAMP DEFAULT NOW()|Data de criação|
|`updated_at`|TIMESTAMP DEFAULT NOW()|Atualização|

---

### 3. `household_members`

Relaciona usuários a um grupo e define suas permissões e percentuais.

|Campo|Tipo|Descrição|
|---|---|---|
|`id`|SERIAL PRIMARY KEY|Identificador|
|`household_id`|INT REFERENCES households(id) ON DELETE CASCADE|Grupo|
|`user_id`|INT REFERENCES users(id) ON DELETE CASCADE|Usuário vinculado|
|`role`|ENUM('owner','member') DEFAULT 'member'|Permissão no grupo|
|`split_value`|NUMERIC(10,2) DEFAULT 0|Percentual ou valor fixo de participação|

---

### 4. `accounts`

Contas financeiras controladas pelo casal.

|Campo|Tipo|Descrição|
|---|---|---|
|`id`|SERIAL PRIMARY KEY|Identificador|
|`household_id`|INT REFERENCES households(id)|Dono da conta|
|`user_id`|INT REFERENCES users(id) ON DELETE SET NULL|Titular/Responsável principal da conta (Opcional/Nullable)|
|`name`|VARCHAR(100)|Nome da conta (ex.: "Nubank Crédito")|
|`type`|ENUM('checking','savings','credit','cash','investment')|Tipo da conta|
|`institution`|VARCHAR(100)|Banco ou instituição|
|`balance_manual`|NUMERIC(12,2) DEFAULT 0|Saldo manual inicial|
|`created_at`|TIMESTAMP DEFAULT NOW()|Data de criação|
|`updated_at`|TIMESTAMP DEFAULT NOW()|Atualização|

---

### 5. `categories`

Classificação de receitas e despesas.

|Campo|Tipo|Descrição|
|---|---|---|
|`id`|SERIAL PRIMARY KEY|Identificador|
|`household_id`|INT REFERENCES households(id)|Grupo associado|
|`parent_id`|INT REFERENCES categories(id)|Categoria pai|
|`name`|VARCHAR(100)|Nome|
|`kind`|ENUM('expense','income','transfer')|Tipo de categoria|
|`is_fixed`|BOOLEAN DEFAULT FALSE|Indica se é despesa fixa|
|`created_at`|TIMESTAMP DEFAULT NOW()|Criação|
|`updated_at`|TIMESTAMP DEFAULT NOW()|Atualização|

---

### 6. `payees`

Entidades ou pessoas envolvidas em pagamentos ou recebimentos.

|Campo|Tipo|Descrição|
|---|---|---|
|`id`|SERIAL PRIMARY KEY|Identificador|
|`household_id`|INT REFERENCES households(id)|Grupo associado|
|`name`|VARCHAR(120)|Nome do favorecido|
|`default_category_id`|INT REFERENCES categories(id)|Categoria sugerida|
|`regex_rule`|TEXT|Expressão usada para auto-categorização na importação|
|`created_at`|TIMESTAMP DEFAULT NOW()|Criação|
|`updated_at`|TIMESTAMP DEFAULT NOW()|Atualização|

---

### 7. `transactions`

Coração do sistema – cada registro financeiro, seja despesa, receita ou transferência.

|Campo|Tipo|Descrição|
|---|---|---|
|`id`|SERIAL PRIMARY KEY|Identificador|
|`household_id`|INT REFERENCES households(id)|Grupo|
|`account_id`|INT REFERENCES accounts(id)|Conta de origem|
|`payee_id`|INT REFERENCES payees(id)|Favorecido (opcional)|
|`category_id`|INT REFERENCES categories(id)|Categoria|
|`type`|ENUM('expense','income','transfer')|Tipo de operação|
|`amount`|NUMERIC(12,2) NOT NULL|Valor monetário|
|`description`|TEXT|Observação ou resumo|
|`date`|DATE NOT NULL|Data da transação|
|`status`|ENUM('draft','cleared','reconciled') DEFAULT 'cleared'|Estado atual|
|`transfer_to_id`|INT REFERENCES accounts(id)|Conta destino (para transferências)|
|`transfer_link_id`|INT REFERENCES transactions(id)|Transação espelho|
|`metadata`|JSONB|Dados auxiliares (ex.: hash de importação)|
|`created_by`|INT REFERENCES users(id)|Usuário criador|
|`created_at`|TIMESTAMP DEFAULT NOW()|Criação|
|`updated_at`|TIMESTAMP DEFAULT NOW()|Atualização|

---

### 8. `transaction_splits`

Rateio detalhado por usuário em uma transação.

| Campo            | Tipo                                              | Descrição                       |
| ---------------- | ------------------------------------------------- | ------------------------------- |
| `id`             | SERIAL PRIMARY KEY                                | Identificador                   |
| `transaction_id` | INT REFERENCES transactions(id) ON DELETE CASCADE | Transação associada             |
| `user_id`        | INT REFERENCES users(id)                          | Pessoa associada                |
| `share`          | NUMERIC(12,2)                                     | Valor ou percentual             |
| `category_id`    | INT REFERENCES categories(id)                     | Categoria específica (opcional) |