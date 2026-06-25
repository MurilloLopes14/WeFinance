import { InsightDto } from '../dto/insight-response.dto';
import { formatMoney } from '../insights.helpers';
import { InvestmentAccountItem, InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class InvestmentYieldRule implements InsightRule {
  readonly key = 'investment_yield';

  evaluate(ctx: InsightsContext): InsightDto[] | null {
    const { investmentAccounts, currency } = ctx;
    if (!investmentAccounts.length) return null;

    const today = new Date();
    const insights: InsightDto[] = [];

    for (const acc of investmentAccounts) {
      const maturityDate = acc.maturityDate ? new Date(acc.maturityDate) : null;

      if (maturityDate) {
        const daysLeft = Math.ceil((maturityDate.getTime() - today.getTime()) / 86_400_000);

        if (daysLeft <= 0) {
          insights.push({
            id: `${this.key}:matured:${acc.id}`,
            rule: this.key,
            scope: 'household',
            tone: 'warning',
            priority: 85,
            title: `Investimento "${acc.name}" venceu`,
            message: `O prazo deste investimento encerrou. Verifique o saldo e registre os rendimentos recebidos.`,
            metadata: { accountId: acc.id },
          });
          continue;
        }

        if (daysLeft <= 30) {
          const projected = calcProjection(acc, today, maturityDate);
          const yieldAmt = projected - acc.balance;
          insights.push({
            id: `${this.key}:maturing:${acc.id}`,
            rule: this.key,
            scope: 'household',
            tone: 'info',
            priority: 80,
            title: `"${acc.name}" vence em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`,
            message: `Saldo estimado no vencimento: ${formatMoney(projected, currency)} (rendimento de ${formatMoney(yieldAmt, currency)}).`,
            metadata: { accountId: acc.id, projectedBalance: parseFloat(projected.toFixed(2)), projectedYield: parseFloat(yieldAmt.toFixed(2)) },
          });
          continue;
        }
      }

      const targetDate = maturityDate ?? addYears(today, 1);
      const label = maturityDate ? 'vencimento' : '1 ano';
      const projected = calcProjection(acc, today, targetDate);
      const yieldAmt = projected - acc.balance;
      insights.push({
        id: `${this.key}:projection:${acc.id}`,
        rule: this.key,
        scope: 'household',
        tone: 'neutral',
        priority: 35,
        title: `Projeção — ${acc.name}`,
        message: `Estimativa de ${formatMoney(projected, currency)} até ${label} (${formatMoney(yieldAmt, currency)} de rendimento a ${acc.yieldPercent}% a.a.).`,
        metadata: { accountId: acc.id, projectedBalance: parseFloat(projected.toFixed(2)), projectedYield: parseFloat(yieldAmt.toFixed(2)) },
      });
    }

    return insights.length ? insights : null;
  }
}

function calcProjection(acc: InvestmentAccountItem, from: Date, to: Date): number {
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  const annualRate = acc.yieldPercent / 100;

  switch (acc.yieldGranularity) {
    case 'daily':
      return acc.balance * Math.pow(1 + annualRate / 365, days);
    case 'monthly':
      return acc.balance * Math.pow(1 + annualRate / 12, days / 30.4375);
    case 'annual':
      return acc.balance * Math.pow(1 + annualRate, days / 365.25);
  }
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}
