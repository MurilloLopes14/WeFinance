import { InsightDto } from '../dto/insight-response.dto';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';
import { formatMoney } from '../insights.helpers';

export class PositiveBalanceStreakRule implements InsightRule {
  readonly key = 'positive_balance_streak';

  evaluate(ctx: InsightsContext): InsightDto[] | null {
    const { household, personal, currency } = ctx;
    const insights: InsightDto[] = [];

    if (
      household.current.balance > 0 &&
      household.previous.balance > 0 &&
      household.current.totalIncome > 0
    ) {
      insights.push({
        id: `${this.key}:household:${ctx.month}`,
        rule: this.key,
        scope: 'household',
        tone: 'success',
        priority: 72,
        title: 'Dois meses no positivo!',
        message: `O grupo fechou o mês passado e está no positivo este mês também. Saldo atual: ${formatMoney(household.current.balance, currency)}.`,
        metadata: { balance: household.current.balance, currency },
      });
    }

    if (
      personal.current.balance > 0 &&
      personal.previous.balance > 0 &&
      personal.current.totalIncome > 0
    ) {
      insights.push({
        id: `${this.key}:personal:${ctx.month}`,
        rule: this.key,
        scope: 'personal',
        tone: 'success',
        priority: 72,
        title: 'Dois meses no positivo!',
        message: `Você fechou o mês passado e está no positivo este mês também. Saldo pessoal: ${formatMoney(personal.current.balance, currency)}.`,
        metadata: { balance: personal.current.balance, currency },
      });
    }

    return insights.length ? insights : null;
  }
}
