export function creditInvoiceDueDay(closingDay: number): number {
  const due = closingDay + 7;
  return due > 31 ? due - 31 : due;
}

export function creditCycleStart(invoiceClosingDay: number): string {
  const today = new Date();
  const day = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (day >= invoiceClosingDay) {
    return `${year}-${pad(month)}-${pad(invoiceClosingDay)}`;
  }
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${pad(prevMonth)}-${pad(invoiceClosingDay)}`;
}
