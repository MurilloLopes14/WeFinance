import { InsightDto } from '../dto/insight-response.dto';
import { roundPct } from '../insights.helpers';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class MonthOverMonthExpenseRule implements InsightRule {
  readonly key = 'month_over_month_expense';

  evaluate(ctx: InsightsContext): InsightDto[] | null {
    const results: InsightDto[] = [];

    const hhInsight = this.evaluateScope(
      'household',
      ctx.household.current.totalExpenses,
      ctx.household.previous.totalExpenses,
      ctx.currency,
    );
    if (hhInsight) results.push(hhInsight);

    const personalInsight = this.evaluateScope(
      'personal',
      ctx.personal.current.totalExpenses,
      ctx.personal.previous.totalExpenses,
      ctx.currency,
    );
    if (personalInsight) results.push(personalInsight);

    return results.length ? results : null;
  }

  private evaluateScope(
    scope: 'household' | 'personal',
    current: number,
    previous: number,
    currency: string,
  ): InsightDto | null {
    if (previous <= 0) return null;

    const deltaPercent = ((current - previous) / previous) * 100;
    if (Math.abs(deltaPercent) < 10) return null;

    const increased = deltaPercent > 0;
    const pct = roundPct(Math.abs(deltaPercent));
    const delta = parseFloat((current - previous).toFixed(2));

    let message: string;
    if (scope === 'household') {
      message = increased
        ? `As despesas do grupo superaram o mês passado em ${pct}%. Considere controlar os gastos.`
        : `As despesas do grupo ficaram ${pct}% abaixo do mês passado. Bom trabalho!`;
    } else {
      message = increased
        ? `Suas despesas superaram o mês passado em ${pct}%. Considere controlar seus gastos.`
        : `Suas despesas ficaram ${pct}% abaixo do mês passado. Bom trabalho!`;
    }

    return {
      id: `month_over_month_expense:${scope}`,
      rule: 'month_over_month_expense',
      scope,
      tone: increased ? 'warning' : 'success',
      title: increased ? 'Aumento de despesas' : 'Redução de despesas',
      message,
      priority: increased ? 85 : 60,
      metadata: {
        amount: current,
        previousAmount: previous,
        delta,
        deltaPercent: parseFloat(deltaPercent.toFixed(2)),
        currency,
      },
    };
  }
}
