import { SplitTransactionCard } from '@/components/splits/split-transaction-card'
import type { SplitTableRow } from '@/lib/split-table-helpers'
import { useMemo } from 'react'

type SplitCardListProps = {
  rows: SplitTableRow[]
  categoryNameById: Record<string, string | undefined>
  currency: string
  emptyMessage?: string
}

function groupSplitRows(rows: SplitTableRow[]): SplitTableRow[][] {
  const groups: SplitTableRow[][] = []
  let current: SplitTableRow[] = []

  for (const row of rows) {
    if (row.isFirstInGroup && current.length > 0) {
      groups.push(current)
      current = []
    }
    current.push(row)
  }

  if (current.length > 0) {
    groups.push(current)
  }

  return groups
}

export function SplitCardList({
  rows,
  categoryNameById,
  currency,
  emptyMessage = 'Nenhum rateio nesta página.',
}: SplitCardListProps) {
  const groups = useMemo(() => groupSplitRows(rows), [rows])

  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <ul className="flex w-full flex-col gap-3">
      {groups.map((group) => {
        const transactionId = group[0]?.transactionId
        return (
          <li key={transactionId}>
            <SplitTransactionCard
              rows={group}
              categoryNameById={categoryNameById}
              currency={currency}
            />
          </li>
        )
      })}
    </ul>
  )
}
