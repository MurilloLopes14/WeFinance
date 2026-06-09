import type { TransactionResponseDtoType } from '@/api/generated/models/transactionResponseDtoType'
import type { TransactionResponseDtoStatus } from '@/api/generated/models/transactionResponseDtoStatus'
import { formatAccountBalance } from '@/lib/account-helpers'

export function getTransactionTypeLabel(type: TransactionResponseDtoType): string {
  switch (type) {
    case 'expense':
      return 'Despesa'
    case 'income':
      return 'Receita'
    case 'transfer':
      return 'Transferência'
    default:
      return type
  }
}

export function getTransactionStatusLabel(status: TransactionResponseDtoStatus): string {
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'cleared':
      return 'Confirmada'
    case 'reconciled':
      return 'Conciliada'
    default:
      return status
  }
}

export function formatTransactionDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

export function formatTransactionAmount(
  amount: number,
  type: TransactionResponseDtoType,
  currency = 'BRL',
): string {
  const formatted = formatAccountBalance(Math.abs(amount), currency)

  if (type === 'expense') return `-${formatted}`
  if (type === 'income') return `+${formatted}`
  return formatted
}

export function getTransactionAmountClassName(type: TransactionResponseDtoType): string {
  switch (type) {
    case 'expense':
      return 'text-destructive'
    case 'income':
      return 'text-emerald-600 dark:text-emerald-400'
    default:
      return 'text-foreground'
  }
}

export function getCurrentMonthParam(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}
