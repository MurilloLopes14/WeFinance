import type { SubscriptionResponseDto } from '@/api/generated/models/subscriptionResponseDto'
import type { SubscriptionResponseDtoCadenceUnit } from '@/api/generated/models/subscriptionResponseDtoCadenceUnit'
import type { SubscriptionResponseDtoType } from '@/api/generated/models/subscriptionResponseDtoType'
import { formatTransactionDate } from '@/lib/transaction-helpers'

export function getSubscriptionTypeLabel(type: SubscriptionResponseDtoType): string {
  return type === 'income' ? 'Receita' : 'Despesa'
}

export function getSubscriptionCadenceUnitLabel(
  unit: SubscriptionResponseDtoCadenceUnit,
  every = 1,
): string {
  const plural = every > 1

  switch (unit) {
    case 'day':
      return plural ? 'dias' : 'dia'
    case 'week':
      return plural ? 'semanas' : 'semana'
    case 'month':
      return plural ? 'meses' : 'mês'
    case 'year':
      return plural ? 'anos' : 'ano'
    default:
      return unit
  }
}

export function formatSubscriptionCadence(
  unit: SubscriptionResponseDtoCadenceUnit,
  every: number,
): string {
  if (every === 1) {
    switch (unit) {
      case 'day':
        return 'Diária'
      case 'week':
        return 'Semanal'
      case 'month':
        return 'Mensal'
      case 'year':
        return 'Anual'
      default:
        return unit
    }
  }

  return `A cada ${every} ${getSubscriptionCadenceUnitLabel(unit, every)}`
}

export function formatSubscriptionNextRun(date: string): string {
  return formatTransactionDate(date)
}

export function getSubscriptionAccentColor(type: SubscriptionResponseDtoType): string {
  return type === 'income' ? 'var(--glow-success)' : 'var(--glow-danger)'
}

export function findSubscriptionInList(
  subscriptions: SubscriptionResponseDto[],
  subscriptionId: string,
): SubscriptionResponseDto | undefined {
  return subscriptions.find((subscription) => subscription.id === subscriptionId)
}
