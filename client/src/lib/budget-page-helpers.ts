import { formatInsightMonthLabel } from '@/lib/insight-helpers'
import { getCurrentMonthParam } from '@/lib/transaction-helpers'

export function formatBudgetMonthLabel(month: string): string {
  return formatInsightMonthLabel(month)
}

export function parseBudgetAmountInput(value: string): number | null | undefined {
  const trimmed = value.trim()
  if (!trimmed) return null

  const amount = Number(trimmed.replace(',', '.'))
  if (Number.isNaN(amount)) return undefined
  if (amount < 0.01) return undefined

  return amount
}

export function formatBudgetAmountForInput(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return ''
  return String(value)
}

export function isCurrentBudgetMonth(month: string): boolean {
  return month === getCurrentMonthParam()
}

export function formatBudgetCurrency(amount: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amount)
}
