import { InsightDto } from '../dto/insight-response.dto';
import { formatMoney } from '../insights.helpers';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class FixedVsVariableRule implements InsightRule {
  readonly key = 'fixed_vs_variable';

  evaluate(ctx: InsightsContext): InsightDto | null {
    const { fixedSpent, variableSpent } = ctx.household.current;

    if (fixedSpent <= variableSpent) return null;
    if (variableSpent <= 0) return null;

    const fixed = formatMoney(fixedSpent, ctx.currency);
    const variable = formatMoney(variableSpent, ctx.currency);

    return {
      id: 'fixed_vs_variable:household',
      rule: 'fixed_vs_variable',
      scope: 'household',
      tone: 'info',
      title: 'Gastos fixos superam variáveis',
      message: `Os gastos fixos do grupo superam os variáveis neste mês (${fixed} vs ${variable}).`,
      priority: 55,
      metadata: {
        fixedAmount: fixedSpent,
        variableAmount: variableSpent,
        currency: ctx.currency,
      },
    };
  }
}
