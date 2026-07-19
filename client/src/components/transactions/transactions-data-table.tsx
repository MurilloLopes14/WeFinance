import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import { DataTable } from '@/components/data-table/data-table'
import { TablePaginationFooter } from '@/components/data-table/table-pagination-footer'
import { TransactionCardList } from '@/components/transactions/transaction-card-list'
import {
  createTransactionColumns,
  type TransactionTableMeta,
} from '@/components/transactions/transaction-columns'
import { formatAccountBalance } from '@/lib/account-helpers'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

type TransactionsDataTableProps = {
  transactions: TransactionResponseDto[]
  meta: TransactionTableMeta
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

function sumVisibleTransactions(transactions: TransactionResponseDto[]): number {
  return transactions.reduce((acc, transaction) => {
    if (transaction.type === 'income') return acc + transaction.amount
    if (transaction.type === 'expense') return acc - transaction.amount
    return acc
  }, 0)
}

export function TransactionsDataTable({
  transactions,
  meta,
  page,
  totalPages,
  total,
  onPageChange,
}: TransactionsDataTableProps) {
  const columns = useMemo(() => createTransactionColumns(meta), [meta])

  const pageTotal = useMemo(
    () => sumVisibleTransactions(transactions),
    [transactions],
  )

  const summary =
    total === 0
      ? 'Nenhuma transação'
      : `${total} ${total === 1 ? 'transação' : 'transações'} · Página ${page} de ${totalPages}`

  const pageTotalLabel = formatAmountBalance(pageTotal, meta.currency)
  const pageTotalClassName =
    pageTotal > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : pageTotal < 0
        ? 'text-destructive'
        : 'text-muted-foreground'

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="md:hidden">
        <TransactionCardList transactions={transactions} meta={meta} />
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={transactions}
          emptyMessage="Nenhuma transação nesta página."
        />
      </div>

      <TablePaginationFooter
        summary={summary}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        trailing={
          transactions.length > 0 ? (
            <p className={cn('text-sm font-medium tabular-nums', pageTotalClassName)}>
              Soma da página: {pageTotalLabel}
            </p>
          ) : undefined
        }
      />
    </div>
  )
}

function formatAmountBalance(value: number, currency: string): string {
  const formatted = formatAccountBalance(Math.abs(value), currency)
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}
