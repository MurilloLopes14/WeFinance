import { InsightDto } from '../dto/insight-response.dto';
import { formatMoney, roundPct } from '../insights.helpers';
import { CategoryBucket, InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class CategoryShareRule implements InsightRule {
  readonly key = 'category_share';

  evaluate(ctx: InsightsContext): InsightDto[] | null {
    const results: InsightDto[] = [];

    const hhInsight = this.evaluateScope(
      'household',
      ctx.household.current.expensesByCategory,
      ctx.household.current.totalExpenses,
      ctx.currency,
    );
    if (hhInsight) results.push(hhInsight);

    const personalInsight = this.evaluateScope(
      'personal',
      ctx.personal.current.expensesByCategory,
      ctx.personal.current.totalExpenses,
      ctx.currency,
    );
    if (personalInsight) results.push(personalInsight);

    return results.length ? results : null;
  }

  private evaluateScope(
    scope: 'household' | 'personal',
    expensesByCategory: CategoryBucket[],
    totalExpenses: number,
    currency: string,
  ): InsightDto | null {
    if (totalExpenses <= 0 || expensesByCategory.length === 0) return null;

    const top = this.topCategory(expensesByCategory);
    const percentage = (top.amount / totalExpenses) * 100;

    if (percentage < 20) return null;

    const pct = roundPct(percentage);
    const name = top.categoryName;
    const message =
      scope === 'household'
        ? `A categoria ${name} equivale a ${pct}% do gasto mensal do grupo.`
        : `A categoria ${name} equivale a ${pct}% dos seus gastos no mês.`;

    return {
      id: `category_share:${scope}:${top.categoryId ?? 'uncategorized'}`,
      rule: 'category_share',
      scope,
      tone: 'info',
      title: 'Maior categoria de despesa',
      message,
      priority: 70,
      metadata: {
        categoryId: top.categoryId ?? undefined,
        categoryName: name,
        percentage: parseFloat(percentage.toFixed(2)),
        amount: top.amount,
        currency,
      },
    };
  }

  private topCategory(cats: CategoryBucket[]): CategoryBucket {
    return [...cats].sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount;
      return a.categoryName.localeCompare(b.categoryName);
    })[0];
  }
}
