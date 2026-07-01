import type { AccountResponseDto } from '@/api/generated/models/accountResponseDto'
import type { AccountResponseDtoType } from '@/api/generated/models/accountResponseDtoType'
import type { CreateAccountDtoYieldGranularity } from '@/api/generated/models/createAccountDtoYieldGranularity'

export function getAccountTypeLabel(type: AccountResponseDtoType): string {
  switch (type) {
    case 'checking':
      return 'Corrente'
    case 'savings':
      return 'Poupança'
    case 'credit':
      return 'Crédito'
    case 'cash':
      return 'Dinheiro'
    case 'investment':
      return 'Investimento'
    default:
      return type
  }
}

export function formatAccountBalance(
  balance: number,
  currency = 'BRL',
): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(balance)
}

/** Valor enxuto para badges: 5k, 1,5m, 2b… */
export function formatCompactAmount(value: number, locale = 'pt-BR'): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs < 1_000) {
    return `${sign}${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(abs)}`
  }

  const units = [
    { threshold: 1_000_000_000, suffix: 'b' },
    { threshold: 1_000_000, suffix: 'm' },
    { threshold: 1_000, suffix: 'k' },
  ] as const

  for (const { threshold, suffix } of units) {
    if (abs >= threshold) {
      const scaled = abs / threshold
      const formatted = new Intl.NumberFormat(locale, {
        maximumFractionDigits: scaled >= 10 ? 0 : 1,
      }).format(scaled)

      return `${sign}${formatted}${suffix}`
    }
  }

  return `${sign}${abs}`
}

export function formatAccountCreditLimitLabel(limit: number): string {
  return `limite de ${formatCompactAmount(limit)}`
}

export function getAccountCurrency(
  account: AccountResponseDto,
  householdCurrencyById: Record<string, string | undefined>,
): string {
  return householdCurrencyById[account.householdId] ?? 'BRL'
}

export function getYieldGranularityLabel(
  granularity: CreateAccountDtoYieldGranularity,
): string {
  switch (granularity) {
    case 'daily':
      return 'Dia'
    case 'monthly':
      return 'Mês'
    case 'annual':
      return 'Ano'
    default:
      return granularity
  }
}

export const yieldGranularityFormOptions = [
  { value: 'daily' as const, label: 'Dia' },
  { value: 'monthly' as const, label: 'Mês' },
  { value: 'annual' as const, label: 'Ano' },
] as const
