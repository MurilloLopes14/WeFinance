import { InsightDto } from '../dto/insight-response.dto';
import { formatMoney } from '../insights.helpers';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class SubscriptionVsCommonRule implements InsightRule {
  readonly key = 'subscription_vs_common';

  evaluate(ctx: InsightsContext): InsightDto | null {
    const { subscriptions, current } = ctx.household;

    const hasSubsWithCategory = subscriptions.some(
      (s) => s.type === 'expense' && s.categoryId !== null,
    );
    if (!hasSubsWithCategory) return null;
    if (current.subscriptionSpent <= current.commonSpent) return null;
    if (current.commonSpent <= 0) return null;

    const sub = formatMoney(current.subscriptionSpent, ctx.currency);
    const common = formatMoney(current.commonSpent, ctx.currency);

    return {
      id: 'subscription_vs_common:household',
      rule: 'subscription_vs_common',
      scope: 'household',
      tone: 'warning',
      title: 'Fixos superam gastos comuns',
      message: `Os gastos com despesas fixas superam as transações comuns do grupo neste mês (${sub} vs ${common}).`,
      priority: 65,
      metadata: {
        subscriptionAmount: current.subscriptionSpent,
        commonAmount: current.commonSpent,
        currency: ctx.currency,
      },
    };
  }
}
