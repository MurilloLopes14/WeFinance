import { InsightDto } from '../dto/insight-response.dto';
import { formatMoney } from '../insights.helpers';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class SavingsVsLastMonthRule implements InsightRule {
  readonly key = 'savings_vs_last_month';

  evaluate(ctx: InsightsContext): InsightDto | null {
    const currentBalance = ctx.personal.current.balance;
    const previousBalance = ctx.personal.previous.balance;
    const delta = parseFloat((currentBalance - previousBalance).toFixed(2));

    if (Math.abs(delta) < 50) return null;

    const saved = delta > 0;
    const valor = formatMoney(Math.abs(delta), ctx.currency);

    const message = saved
      ? `Você economizou ${valor} a mais que no mês passado. Parabéns!`
      : `Seu saldo ficou ${valor} abaixo do mês passado em relação ao mês anterior.`;

    return {
      id: 'savings_vs_last_month:personal',
      rule: 'savings_vs_last_month',
      scope: 'personal',
      tone: saved ? 'success' : 'warning',
      title: saved ? 'Você economizou mais este mês' : 'Saldo abaixo do mês anterior',
      message,
      priority: saved ? 90 : 40,
      metadata: {
        balance: currentBalance,
        previousAmount: previousBalance,
        delta,
        currency: ctx.currency,
      },
    };
  }
}
