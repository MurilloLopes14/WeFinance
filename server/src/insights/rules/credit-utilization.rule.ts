import { InsightDto } from '../dto/insight-response.dto';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';
import { formatMoney, roundPct } from '../insights.helpers';

const WARN_THRESHOLD = 0.7;
const CRITICAL_THRESHOLD = 0.9;

export class CreditUtilizationRule implements InsightRule {
  readonly key = 'credit_utilization';

  evaluate(ctx: InsightsContext): InsightDto[] | null {
    const { creditAccounts, currency } = ctx;
    if (!creditAccounts.length) return null;

    const insights: InsightDto[] = [];

    for (const acc of creditAccounts) {
      const utilization = acc.toBeSpent / acc.creditLimit;
      if (utilization < WARN_THRESHOLD) continue;

      const pct = roundPct(utilization * 100);
      const available = parseFloat((acc.creditLimit - acc.toBeSpent).toFixed(2));
      const isCritical = utilization >= CRITICAL_THRESHOLD;

      insights.push({
        id: `${this.key}:${acc.id}`,
        rule: this.key,
        scope: 'household',
        tone: 'warning',
        priority: isCritical ? 92 : 85,
        title: isCritical
          ? `Limite do "${acc.name}" quase esgotado`
          : `Cartão "${acc.name}" com uso elevado`,
        message: `${pct}% do limite utilizado na fatura atual (${formatMoney(acc.toBeSpent, currency)} de ${formatMoney(acc.creditLimit, currency)}). Disponível: ${formatMoney(available, currency)}.`,
        metadata: {
          accountId: acc.id,
          amount: acc.toBeSpent,
          budgetUsed: acc.toBeSpent,
          budgetRemaining: available,
          budgetPercent: pct,
          currency,
        },
      });
    }

    return insights.length ? insights : null;
  }
}
