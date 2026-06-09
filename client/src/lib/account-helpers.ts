import type { AccountResponseDto } from '@/api/generated/models/accountResponseDto'
import type { AccountResponseDtoType } from '@/api/generated/models/accountResponseDtoType'

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

export function getAccountCurrency(
  account: AccountResponseDto,
  householdCurrencyById: Record<string, string | undefined>,
): string {
  return householdCurrencyById[account.householdId] ?? 'BRL'
}
