# Regras de Negócio — WeFinance

## 1. Rateio de Transações (Splits)

- Cada transação pode ter splits em `transaction_splits`, onde cada linha representa a participação de um membro.
- **Soma dos shares deve ser igual ao valor total da transação.** Diferenças de centavo por arredondamento são absorvidas automaticamente no último membro da lista.
- Transferências não suportam splits.
- Transações reconciliadas não podem ter splits alterados.
- Na resposta de `GET /transactions`, o campo `splitPreview` traz os **3 primeiros membros** com nome e avatar + `totalMembers` — útil para exibição de avatares empilhados no front-end.

---

## 2. Transferências Espelhadas

- `type = 'transfer'` sempre cria **dois registros** vinculados por `transferLinkId`.
- A conta de origem (`accountId`) é debitada; a conta destino (`transfer.toAccountId`) é creditada.
- Ambas as legs têm `transferLinkId` apontando uma para a outra.
- Atualização de valor ou data propaga para a leg espelho automaticamente.
- `status` inicial é `cleared`.

---

## 3. Saldo Automático de Contas

`accounts.balanceManual` é mantido automaticamente pelo sistema — **nunca** edite diretamente.

| Evento | Efeito no saldo |
|---|---|
| `create` (expense) | `balance -= amount` |
| `create` (income) | `balance += amount` |
| `create` (transfer) | origem `-= amount`, destino `+= amount` |
| `update` | reverte o efeito antigo, aplica o novo |
| `delete` | reverte o efeito da transação removida |
| Cron subscription | atualiza o saldo da conta ao gerar a transação |

---

## 4. Reconciliação

- Transações reconciliadas (`status = 'reconciled'`) são **imutáveis** — não podem ser editadas nem ter splits alterados.
- Apenas `owner` pode reconciliar via `POST /transactions/:txId/reconcile`.
- Toda reconciliação gera um evento `action = 'reconcile'` em `events`.

---

## 5. Assinaturas e Recorrências

- Cada assinatura define `type` (`expense` ou `income`), valor, cadência e `nextRunAt`.
- **Cron diário** (meia-noite UTC): busca todas as assinaturas `active = true` com `nextRunAt <= hoje`, gera a transação e avança `nextRunAt` pela cadência.
- O saldo da conta é atualizado automaticamente junto com a geração da transação.
- `type = 'income'` permite receitas fixas recorrentes (ex: salário mensal).
- Assinaturas podem ser executadas manualmente via `POST /subscriptions/:id/run`.
- `active = false` pausa sem deletar.

**Cálculo do próximo `nextRunAt`:**
```
cadenceUnit = 'month', cadenceEvery = 1:
  nextRunAt = nextRunAt + 1 mês (UTC)
```

---

## 6. Validação de `isFixed` em Categorias

- `categories.isFixed = true` indica **despesa fixa** — usada em análises de fixo vs variável.
- O sistema **bloqueia** marcar `isFixed = true` se a categoria estiver vinculada exclusivamente a assinaturas de receita (`subscription.type = 'income'`).
- Motivo: `isFixed` só faz sentido semântico para despesas fixas; misturar com receitas gera inconsistência nos relatórios de análise.

---

## 7. Upload de Avatar

- Endpoint: `POST /users/me/avatar` (multipart/form-data, campo `file`)
- Formatos aceitos: JPEG, PNG, WebP
- Tamanho máximo: 2MB
- Armazenado no Cloudinary em `{CLOUDINARY_ROOT_FOLDER}/avatars/{userId}`
- A imagem é recortada para 256×256 com `crop: fill, gravity: face`
- Enviar um novo arquivo **sobrescreve** o anterior (mesmo `publicId`)

---

## 8. Relatórios de Dashboard

### personal-summary
Cálculo por mês (`YYYY-MM`):
- `totalIncome` = soma das transações `income` do usuário + participações em splits
- `totalExpenses` = soma das transações `expense` + splits
- `balance` = fluxo de caixa do mês (income - expenses), **não** é o saldo da conta
- `totalAccountsBalance` = soma atual de `accounts.balanceManual` do grupo

### category-breakdown
- `scope = 'household'`: despesas de todas as transações do grupo
- `scope = 'personal'`: apenas transações do usuário logado + shares nos splits
- Percentual de cada categoria calculado sobre `totalExpenses`

### daily-summary
- Retorna um array de dias do mês
- `runningBalance` é acumulativo: começa em 0 no dia 1 e soma/subtrai dia a dia
- Dias sem transações ainda aparecem no array (com valores zerados)

---

## 9. Auditoria (Events)

Toda alteração relevante gera um registro em `events`:

| Ação | Quando |
|---|---|
| `create` | Criação de transação, conta, categoria, assinatura |
| `update` | Edição de qualquer entidade |
| `delete` | Remoção |
| `reconcile` | Transação marcada como reconciliada |
| `import` | Transação criada via CSV |
| `generate` | Transação gerada automaticamente por assinatura |

---

## 10. Importação CSV

- Deduplicação por `md5(date + description + amount)` armazenado em `metadata.hash`
- Payees com `regexRule` são aplicados linha a linha para auto-categorização
- Cada importação gera um registro em `import_sessions` com contadores de sucesso, duplicatas e erros

---

## 11. Permissões por Role

| Ação | owner | member |
|---|---|---|
| Criar/editar assinaturas | ✅ | ❌ |
| Adicionar/remover membros | ✅ | ❌ |
| Criar/editar contas | ✅ | ❌ |
| Reconciliar transações | ✅ | ❌ |
| Criar/editar transações | ✅ | ✅ |
| Visualizar tudo | ✅ | ✅ |
| Editar próprio perfil | ✅ | ✅ |

> Um `member` pode editar seu próprio perfil (name, email, password, birthDate, phoneNumber) mas não pode alterar `role` ou `isActive`.
