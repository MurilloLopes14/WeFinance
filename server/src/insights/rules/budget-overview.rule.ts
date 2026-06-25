import { InsightDto } from '../dto/insight-response.dto';
import { formatMoney, roundPct } from '../insights.helpers';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class BudgetOverviewRule implements InsightRule {
  readonly key = 'budget_overview';

  evaluate(ctx: InsightsContext): InsightDto | InsightDto[] | null {
    const insights: InsightDto[] = [];
    const { budgets, currency } = ctx;
    const totalExpenses = ctx.household.current.totalExpenses;

    // ── Group budget ──────────────────────────────────────────────────────────
    if (budgets.household) {
      const budget = budgets.household.amount;
      const pct = budget > 0 ? totalExpenses / budget : 0;
      const remaining = parseFloat((budget - totalExpenses).toFixed(2));

      if (pct >= 1) {
        const excess = formatMoney(Math.abs(remaining), currency);
        insights.push({
          id: 'budget_overview:group:overflow',
          rule: this.key,
          scope: 'household',
          tone: 'warning',
          title: 'Budget mensal do grupo ultrapassado',
          message: `O grupo ultrapassou o budget em ${excess}. Gasto: ${formatMoney(totalExpenses, currency)} / Budget: ${formatMoney(budget, currency)}.`,
          priority: 95,
          metadata: {
            amount: budget,
            budgetUsed: totalExpenses,
            budgetRemaining: remaining,
            budgetPercent: roundPct(pct * 100),
            currency,
          },
        });
      } else if (pct >= 0.8) {
        insights.push({
          id: 'budget_overview:group:approaching',
          rule: this.key,
          scope: 'household',
          tone: 'warning',
          title: 'Grupo próximo do budget mensal',
          message: `O grupo já usou ${roundPct(pct * 100)}% do budget. Restam ${formatMoney(remaining, currency)}.`,
          priority: 70,
          metadata: {
            amount: budget,
            budgetUsed: totalExpenses,
            budgetRemaining: remaining,
            budgetPercent: roundPct(pct * 100),
            currency,
          },
        });
      }
    }

    // ── Category budgets ──────────────────────────────────────────────────────
    if (budgets.categories.length > 0) {
      const expenseMap = new Map(
        ctx.household.current.expensesByCategory.map((b) => [b.categoryId, b.amount]),
      );

      const overflows = budgets.categories
        .map((catBudget) => {
          const spent = expenseMap.get(catBudget.categoryId) ?? 0;
          return { ...catBudget, spent, excess: spent - catBudget.amount };
        })
        .filter((b) => b.excess > 0)
        .sort((a, b) => b.excess - a.excess)
        .slice(0, 3);

      for (const ov of overflows) {
        insights.push({
          id: `budget_overview:category:overflow:${ov.categoryId}`,
          rule: this.key,
          scope: 'household',
          tone: 'warning',
          title: `Budget de ${ov.categoryName} ultrapassado`,
          message: `A categoria ${ov.categoryName} gastou ${formatMoney(ov.spent, currency)} de um budget de ${formatMoney(ov.amount, currency)}.`,
          priority: 80,
          metadata: {
            categoryId: ov.categoryId,
            categoryName: ov.categoryName,
            amount: ov.amount,
            budgetUsed: ov.spent,
            budgetRemaining: parseFloat((ov.amount - ov.spent).toFixed(2)),
            budgetPercent: roundPct((ov.spent / ov.amount) * 100),
            currency,
          },
        });
      }
    }

    // ── Category sum vs group budget ──────────────────────────────────────────
    if (budgets.household && budgets.categorySum > budgets.household.amount) {
      const excess = parseFloat((budgets.categorySum - budgets.household.amount).toFixed(2));
      insights.push({
        id: 'budget_overview:allocation:mismatch',
        rule: this.key,
        scope: 'household',
        tone: 'info',
        title: 'Budgets de categoria excedem o budget do grupo',
        message: `Os budgets por categoria somam ${formatMoney(budgets.categorySum, currency)}, mas o budget do grupo é ${formatMoney(budgets.household.amount, currency)}. Diferença de ${formatMoney(excess, currency)} sem controle granular.`,
        priority: 50,
        metadata: {
          amount: budgets.household.amount,
          budgetUsed: budgets.categorySum,
          budgetRemaining: parseFloat((-excess).toFixed(2)),
          currency,
        },
      });
    }

    return insights.length ? insights : null;
  }
}
