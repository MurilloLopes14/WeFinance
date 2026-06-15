# WeInsights — Especificação Backend (MVP)

> **Escopo deste documento:** implementação exclusiva do **backend** (NestJS + Drizzle).
> **Fora de escopo:** UI, componentes React, Orval no client (será feito depois).
> **Objetivo:** expor insights financeiros contextualizados por **grupo (household)** e **individual (personal)**, prontos para consumo pelo frontend WeInsights.

---

## 1. Visão geral

WeInsights é um feed de mensagens curtas derivadas dos dados financeiros do grupo. Exemplos:

- "A categoria Alimentação equivale a 32% do gasto mensal do grupo."
- "Suas despesas superaram o mês passado em 18%. Considere controlar seus gastos."
- "Os gastos com assinatura superam as transações comuns do grupo."
- "Você economizou R$ 420 a mais que no mês passado. Parabéns!"

### Decisões de produto já aprovadas

| Decisão | Escolha |
|---------|---------|
| Escopos | **Grupo + Individual** (ambos no mesmo feed) |
| UI futura | Feed **misto** com badge `Grupo` / `Você` (front faz isso via `scope`) |
| Quantidade de regras (MVP) | **6–8 regras** |
| Formato da resposta | **Híbrido (C):** `message` pronta em PT-BR + `metadata` estruturada |
| Onde roda a lógica | **100% backend** — front só renderiza |

---

## 2. Endpoint

### Rota

```
GET /api/v1/households/:householdId/insights
```

### Query params

| Param | Tipo | Obrigatório | Default | Descrição |
|-------|------|-------------|---------|-----------|
| `month` | `string` | Não | mês atual (`YYYY-MM`) | Mês de referência dos insights |

### Autenticação & autorização

- `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth('JWT-auth')`
- `@CurrentUser()` para obter `user.id`
- Chamar `householdsService.assertMember(householdId, user.id)` antes de qualquer query
- Padrão igual a `TransactionsService.getSummary`

### Resposta — DTOs

Criar em `server/src/insights/dto/`:

```typescript
// insight-response.dto.ts

export type InsightScope = 'household' | 'personal';
export type InsightTone = 'neutral' | 'info' | 'success' | 'warning';

export class InsightMetadataDto {
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
}

export class InsightDto {
  id: string;           // estável por regra+escopo+entidade, ex: "category_share:household:<categoryId>"
  rule: string;         // snake_case, ex: "category_share"
  scope: InsightScope;
  tone: InsightTone;
  title: string;        // curto (1 linha)
  message: string;      // frase completa em PT-BR
  priority: number;     // maior = mais relevante (usado para ordenar)
  metadata: InsightMetadataDto;
}

export class InsightsResponseDto {
  month: string;        // "YYYY-MM"
  generatedAt: string;  // ISO 8601
  currency: string;     // moeda do household (ex: "BRL")
  insights: InsightDto[];
}
```

### Comportamento da resposta

1. Executar **todas** as regras aplicáveis ao contexto
2. Descartar regras que retornarem `null` (sem insight relevante)
3. Ordenar por `priority` DESC; empate por `rule` ASC
4. **Limitar a 8 insights** no MVP (top 8 após ordenação)
5. Se nenhuma regra disparar: `insights: []` (200 OK, não erro)

### Swagger

- `@ApiTags('Insights')`
- Documentar query `month`, response `InsightsResponseDto`
- Exemplos realistas nos `@ApiProperty`

---

## 3. Estrutura de módulo

Criar módulo NestJS seguindo padrões existentes (`transactions`, `subscriptions`):

```
server/src/insights/
  insights.module.ts
  insights.controller.ts
  insights.service.ts
  insights-context.builder.ts
  insights.types.ts
  insights.helpers.ts          # monthDateRange, formatCurrency, previousMonth, etc.
  rules/
    insight-rule.interface.ts
    category-share.rule.ts
    month-over-month-expense.rule.ts
    monthly-balance.rule.ts
    subscription-vs-common.rule.ts
    fixed-vs-variable.rule.ts
    top-category.rule.ts
    personal-shared-share.rule.ts
    savings-vs-last-month.rule.ts
  dto/
    insight-response.dto.ts
    filter-insights.dto.ts     # month query validation (YYYY-MM regex)
```

### Registro no app

- Importar `InsightsModule` em `app.module.ts`
- `InsightsModule` importa `HouseholdsModule` (para `assertMember` e currency)
- **Não** acoplar lógica dentro de `TransactionsService` — módulo isolado

### Interface de regra

```typescript
// insight-rule.interface.ts
export interface InsightRule {
  readonly key: string;
  evaluate(ctx: InsightsContext): InsightDto | null;
}
```

