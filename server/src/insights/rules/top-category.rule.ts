import { InsightDto } from '../dto/insight-response.dto';
import { formatMoney } from '../insights.helpers';
import { CategoryBucket, InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class TopCategoryRule implements InsightRule {
  readonly key = 'top_category';

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

    // category_share already covers categories at or above 20%
    if (percentage >= 20) return null;

    const name = top.categoryName;
    const valor = formatMoney(top.amount, currency);
    const message =
      scope === 'household'
        ? `A maior despesa do grupo foi em ${name} (${valor}).`
        : `Sua maior despesa do mês foi em ${name} (${valor}).`;

    return {
      id: `top_category:${scope}:${top.categoryId ?? 'uncategorized'}`,
      rule: 'top_category',
      scope,
      tone: 'neutral',
      title: 'Maior categoria de despesa',
      message,
      priority: 50,
      metadata: {
        categoryId: top.categoryId ?? undefined,
        categoryName: name,
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
