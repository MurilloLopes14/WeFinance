export { currentMonth, monthDateRange, previousMonth } from '../common/utils/month.utils';

export function formatMoney(amount: number, currency: string): string {
  const locales: Record<string, string> = { BRL: 'pt-BR' };
  const locale = locales[currency] ?? 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function roundPct(value: number, decimals = 1): number {
  return parseFloat(value.toFixed(decimals));
}
