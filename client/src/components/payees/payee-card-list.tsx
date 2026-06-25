import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'
import { PayeeCard } from '@/components/payees/payee-card'

type PayeeCardListProps = {
  payees: PayeeResponseDto[]
  householdNameById: Record<string, string | undefined>
  categoryNameById: Record<string, string | undefined>
  showHousehold: boolean
  canManagePayee: (payee: PayeeResponseDto) => boolean
  onEdit: (payee: PayeeResponseDto) => void
  onDelete: (payee: PayeeResponseDto) => void
  emptyMessage?: string
}

export function PayeeCardList({
  payees,
  householdNameById,
  categoryNameById,
  showHousehold,
  canManagePayee,
  onEdit,
  onDelete,
  emptyMessage = 'Nenhum pagador nesta página.',
}: PayeeCardListProps) {
  if (payees.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <ul className="flex w-full flex-col gap-3">
      {payees.map((payee) => {
        const categoryId =
          typeof payee.defaultCategoryId === 'string' ? payee.defaultCategoryId : undefined

        return (
          <li key={payee.id}>
            <PayeeCard
              payee={payee}
              householdName={householdNameById[payee.householdId]}
              categoryName={categoryId ? categoryNameById[categoryId] : undefined}
              showHousehold={showHousehold}
              onEdit={canManagePayee(payee) ? onEdit : undefined}
              onDelete={canManagePayee(payee) ? onDelete : undefined}
            />
          </li>
        )
      })}
    </ul>
  )
}