`InsightsService` injeta array de regras, itera e agrega.

---

## 4. InsightsContext — métricas pré-calculadas

`InsightsContextBuilder.build(householdId, userId, month)` deve fazer **poucas queries** e montar um objeto reutilizado por todas as regras.

### Parâmetros de tempo

Reutilizar lógica de `transactions.service.ts`:

```typescript
function currentMonth(): string
function monthDateRange(month: string): { startDate: string; endDate: string }
function previousMonth(month: string): string
```

- `month` = mês alvo
- `previousMonth` = mês anterior (cuidado com janeiro → dezembro do ano anterior)

### Dados do household

- Buscar household (id, currency) — falhar 404 se não existir
- `currency` vai na resposta raiz e em cada `metadata`

### Escopo HOUSEHOLD — agregações

**Base:** transações do household no intervalo `[startDate, endDate)`, **excluir `type = 'transfer'`**.

#### Totais do mês (`household.current`)

| Campo | Cálculo |
|-------|---------|
| `totalIncome` | SUM(amount) WHERE type = 'income' |
| `totalExpenses` | SUM(amount) WHERE type = 'expense' |
| `balance` | totalIncome - totalExpenses (2 casas) |
| `transactionCount` | COUNT(*) |

#### Totais mês anterior (`household.previous`)

Mesmas métricas para `previousMonth`.

#### Despesas por categoria (`household.current.expensesByCategory`)

```
GROUP BY COALESCE(categoryId, 'uncategorized')
SUM(amount) WHERE type = 'expense'
```

Join opcional com `categories` para obter `name`, `isFixed`.

Incluir bucket `uncategorized` para transações sem categoria.

#### Assinaturas (`household.subscriptions`)

- Listar `subscriptions` WHERE `householdId` AND `active = true`
- Para cada uma: `amount`, `cadenceUnit`, `cadenceEvery`, `categoryId`, `type`

#### Despesas assinatura vs comum (`household.current`)

Como **não existe** `subscriptionId` em `transactions`, usar proxy por categoria:

1. `subscriptionCategoryIds` = Set de `categoryId` não-nulos das assinaturas ativas do tipo `expense`
2. `subscriptionSpent` = SUM despesas do mês WHERE `categoryId IN subscriptionCategoryIds`
3. `commonSpent` = SUM despesas do mês WHERE `categoryId NOT IN subscriptionCategoryIds` (inclui sem categoria)

**Se `subscriptionCategoryIds` estiver vazio:** regra `subscription_vs_common` retorna `null`.

#### Fixo vs variável (`household.current`)

- `fixedSpent` = SUM despesas WHERE categoria existe AND `categories.isFixed = true`
- `variableSpent` = SUM despesas WHERE categoria não existe OR `isFixed = false`

---

### Escopo PERSONAL — agregações (via splits)

**Princípio:** o gasto/receita pessoal do usuário logado considera rateio.

Para cada transação `expense` ou `income` no mês:

1. **Com splits:** somar apenas `transaction_splits.share` WHERE `userId = requesterId`
   - Categoria efetiva: `COALESCE(split.categoryId, transaction.categoryId)`
2. **Sem splits:** somar `transaction.amount` **somente se** `transaction.createdById = requesterId`
   - (Transação pessoal implícita / legado)

**Não incluir transferências.**

#### Totais pessoais (`personal.current` / `personal.previous`)

| Campo | Cálculo |
|-------|---------|
| `totalIncome` | soma shares/regras acima para income |
| `totalExpenses` | soma shares/regras acima para expense |
| `balance` | income - expenses |
| `expensesByCategory` | GROUP BY categoria efetiva, mesma lógica |

#### Participação em gastos compartilhados (`personal.shared`)

- `sharedExpenseTotal` = SUM de despesas do household que **possuem splits** (qualquer split)
- `personalShareInShared` = SUM dos shares do user nessas transações
- `personalSharePercent` = (personalShareInShared / sharedExpenseTotal) * 100, se sharedExpenseTotal > 0

---

## 5. Regras do MVP (8)

Cada regra retorna `InsightDto | null`. Mensagens em **PT-BR**, valores monetários formatáveis pelo front via `metadata`, mas incluir valor numérico em `message` com 2 casas.

Helper sugerido: `formatMoney(amount, currency)` → `"R$ 420,00"` para BRL.

---

### Regra 1 — `category_share`

| | |
|---|---|
| **Escopos** | `household` + `personal` (avaliar separadamente) |
| **Priority** | 70 |
| **Tone** | `info` |

**Condição de disparo:**

- `totalExpenses > 0`
- Categoria com maior `amount` no mês (desempate: nome alfabético)
- `percentage >= 20` (≥ 20% do total de despesas)

