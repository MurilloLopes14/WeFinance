import { InsightDto } from '../dto/insight-response.dto';
import { formatMoney } from '../insights.helpers';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class MonthlyBalanceRule implements InsightRule {
  readonly key = 'monthly_balance';

  evaluate(ctx: InsightsContext): InsightDto[] | null {
    const results: InsightDto[] = [];

    const hhInsight = this.evaluateScope(
      'household',
      ctx.household.current.totalIncome,
      ctx.household.current.totalExpenses,
      ctx.household.current.balance,
      ctx.currency,
    );
    if (hhInsight) results.push(hhInsight);

    const personalInsight = this.evaluateScope(
      'personal',
      ctx.personal.current.totalIncome,
      ctx.personal.current.totalExpenses,
      ctx.personal.current.balance,
      ctx.currency,
    );
    if (personalInsight) results.push(personalInsight);

    return results.length ? results : null;
  }

  private evaluateScope(
    scope: 'household' | 'personal',
    totalIncome: number,
    totalExpenses: number,
    balance: number,
    currency: string,
  ): InsightDto | null {
    if (totalIncome <= 0 && totalExpenses <= 0) return null;

    const positive = balance >= 0;
    const valor = formatMoney(Math.abs(balance), currency);

    let message: string;
    if (scope === 'household') {
      message = positive
        ? `O saldo do grupo no mês ficou positivo em ${valor}.`
        : `O saldo do grupo no mês ficou negativo em ${valor}.`;
    } else {
      message = positive
        ? `Seu saldo no mês ficou positivo em ${valor}.`
        : `Seu saldo no mês ficou negativo em ${valor}.`;
    }

    return {
      id: `monthly_balance:${scope}`,
      rule: 'monthly_balance',
      scope,
      tone: positive ? 'success' : 'warning',
      title: positive ? 'Saldo positivo' : 'Saldo negativo',
      message,
      priority: 75,
      metadata: {
        balance,
        currency,
      },
    };
  }
}
