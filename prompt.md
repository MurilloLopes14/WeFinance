# WeFinance — Especificação Técnica (Backend ✅ | Frontend ⏳)

> **Documento vivo:** cada seção indica seu status atual.
> - ✅ **Implementado e testado**
> - ⚙️ **Implementado, pendente migração/revisão**
> - ⏳ **Próxima fase (frontend)**

---

## Parte 1 — Módulo de Insights ✅

> Backend 100% implementado. Pronto para consumo.

### Rota

```
GET /api/v1/households/:householdId/insights?month=YYYY-MM
```

### Resposta — `InsightsResponseDto`

```typescript
{
  month: string;        // "YYYY-MM"
  generatedAt: string;  // ISO 8601
  currency: string;     // moeda do household (ex: "BRL")
  insights: InsightDto[];
}

// InsightDto
{
  id: string;           // ex: "category_share:household:<categoryId>"
  rule: string;         // snake_case, ex: "category_share"
  scope: 'household' | 'personal';
  tone: 'neutral' | 'info' | 'success' | 'warning';
  title: string;
  message: string;      // frase completa em PT-BR
  priority: number;
  metadata: {
    categoryId?: string;
    categoryName?: string;
    percentage?: number;
    amount?: number;
    previousAmount?: number;
    delta?: number;
    deltaPercent?: number;
    currency?: string;
    subscriptionAmount?: number;
    commonAmount?: number;
    fixedAmount?: number;
    variableAmount?: number;
    balance?: number;
    sharedExpenseTotal?: number;
    personalSharePercent?: number;
    count?: number;
  };
}
```

### Regras implementadas (9 regras, cap de 8 no MVP)

| # | Regra | Escopo | Priority | Tone |
|---|-------|--------|----------|------|
| 1 | `category_share` | household + personal | 70 | info |
| 2 | `month_over_month_expense` | household + personal | 85 (warn) / 60 (success) | warning/success |
| 3 | `monthly_balance` | household + personal | 75 | success/warning |
| 4 | `subscription_vs_common` | household | 65 | warning |
| 5 | `fixed_vs_variable` | household | 55 | info |
| 6 | `top_category` | household + personal | 50 | neutral |
| 7 | `personal_shared_share` | personal | 80 | info |
| 8 | `savings_vs_last_month` | personal | 90 (success) / 40 (warn) | success/warning |
| 9 | `recurring_income` | household | 58 | info |

### Arquivos relevantes

| Arquivo | Responsabilidade |
|---------|-----------------|
| `server/src/insights/insights.service.ts` | Pipeline de regras, cap de 8, ordenação |
| `server/src/insights/insights-context.builder.ts` | Queries e pré-cálculo do contexto |
| `server/src/insights/rules/*.rule.ts` | 9 regras individuais |
| `server/src/insights/dto/insight-response.dto.ts` | DTOs de resposta |

---

## Parte 2 — Endpoints de Dashboard ⚙️

> Backend implementado. Requer `npm run api:update` no client para gerar hooks Orval.

Todos os endpoints ficam sob:

```
/api/v1/households/:householdId/transactions/report/
```

Autenticação: `Bearer JWT`. O usuário precisa ser membro do household.

---

### 2.1 — `GET report/summary`

**Status:** ✅ Existente

KPI do household (soma bruta de todas as transações do grupo).

```
GET /households/:id/transactions/report/summary?month=YYYY-MM
```

**Resposta — `TransactionSummaryResponseDto`:**
```typescript
{
  month: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}
```

---

### 2.2 — `GET report/personal-summary` ✅ NOVO

KPI pessoal do usuário autenticado, respeitando rateios via `transaction_splits`.

**Regra de cálculo:**
- Transações **com splits**: soma apenas o `share` do usuário (`transaction_splits.userId = requesterId`)
- Transações **sem splits**: soma integral, somente se `createdById = requesterId`
- Transferências são sempre ignoradas

```
GET /households/:id/transactions/report/personal-summary?month=YYYY-MM
```