**Mensagens:**

- Household: `"A categoria {name} equivale a {pct}% do gasto mensal do grupo."`
- Personal: `"A categoria {name} equivale a {pct}% dos seus gastos no mês."`

**Metadata:** `categoryId`, `categoryName`, `percentage`, `amount`, `currency`

**id:** `category_share:{scope}:{categoryId}`

---

### Regra 2 — `month_over_month_expense`

| | |
|---|---|
| **Escopos** | `household` + `personal` |
| **Priority** | 85 (warning) / 60 (success) |
| **Tone** | `warning` se aumento ≥ 10%; `success` se redução ≥ 10%; senão `null` |

**Condição:**

- `previous.totalExpenses > 0` (senão null — sem base de comparação)
- `deltaPercent = ((current - previous) / previous) * 100`
- Disparar se `|deltaPercent| >= 10`

**Mensagens:**

- Aumento household: `"As despesas do grupo superaram o mês passado em {pct}%. Considere controlar os gastos."`
- Redução household: `"As despesas do grupo ficaram {pct}% abaixo do mês passado. Bom trabalho!"`
- Aumento personal: `"Suas despesas superaram o mês passado em {pct}%. Considere controlar seus gastos."`
- Redução personal: `"Suas despesas ficaram {pct}% abaixo do mês passado. Bom trabalho!"`

**Metadata:** `amount`, `previousAmount`, `delta`, `deltaPercent`, `currency`

**id:** `month_over_month_expense:{scope}`

---

### Regra 3 — `monthly_balance`

| | |
|---|---|
| **Escopos** | `household` + `personal` |
| **Priority** | 75 |
| **Tone** | `success` se balance ≥ 0; `warning` se balance < 0 |

**Condição:** `totalIncome > 0 OR totalExpenses > 0` (mês com alguma movimentação)

**Mensagens:**

- Positivo household: `"O saldo do grupo no mês ficou positivo em {valor}."`
- Negativo household: `"O saldo do grupo no mês ficou negativo em {valor}."`
- Positivo personal: `"Seu saldo no mês ficou positivo em {valor}."`
- Negativo personal: `"Seu saldo no mês ficou negativo em {valor}."`

**Metadata:** `balance`, `currency`

**id:** `monthly_balance:{scope}`

---

### Regra 4 — `subscription_vs_common`

| | |
|---|---|
| **Escopo** | **`household` apenas** |
| **Priority** | 65 |
| **Tone** | `warning` |

**Condição:**

- Existe ao menos 1 assinatura ativa com `categoryId` definido
- `subscriptionSpent > commonSpent`
- `commonSpent > 0` (evitar insight trivial no primeiro mês)

**Mensagem:** `"Os gastos com assinatura superam as transações comuns do grupo neste mês ({sub} vs {common})."`

**Metadata:** `subscriptionAmount`, `commonAmount`, `currency`

**id:** `subscription_vs_common:household`

**Nota:** usa gasto **real** em categorias vinculadas a assinaturas, não o valor teórico recorrente.

---

### Regra 5 — `fixed_vs_variable`

| | |
|---|---|
| **Escopo** | **`household` apenas** |
| **Priority** | 55 |
| **Tone** | `info` |

**Condição:**

- `fixedSpent > variableSpent`
- `variableSpent > 0`

**Mensagem:** `"Os gastos fixos do grupo superam os variáveis neste mês ({fixed} vs {variable})."`

**Metadata:** `fixedAmount`, `variableAmount`, `currency`

**id:** `fixed_vs_variable:household`

---

### Regra 6 — `top_category`

| | |
|---|---|
| **Escopos** | `household` + `personal` |
| **Priority** | 50 |
| **Tone** | `neutral` |

**Condição:**

- `totalExpenses > 0`
- Maior categoria por valor (mesma do rule 1, mas **sem** threshold de 20%)
- **Não emitir** se regra `category_share` já emitiu para a mesma categoria+escopo (evitar duplicata)

**Mensagens:**

- Household: `"A maior despesa do grupo foi em {name} ({valor})."`
- Personal: `"Sua maior despesa do mês foi em {name} ({valor})."`

**Metadata:** `categoryId`, `categoryName`, `amount`, `currency`

**id:** `top_category:{scope}:{categoryId}`

---

### Regra 7 — `personal_shared_share`

| | |
|---|---|
| **Escopo** | **`personal` apenas** |
| **Priority** | 80 |
| **Tone** | `info` |

**Condição:**

- `sharedExpenseTotal > 0`

**Mensagem:** `"Você responde por {pct}% dos gastos compartilhados do grupo neste mês."`

**Metadata:** `personalSharePercent`, `amount` (personalShareInShared), `sharedExpenseTotal`, `currency`

