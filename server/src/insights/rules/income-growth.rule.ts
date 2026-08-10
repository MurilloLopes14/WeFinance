import { InsightDto } from '../dto/insight-response.dto';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';
import { formatMoney, roundPct } from '../insights.helpers';

const MIN_DELTA = 100;
const GROWTH_THRESHOLD = 0.15;

export class IncomeGrowthRule implements InsightRule {
  readonly key = 'income_growth';

  evaluate(ctx: InsightsContext): InsightDto | null {
    const { personal, currency } = ctx;

    const current = personal.current.totalIncome;
    const previous = personal.previous.totalIncome;

    if (previous === 0 || current === 0) return null;

    const delta = current - previous;
    const pct = delta / previous;

    if (pct < GROWTH_THRESHOLD || delta < MIN_DELTA) return null;

    return {
      id: `${this.key}:${ctx.month}`,
      rule: this.key,
      scope: 'personal',
      tone: 'success',
      priority: 75,
      title: 'Receita pessoal em alta',
      message: `Sua receita cresceu ${roundPct(pct * 100)}% em relação ao mês anterior (${formatMoney(previous, currency)} → ${formatMoney(current, currency)}).`,
      metadata: {
        amount: current,
        previousAmount: previous,
        delta: parseFloat(delta.toFixed(2)),
        deltaPercent: roundPct(pct * 100),
        currency,
      },
    };
  }
}
