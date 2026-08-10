import { InsightDto } from '../dto/insight-response.dto';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';
import { formatMoney } from '../insights.helpers';

export class NoIncomeAlertRule implements InsightRule {
  readonly key = 'no_income_alert';

  evaluate(ctx: InsightsContext): InsightDto | null {
    const { household, currency } = ctx;

    if (household.current.totalIncome > 0) return null;
    if (household.current.totalExpenses === 0) return null;

    return {
      id: `${this.key}:${ctx.month}`,
      rule: this.key,
      scope: 'household',
      tone: 'warning',
      priority: 82,
      title: 'Nenhuma receita registrada este mês',
      message: `O grupo tem ${formatMoney(household.current.totalExpenses, currency)} em despesas mas nenhuma receita lançada este mês.`,
      metadata: { amount: household.current.totalExpenses, currency },
    };
  }
}