**id:** `personal_shared_share:personal`

---

### Regra 8 — `savings_vs_last_month`

| | |
|---|---|
| **Escopo** | **`personal` apenas** |
| **Priority** | 90 (success) / 40 (warning) |
| **Tone** | `success` se economia; `warning` se piorou |

**Definição de "economia":** melhora do **saldo pessoal** vs mês anterior.

- `delta = current.balance - previous.balance`
- Disparar se `|delta| >= 50` (mínimo R$ 50 ou equivalente — evita ruído)

**Mensagens:**

- `delta > 0`: `"Você economizou {valor} a mais que no mês passado. Parabéns!"`
- `delta < 0`: `"Seu saldo ficou {valor} abaixo do mês passado em relação ao mês anterior."`

**Metadata:** `balance`, `previousAmount` (previous.balance), `delta`, `currency`

**id:** `savings_vs_last_month:personal`

---

## 6. Validação & edge cases

| Cenário | Comportamento esperado |
|---------|------------------------|
| Mês sem transações | `insights: []` |
| Mês inválido (`month=foo`) | `400 Bad Request` |
| Usuário não membro | `403 Forbidden` (via assertMember) |
| Household inexistente | `404 Not Found` |
| Transferências | **Sempre ignoradas** em todos os cálculos |
| Transação sem categoria | Bucket `uncategorized`; `categoryName = "Sem categoria"` |
| Percentuais | Arredondar para **1 casa decimal** na message; valor exato em `metadata.percentage` |
| Valores monetários | 2 casas decimais; usar `parseFloat` + `toFixed(2)` como em `transactions.service.ts` |
| Duplicata rule 1 vs 6 | Rule 6 suprimida quando rule 1 já cobriu mesma categoria+escopo |

---

## 7. Controller — exemplo de rota

Preferência: controller **nested** under households (consistente com transactions):

```typescript
@Controller('households/:householdId/insights')
export class InsightsController {
  @Get()
  getInsights(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query() query: FilterInsightsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.insightsService.getInsights(householdId, user.id, query.month);
  }
}
```

`FilterInsightsDto`: `month?: string` com validação `@Matches(/^\d{4}-\d{2}$/)`.

---

## 8. Testes (obrigatório)

Criar `insights.service.spec.ts` (e testes unitários por regra se possível):

1. **Household com despesas por categoria** → rule `category_share` dispara
2. **MoM increase ≥ 10%** → rule `month_over_month_expense` warning
3. **Transação com splits** → totais personal ≠ household
4. **Sem assinaturas com categoryId** → rule 4 retorna null
5. **Mês vazio** → array vazio
6. **Ordenação** → insights respeitam `priority`
7. **Limite 8** → com muitas regras, retorna no máximo 8

Preferir testes com mocks do Drizzle ou fixtures in-memory seguindo padrão existente no repo.

---

## 9. Referências no codebase

| Referência | Caminho |
|------------|---------|
| Summary mensal (padrão de query) | `server/src/transactions/transactions.service.ts` → `getSummary`, `monthDateRange`, `currentMonth` |
| assertMember | `server/src/households/households.service.ts` |
| Schema transações/splits/categorias/assinaturas | `server/src/database/schema.ts` |
| Padrão controller nested | `server/src/transactions/transactions.controller.ts` |
| Cadence assinaturas | `cadenceUnit`: `day`, `week`, `month`, `year` + `cadenceEvery` |

### Extração sugerida

Mover `currentMonth()` e `monthDateRange()` para util compartilhado (ex: `server/src/common/utils/month.utils.ts`) se `InsightsContextBuilder` precisar — evitar duplicação. **Opcional no MVP**, mas recomendado.

---

## 10. Fora de escopo (não implementar agora)

- Persistir insights dismiss/snooze
- Cache Redis
- Push notifications
- i18n EN/ES
- Endpoint separado `/metrics`
- Insights históricos multi-mês
- Machine learning / detecção de anomalias
- **Frontend / Orval client** (próxima fase)

---

## 11. Critérios de aceite

- [ ] `GET /api/v1/households/:id/insights` documentado no Swagger
- [ ] Resposta segue `InsightsResponseDto` com até 8 insights ordenados
- [ ] 8 regras implementadas conforme seção 5
- [ ] Escopos `household` e `personal` corretos (splits respeitados)
- [ ] Transferências excluídas
- [ ] `InsightsModule` registrado em `AppModule`
- [ ] Testes unitários passando
- [ ] Sem regressões em módulos existentes

---

## 12. Pós-implementação

Após merge do backend:

1. Rodar `npm run api:update` no **client** para gerar hook Orval
2. Implementar UI WeInsights (feed misturado, badges, tons) — spec separada
