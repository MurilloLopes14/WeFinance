import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import { TransactionCard } from '@/components/transactions/transaction-card'
import type { TransactionTableMeta } from '@/components/transactions/transaction-columns'

type TransactionCardListProps = {
  transactions: TransactionResponseDto[]
  meta: TransactionTableMeta
  emptyMessage?: string
}

export function TransactionCardList({
  transactions,
  meta,
  emptyMessage = 'Nenhuma transação nesta página.',
}: TransactionCardListProps) {
  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <ul className="flex w-full flex-col gap-2.5">
      {transactions.map((transaction) => {
        const canMutate = meta.canMutateTransaction(transaction)

        return (
          <li key={transaction.id}>
            <TransactionCard
              transaction={transaction}
              currency={meta.currency}
              accountName={meta.accountNameById[transaction.accountId]}
              categoryName={
                transaction.categoryId
                  ? meta.categoryNameById[transaction.categoryId]
                  : undefined
              }
              onEdit={canMutate ? meta.onEdit : undefined}
              onDelete={canMutate ? meta.onDelete : undefined}
            />
          </li>
        )
      })}
    </ul>
  )
}
