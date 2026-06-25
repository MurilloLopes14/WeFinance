# Estrutura do Front-End — WeFinance

> React + Vite + TypeScript. API hooks gerados automaticamente via **Orval** a partir do Swagger.

---

## Stack

| Área | Tecnologia | Função |
|---|---|---|
| UI base | React + Vite + TypeScript | Core |
| Estilo | Tailwind CSS + shadcn/ui | Componentes e layout |
| API hooks | **Orval** (gerado do Swagger) | React Query hooks tipados |
| Estado servidor | React Query (via Orval) | Cache e sincronização |
| Formulários | React Hook Form + Zod | Validação |
| Roteamento | React Router v6 | Rotas protegidas |
| Ícones | Lucide React | Ícones |
| Gráficos | Recharts | Dashboard |

---

## Geração de Hooks (Orval)

Os hooks de API são **gerados automaticamente** a partir do Swagger do backend:

```bash
# Na pasta client/
npm run api:update
```

Configuração em `client/orval.config.ts`. Os hooks ficam em `client/src/api/`.

> Nunca escreva hooks de fetch manualmente — rode `api:update` após qualquer mudança de endpoint no backend.

---

## Estrutura de Pastas

```
client/src/
  api/                    # Hooks gerados pelo Orval (não editar manualmente)
  components/
    dashboard/
      kpi-card.tsx               # Card de KPI (receita, despesa, saldo)
      kpi-cards-column.tsx       # Coluna de KPIs (pessoal ou grupo)
      category-donut-chart.tsx   # Gráfico donut de categorias
      daily-evolution-chart.tsx  # Gráfico de linha (evolução diária)
      financial-calendar.tsx     # Calendário financeiro clicável
      day-transactions-sheet.tsx # Sheet de transações do dia
      month-selector.tsx         # Seletor de mês
      dashboard-perspective-tabs.tsx  # Abas Você / Grupo
      dashboard-household-selector.tsx
    data-table/             # Tabela genérica com filtros e paginação
    color-preset-picker.tsx # Seletor de cor (contas, categorias)
    insights/               # Componentes de insights financeiros
    object/
      household-gated-form-section.tsx  # Seção de form bloqueada sem household
    splits/                 # Componentes de rateio de transação
    subscriptions/          # Componentes de assinaturas
    ui/                     # shadcn/ui base (button, input, dialog, etc.)
  hooks/
    use-dashboard/          # Hooks de dados do dashboard
  pages/
    accounts/               # Listagem e formulário de contas
    categories/             # Listagem, criação e edição de categorias
    dashboard/
      dashboard-home-page.tsx
    transactions/           # Listagem e formulário de transações
  router/
    app-router.tsx          # Rotas protegidas e públicas
  index.css                 # Tailwind + tokens de tema
```

---

## Fluxo de Autenticação

1. `/login` → POST `/auth/login` → salva tokens no localStorage
2. Middleware de rota redireciona não-autenticados para `/login`
3. Após login, carrega `household` padrão do usuário
4. Refresh token automático via interceptor do Axios

---

## Dashboard (Abordagem "Perspectivas")

O dashboard apresenta duas colunas paralelas: **Você** e **Grupo**.

```
[Seletor de Mês]
[Abas: Você | Grupo]

Coluna Você:                    Coluna Grupo:
┌──────────────────┐            ┌──────────────────┐
│ KPI: Receitas    │            │ KPI: Receitas     │
│ KPI: Despesas    │            │ KPI: Despesas     │
│ KPI: Saldo       │            │ KPI: Saldo        │
│ Donut Categorias │            │ Donut Categorias  │
└──────────────────┘            └──────────────────┘

[Calendário financeiro — clica no dia → sheet com transações]
[Gráfico de Linha — Evolução diária do mês]
```

**Endpoints consumidos:**
- `GET report/personal-summary?month=YYYY-MM` → KPIs
- `GET report/category-breakdown?month=YYYY-MM&scope=personal|household` → donut
- `GET report/daily-summary?month=YYYY-MM` → calendário + linha

---

## Transações

- Tabela com filtros por tipo, conta, categoria, mês
- Modal de criação/edição
- Suporte a splits (rateio) com editor visual
- `splitPreview.members` exibe avatars empilhados na listagem

---

## Assinaturas

- Lista agrupada por `type` (expense/income)
- Exibe `nextRunAt` com badge de proximidade
- Ações: pausar (`active = false`), executar manualmente (`POST /run`)

---

## Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:2951/api/v1
```

---

## Scripts

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run api:update   # Regenera hooks Orval a partir do Swagger
npm run lint         # ESLint
```
