import { InsightDto } from '../dto/insight-response.dto';
import { formatMoney } from '../insights.helpers';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class RecurringIncomeRule implements InsightRule {
  readonly key = 'recurring_income';

  evaluate(ctx: InsightsContext): InsightDto | null {
    const incomeSubs = ctx.household.subscriptions.filter((s) => s.type === 'income');
    if (incomeSubs.length === 0) return null;

    const total = parseFloat(
      incomeSubs.reduce((sum, s) => sum + s.amount, 0).toFixed(2),
    );
    const count = incomeSubs.length;
    const valor = formatMoney(total, ctx.currency);
    const plural = count > 1;

    return {
      id: 'recurring_income:household',
      rule: 'recurring_income',
      scope: 'household',
      tone: 'info',
      title: 'Renda fixa cadastrada',
      message: `O grupo tem ${count} renda${plural ? 's' : ''} fixa${plural ? 's' : ''} cadastrada${plural ? 's' : ''}, totalizando ${valor}.`,
      priority: 58,
      metadata: {
        amount: total,
        count,
        currency: ctx.currency,
      },
    };
  }
}