**Resposta — `TransactionSummaryResponseDto`:**
```typescript
{
  month: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;  // splits + transações diretas do usuário
}
```

---

### 2.3 — `GET report/category-breakdown` ✅ NOVO

Breakdown de despesas por categoria. Suporta dois escopos via query param `scope`.

```
GET /households/:id/transactions/report/category-breakdown?month=YYYY-MM&scope=household|personal
```

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `month` | `YYYY-MM` | mês atual | Mês de referência |
| `scope` | `household` \| `personal` | `household` | Escopo dos dados |

**Escopo `household`:** agrupa todas as despesas do grupo por categoria.

**Escopo `personal`:** agrupa despesas usando mesma lógica do `personal-summary` (shares + diretas). A categoria efetiva é `split.categoryId ?? transaction.categoryId`.

**Resposta — `CategoryBreakdownResponseDto`:**
```typescript
{
  month: string;
  scope: 'household' | 'personal';
  totalExpenses: number;
  categories: Array<{
    categoryId: string | null;
    categoryName: string;       // "Sem categoria" se null
    amount: number;
    percentage: number;         // % do totalExpenses, 2 casas decimais
    isFixed: boolean;
    color: string | null;       // hex color da categoria
  }>;
}
```

Ordenado por `amount DESC`.

---

### 2.4 — `GET report/daily-summary` ✅ NOVO

Agregação diária de transações do household para o calendário financeiro.

```
GET /households/:id/transactions/report/daily-summary?month=YYYY-MM
```

**Resposta — `DailySummaryResponseDto`:**
```typescript
{
  month: string;
  days: Array<{
    date: string;           // "YYYY-MM-DD"
    income: number;
    expenses: number;
    balance: number;        // net do dia (income - expenses)
    runningBalance: number; // saldo acumulado desde o início do mês
    transactionCount: number;
  }>;
}
```

Apenas dias com movimentação são retornados (dias sem transação não aparecem no array). O front preenche os dias sem dados com zeros.

---

## Parte 3 — Pendências de Schema ⚙️

As seguintes colunas foram adicionadas ao schema mas a **migração Drizzle ainda precisa ser gerada e aplicada**:

```bash
# No diretório server/:
npx drizzle-kit generate
npx drizzle-kit migrate
```

Colunas adicionadas:
- `households.color` — `varchar(20)`
- `accounts.color` — `varchar(20)`
- `categories.color` — `varchar(20)`
- `subscriptions.type` — `enum('expense', 'income')`, default `'expense'`

Migração de referência gerada: `server/drizzle/migrations/0008_quick_runaways.sql`

---

## Parte 4 — Próximos Passos para o Frontend ⏳

> **Para o agente de frontend:** leia esta seção integralmente antes de começar. Ela contém todo o contexto de decisões de produto e a arquitetura de componentes esperada.

### 4.1 — Pré-requisito: gerar hooks Orval

```bash
cd client
npm run api:update
```

Isso regenera os hooks React Query tipados para os 4 endpoints de report e o endpoint de insights. Confirmar que os seguintes hooks existem após o comando:

- `useTransactionsControllerGetSummary`
- `useTransactionsControllerGetPersonalSummary` ← novo
- `useTransactionsControllerGetCategoryBreakdown` ← novo
- `useTransactionsControllerGetDailySummary` ← novo
- `useInsightsControllerGetInsights`

---

### 4.2 — Decisões de produto aprovadas

| Decisão | Escolha |
|---------|---------|
| Perspectiva | **Ambas lado a lado:** coluna "Você" + coluna "Grupo" |
| Seletor de mês | Mês atual por padrão, navegável ← → |
| Tipos de gráfico | **Distribuição (donut) + Evolução (linha)** |
| Calendário | Clicável: abre lista de transações do dia |
| Estrutura da tela | **Approach B** (ver 4.3) |

---

### 4.3 — Estrutura da tela de Dashboard (Approach B)

