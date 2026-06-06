# Regras de Negócio

## 🎯 Objetivo

Documentar as **regras determinísticas** do sistema _Finanças a Dois_, garantindo previsibilidade nos cálculos, segurança nas transações e coerência entre dados pessoais e compartilhados.

O foco inicial é cobrir as regras fundamentais para o MVP:

- **Rateio de transações** entre usuários;
    
- **Criação e vinculação de transferências espelhadas**;
    
- **Reconciliação** (fechamento de lançamentos);
    
- **Assinaturas e recorrências**;
    
- **Importação de CSVs** com categorização automática;
    
- **Auditoria e histórico (events)**.
    

---

## 🧾 1. Rateio de Transações

### Contexto

Cada transação pode ser **pessoal** ou **compartilhada**. No caso de compartilhada, o valor é dividido entre os membros de um mesmo `household`.

### Regras

1. **Tipos de rateio suportados**
    
    - `equal` → divisão igualitária (ex.: 50/50);
        
    - `percent` → divisão por percentual definido por usuário;
        
    - `fixed` → valores fixos atribuídos individualmente.
        
2. **Cálculo geral**
    
    ```text
    Soma dos shares = valor total da transação.
    ```
    
    Caso haja diferença por arredondamento, o sistema ajusta automaticamente no último membro da lista.
    
3. **Armazenamento**
    
    - Cada divisão gera um registro em `transaction_splits`.
        
    - O campo `share` indica o valor absoluto (positivo ou negativo) de cada participante.
        
4. **Visibilidade**
    
    - Cada membro visualiza o total consolidado de suas transações pessoais + compartilhadas.
        
    - O total do casal é a soma de todos os `shares` do grupo.
        

---

## 🔁 2. Transferências Espelhadas

### Contexto

Transferências movem valores entre **duas contas do mesmo grupo** (ex.: Conta Corrente → Cartão de Crédito).

### Regras

1. Sempre que uma transação for criada com `type = 'transfer'`, o sistema:
    
    - Cria **dois lançamentos**: um de saída e um de entrada;
        
    - O segundo lançamento (entrada) é o **espelho** do primeiro;
        
    - Ambos ficam vinculados por `transfer_link_id`.
        
2. Exemplo:
    
    ```text
    Conta A (-500) → Conta B (+500)
    Ambos possuem transfer_link_id recíproco.
    ```
    
3. Transferências **não geram splits**, pois pertencem ao grupo como um todo.
    
4. O status inicial padrão é `cleared` (conciliado internamente).
    

---

## ⏱️ 3. Reconciliação de Transações

### Contexto

A reconciliação indica que uma transação foi confirmada ou ajustada de forma definitiva.

### Regras

1. Quando `status` muda para `reconciled`:
    
    - A transação torna-se **imutável** (não pode ser editada diretamente);
        
    - Qualquer correção gera um **novo evento de ajuste** na tabela `events`.
        
2. Ajustes são armazenados como:
    
    ```json
    {
      "entity": "transaction",
      "entity_id": 102,
      "action": "update",
      "data": { "amount": 55.00, "note": "Ajuste de arredondamento" },
      "user_id": 3,
      "at": "2025-10-13T22:15:00Z"
    }
    ```
    
3. Logs de reconciliação podem ser visualizados no histórico da transação.
    

---

## 🔁 4. Assinaturas e Recorrências

### Contexto

Assinaturas (ou _subscriptions_) automatizam o lançamento de transações fixas (ex.: Netflix, academia, aluguel).

### Regras

1. Cada registro em `subscriptions` define:
    
    - Valor (`amount`);
        
    - Categoria (`category_id`);
        
    - Frequência (`cadence_unit`, `cadence_every`);
        
    - Próxima execução (`next_run_at`).
        
2. O **agendador (cron)** executa diariamente e:
    
    - Gera uma nova transação `expense` na data de `next_run_at`;
        
    - Atualiza `next_run_at` conforme o intervalo configurado;
        
    - Registra um evento `action = 'generate'` em `events`.
        
3. Exemplo:
    
    ```text
    Netflix (R$39,90 / mês)
    next_run_at = 2025-10-15 → próxima = 2025-11-15
    ```
    
4. Se `active = false`, a assinatura é ignorada pelo agendador.
    

---

## 📥 5. Importação CSV

### Contexto

Permite importar lançamentos em lote de planilhas bancárias ou exportações de aplicativos.

### Regras

1. O arquivo deve conter colunas padrão:
    
    ```csv
    date, description, amount, account, category
    ```
    
2. O sistema valida duplicatas por **hash do conteúdo** (`md5(date+description+amount)`), armazenado em `metadata.hash`.
    
3. Pode usar **regras de payee**:
    
    - Regex em `payees.regex_rule` para autoidentificar o favorecido e categoria.
        
4. Cada linha importada gera:
    
    - Uma transação (`transactions`);
        
    - Um evento `import` em `events`;
        
    - Se o hash já existir → ignora ou marca como duplicada.
        

---

## 🧮 6. Cálculo de Relatórios

### Contexto

Relatórios resumem as finanças mensais e por categoria.

### Regras base:

1. **Saldo mensal**
    
    ```sql
    SUM(CASE WHEN type='income' THEN amount ELSE -amount END)
    ```
    
2. **Top categorias (despesa)**
    
    ```sql
    SELECT category_id, SUM(amount) AS total
    FROM transactions
    WHERE type='expense'
    GROUP BY category_id
    ORDER BY total DESC LIMIT 5;
    ```
    
3. **Total por pessoa (rateio)**
    
    ```sql
    SELECT user_id, SUM(share) FROM transaction_splits GROUP BY user_id;
    ```
    

_(Regras de budgets e metas serão incluídas na Fase 2)_

---

## 🧾 7. Auditoria (Events)

### Contexto

Tudo o que altera dados críticos é logado em `events`, mantendo integridade e rastreabilidade.

### Ações registradas:

- `create` → criação de transações, contas, assinaturas;
    
- `update` → edição após reconciliação (gera novo evento, sem alterar original);
    
- `delete` → exclusão lógica (soft delete futuro);
    
- `reconcile` → marca uma transação como confirmada;
    
- `import` → transações importadas via CSV.
    

Cada evento armazena:

```json
{
  "entity": "transaction",
  "entity_id": 301,
  "action": "reconcile",
  "data": { "status": "reconciled" },
  "user_id": 1,
  "at": "2025-10-13T21:20:00Z"
}
```

---

## 🔒 8. Regras de Segurança e Permissão

- Toda ação é escopada pelo `household_id`.
    
- Um `member` só pode manipular dados do seu grupo.
    
- Apenas `owner` pode editar membros e contas.
    
- A reconciliação é irreversível, exigindo permissão de `owner`.
    
- O sistema valida integridade referencial antes de cada operação (ex.: excluir categoria só se não tiver transações ativas).
    

---

## ⚙️ 9. Execuções Automáticas

- **Cron diário**: processa assinaturas e atualiza `next_run_at`.
    
- **Cron de reconciliação (opcional)**: marca automaticamente lançamentos importados após X dias como reconciliados.
    
- **Trigger SQL** (futuro): atualizar `updated_at` automaticamente.
    

---

## 🧭 Próximos Passos

1. Implementar os serviços correspondentes em NestJS (Transactions, Subscriptions e Imports).
    
2. Adicionar os testes unitários para:
    
    - Rateio somando ao valor total;
        
    - Transferências espelhadas consistentes;
        
    - Geração automática de assinaturas.
        
3. Integrar auditoria (`events`) nos módulos core.
    
4. Atualizar o `API_ROUTES.md` com endpoints REST baseados nessas regras.