import { InsightDto } from '../dto/insight-response.dto';
import { roundPct } from '../insights.helpers';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class PersonalSharedShareRule implements InsightRule {
  readonly key = 'personal_shared_share';

  evaluate(ctx: InsightsContext): InsightDto | null {
    const { sharedExpenseTotal, personalShareInShared, personalSharePercent } =
      ctx.personal.shared;

    if (sharedExpenseTotal <= 0) return null;

    const pct = roundPct(personalSharePercent);

    return {
      id: 'personal_shared_share:personal',
      rule: 'personal_shared_share',
      scope: 'personal',
      tone: 'info',
      title: 'Sua participação nos gastos compartilhados',
      message: `Você responde por ${pct}% dos gastos compartilhados do grupo neste mês.`,
      priority: 80,
      metadata: {
        personalSharePercent,
        amount: personalShareInShared,
        sharedExpenseTotal,
        currency: ctx.currency,
      },
    };
  }
}
