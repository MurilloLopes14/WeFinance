import { InsightDto, InsightScope } from '../dto/insight-response.dto';
import { CategoryBucket, InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';
import { formatMoney, roundPct } from '../insights.helpers';

const MIN_AMOUNT = 50;
const SPIKE_THRESHOLD = 0.5;
const MAX_SPIKES = 2;

export class CategorySpikeRule implements InsightRule {
  readonly key = 'category_spike';

  evaluate(ctx: InsightsContext): InsightDto[] | null {
    const insights: InsightDto[] = [];

    insights.push(...this.spikesFor(ctx, 'household', ctx.household.current.expensesByCategory, ctx.household.previous.expensesByCategory, ctx.currency));
    insights.push(...this.spikesFor(ctx, 'personal', ctx.personal.current.expensesByCategory, ctx.personal.previous.expensesByCategory, ctx.currency));

    return insights.length ? insights : null;
  }

  private spikesFor(
    ctx: InsightsContext,
    scope: InsightScope,
    current: CategoryBucket[],
    previous: CategoryBucket[],
    currency: string,
  ): InsightDto[] {
    const prevMap = new Map(
      previous
        .filter((c) => c.categoryId !== null)
        .map((c) => [c.categoryId!, c.amount]),
    );

    return current
      .filter((c) => c.categoryId !== null && c.amount >= MIN_AMOUNT)
      .map((c) => {
        const prev = prevMap.get(c.categoryId!) ?? 0;
        if (prev < MIN_AMOUNT) return null;
        const delta = c.amount - prev;
        const pct = delta / prev;
        if (pct < SPIKE_THRESHOLD) return null;
        return { ...c, prev, delta, pct };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, MAX_SPIKES)
      .map((s) => ({
        id: `${this.key}:${scope}:${s.categoryId}`,
        rule: this.key,
        scope,
        tone: 'warning' as const,
        priority: 78,
        title: `Gasto em ${s.categoryName} disparou`,
        message: scope === 'personal'
          ? `Sua categoria ${s.categoryName} subiu ${roundPct(s.pct * 100)}% em relação ao mês anterior (${formatMoney(s.prev, currency)} → ${formatMoney(s.amount, currency)}).`
          : `A categoria ${s.categoryName} subiu ${roundPct(s.pct * 100)}% em relação ao mês anterior (${formatMoney(s.prev, currency)} → ${formatMoney(s.amount, currency)}).`,
        metadata: {
          categoryId: s.categoryId!,
          categoryName: s.categoryName,
          amount: s.amount,
          previousAmount: s.prev,
          delta: parseFloat(s.delta.toFixed(2)),
          deltaPercent: roundPct(s.pct * 100),
          currency,
        },
      }));
  }
}
