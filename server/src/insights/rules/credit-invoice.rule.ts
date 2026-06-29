import { InsightDto } from '../dto/insight-response.dto';
import { InsightsContext } from '../insights.types';
import { InsightRule } from './insight-rule.interface';

export class CreditInvoiceRule implements InsightRule {
  readonly key = 'credit_invoice';

  evaluate(ctx: InsightsContext): InsightDto[] | null {
    const { creditAccounts } = ctx;
    if (!creditAccounts.length) return null;

    const today = new Date();
    const todayDay = today.getDate();
    const insights: InsightDto[] = [];

    for (const acc of creditAccounts) {
      const daysUntilClosing = closingDaysFromNow(acc.invoiceClosingDay, todayDay);

      if (daysUntilClosing > 3) continue;

      const dueDay = invoiceDueDay(acc.invoiceClosingDay);
      const dueText = ` Pague até o dia ${dueDay}.`;

      if (daysUntilClosing === 0) {
        insights.push({
          id: `${this.key}:closing:${acc.id}`,
          rule: this.key,
          scope: 'household',
          tone: 'warning',
          priority: 88,
          title: `Fatura do "${acc.name}" fecha hoje`,
          message: `A fatura do cartão fecha hoje.${dueText}`,
          metadata: { accountId: acc.id, invoiceClosingDay: acc.invoiceClosingDay, invoiceDueDay: dueDay },
        });
      } else {
        insights.push({
          id: `${this.key}:closing:${acc.id}`,
          rule: this.key,
          scope: 'household',
          tone: 'warning',
          priority: 88,
          title: `Fatura do "${acc.name}" fecha em ${daysUntilClosing} dia${daysUntilClosing > 1 ? 's' : ''}`,
          message: `A fatura do cartão fecha no dia ${acc.invoiceClosingDay}.${dueText}`,
          metadata: { accountId: acc.id, invoiceClosingDay: acc.invoiceClosingDay, invoiceDueDay: dueDay },
        });
      }
    }

    return insights.length ? insights : null;
  }
}

function invoiceDueDay(closingDay: number): number {
  const due = closingDay + 7;
  return due > 31 ? due - 31 : due;
}

function closingDaysFromNow(closingDay: number, todayDay: number): number {
  if (closingDay >= todayDay) return closingDay - todayDay;
  // Closing day is in the next month — compute days remaining in month + closing day
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return daysInMonth - todayDay + closingDay;
}