```
┌─────────────────────────────────────────────────────┐
│ [← Junho 2026 →]          [Seletor de mês]          │
├──────────────────┬──────────────────────────────────┤
│      VOCÊ        │              GRUPO                │
│  KPI Card Income │  KPI Card Income                  │
│  KPI Card Expense│  KPI Card Expense                 │
│  KPI Card Balance│  KPI Card Balance                 │
├──────────────────┴──────────────────────────────────┤
│  [Donut: Você]         [Donut: Grupo]               │
│  (category-breakdown   (category-breakdown           │
│   scope=personal)       scope=household)             │
├─────────────────────────────────────────────────────┤
│  [Gráfico de Evolução — linha diária]               │
│  (daily-summary → runningBalance)                   │
├─────────────────────────────────────────────────────┤
│  [Calendário Financeiro]                            │
│  Cada dia colorido por balanço; clicável            │
│  (daily-summary → balance por dia)                  │
└─────────────────────────────────────────────────────┘
│  [Seção de Insights]                                │
│  (insights existentes, já funcionando)              │
└─────────────────────────────────────────────────────┘
```

---

### 4.4 — Componentes a construir

#### `MonthSelector`

```
client/src/components/dashboard/month-selector.tsx
```

- Props: `month: string`, `onChange: (month: string) => void`
- Mostra "Mês Ano" em PT-BR (ex: "Junho 2026")
- Botões ← → para navegar meses
- Não permite navegar para frente do mês atual
- Formato interno: `YYYY-MM` (para query params)

---

#### `KpiCard`

```
client/src/components/dashboard/kpi-card.tsx
```

- Props: `label: string`, `value: number`, `currency: string`, `variant: 'income' | 'expense' | 'balance'`
- Formatar valor com `Intl.NumberFormat` para moeda do household
- `income` → verde; `expense` → vermelho; `balance` → azul/neutro (negativo = vermelho)

---

#### `KpiCardsColumn`

```
client/src/components/dashboard/kpi-cards-column.tsx
```

- Props: `data: TransactionSummaryResponseDto | undefined`, `currency: string`, `isLoading: boolean`, `label: 'Você' | 'Grupo'`
- Renderiza 3 `KpiCard` (Income, Expense, Balance) mais skeleton se loading
- **API consumida:** `report/personal-summary` (Você) e `report/summary` (Grupo)

---

#### `CategoryDonutChart`

```
client/src/components/dashboard/category-donut-chart.tsx
```

- Props: `data: CategoryBreakdownResponseDto | undefined`, `isLoading: boolean`
- Biblioteca sugerida: **Recharts** (`PieChart` + `Tooltip`) — já usada no projeto?
  - Se não estiver instalada: `npm install recharts`
- Cada fatia colorida por `category.color` (fallback para paleta automática se null)
- Legenda com categoria + percentual
- Tooltip com valor monetário

---

#### `DailyEvolutionChart`

```
client/src/components/dashboard/daily-evolution-chart.tsx
```

- Props: `data: DailySummaryResponseDto | undefined`, `isLoading: boolean`
- Biblioteca: Recharts `LineChart`
- Série: `runningBalance` por `date`
- Eixo X: dia do mês (1–31)
- Linha vermelha se runningBalance < 0 no ponto; verde se ≥ 0 (usar gradient ou cor condicional)

---

#### `FinancialCalendar`

```
client/src/components/dashboard/financial-calendar.tsx
```

- Props: `data: DailySummaryResponseDto | undefined`, `month: string`, `onDayClick: (date: string) => void`, `isLoading: boolean`
- Renderiza grid de dias do mês (não precisa de lib externa — CSS grid funciona)
- Cada dia:
  - Fundo verde claro se `balance > 0`
  - Fundo vermelho claro se `balance < 0`
  - Neutro/cinza se sem transações
  - Badge com `transactionCount` se > 0
- Ao clicar: chama `onDayClick(date)` com `"YYYY-MM-DD"`

---

#### `DayTransactionsSheet`

```
client/src/components/dashboard/day-transactions-sheet.tsx
```

