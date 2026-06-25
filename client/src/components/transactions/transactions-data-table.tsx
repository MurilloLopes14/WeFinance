import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import { DataTable } from '@/components/data-table/data-table'
import { TablePaginationFooter } from '@/components/data-table/table-pagination-footer'
import { TransactionCardList } from '@/components/transactions/transaction-card-list'
import {
  createTransactionColumns,
  type TransactionTableMeta,
} from '@/components/transactions/transaction-columns'
import { useMemo } from 'react'

type TransactionsDataTableProps = {
  transactions: TransactionResponseDto[]
  meta: TransactionTableMeta
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
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

  const summary =
    total === 0
      ? 'Nenhuma transação'
      : `${total} ${total === 1 ? 'transação' : 'transações'} · Página ${page} de ${totalPages}`

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
      />
    </div>
  )
}
