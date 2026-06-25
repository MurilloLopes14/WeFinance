import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'
import type { CreateTransactionDtoType } from '@/api/generated/models/createTransactionDtoType'

export function filterPayeesByQuery(
  payees: PayeeResponseDto[],
  query: string,
): PayeeResponseDto[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return payees

  return payees.filter((payee) => payee.name.toLowerCase().includes(normalized))
}

export function findPayeeByName(
  payees: PayeeResponseDto[],
  name: string,
): PayeeResponseDto | undefined {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return undefined

  return payees.find((payee) => payee.name.toLowerCase() === normalized)
}

export function getPayeePartyLabel(
  type: CreateTransactionDtoType | 'expense' | 'income',
): string {
  return type === 'income' ? 'recebedor' : 'pagador'
}