- Props: `date: string | null`, `householdId: string`, `onClose: () => void`
- Abre como `Sheet` (bottom sheet / side panel) quando `date !== null`
- Internamente chama `useTransactionsControllerFindAll` com `{ month: "YYYY-MM", ... }` e filtra localmente por `date`
- Lista transações do dia: valor, categoria, descrição, tipo

---

### 4.5 — Hooks customizados a criar

#### `useDashboardData`

```
client/src/hooks/use-dashboard-data.ts
```

```typescript
export function useDashboardData(householdId: string, month: string) {
  const summary = useTransactionsControllerGetSummary(householdId, { month })
  const personalSummary = useTransactionsControllerGetPersonalSummary(householdId, { month })
  const householdBreakdown = useTransactionsControllerGetCategoryBreakdown(householdId, { month, scope: 'household' })
  const personalBreakdown = useTransactionsControllerGetCategoryBreakdown(householdId, { month, scope: 'personal' })
  const dailySummary = useTransactionsControllerGetDailySummary(householdId, { month })

  return {
    summary,
    personalSummary,
    householdBreakdown,
    personalBreakdown,
    dailySummary,
    isLoading: [summary, personalSummary, householdBreakdown, personalBreakdown, dailySummary]
      .some(q => q.isLoading),
  }
}
```

---

### 4.6 — Atualizar `dashboard-home-page.tsx`

Arquivo: `client/src/pages/dashboard/dashboard-home-page.tsx`

Adicionar acima da `InsightsSection` existente:

1. `MonthSelector` no topo (controla `month` via `useState`)
2. Grid 2 colunas com `KpiCardsColumn` (Você + Grupo)
3. Grid 2 colunas com `CategoryDonutChart` (personal + household)
4. `DailyEvolutionChart` (largura total)
5. `FinancialCalendar` com handler que abre `DayTransactionsSheet`

O household ativo já está disponível via contexto/query na página. O `month` começa como `currentMonthParam()` (helper existente em `lib/transaction-helpers`).

---

### 4.7 — Coloring strategy do calendário

```typescript
// Sugestão de classes Tailwind por balanço do dia:
const getDayColorClass = (balance: number | undefined) => {
  if (balance === undefined) return 'bg-muted/30'
  if (balance > 0) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  if (balance < 0) return 'bg-red-500/15 text-red-700 dark:text-red-400'
  return 'bg-muted/30'
}
```

---

### 4.8 — Checklist de entrega do frontend

- [ ] `npm run api:update` executado e hooks Orval gerados
- [ ] `MonthSelector` navegável, sem ultrapassar mês atual
- [ ] `KpiCardsColumn` com skeleton durante loading
- [ ] `CategoryDonutChart` com cores das categorias (`category.color`)
- [ ] `DailyEvolutionChart` com `runningBalance` diário
- [ ] `FinancialCalendar` com cores por `balance` e clique funcional
- [ ] `DayTransactionsSheet` lista transações do dia clicado
- [ ] `InsightsSection` existente mantida abaixo de tudo
- [ ] Responsivo: mobile (coluna única) → desktop (2 colunas)
- [ ] Loading states com skeletons em todos os componentes
- [ ] Sem regressões na tela de transações, contas e grupos

---

## Referências do codebase

| O que | Onde |
|-------|------|
| Schema completo (tabelas, tipos) | `server/src/database/schema.ts` |
| Endpoints de transações | `server/src/transactions/transactions.controller.ts` |
| Lógica de cálculo pessoal | `server/src/transactions/transactions.service.ts` → `getPersonalSummary`, `getPersonalCategoryBreakdown` |
| Lógica de insights | `server/src/insights/insights-context.builder.ts` |
| Hooks de insights existentes | `client/src/hooks/use-mixed-household-insights.ts` |
| Helpers de mês | `client/src/lib/transaction-helpers.ts` → `getCurrentMonthParam()` |
| Componente InsightsSection (modelo) | `client/src/components/insights/insights-section.tsx` |
| Estilos glassmorphism | `client/src/index.css` → classes `.glass-*` |
