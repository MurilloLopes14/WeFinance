import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import {
  createTransactionColumns,
  type TransactionTableMeta,
} from '@/components/transactions/transaction-columns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

  return (
    <div className="flex w-full flex-col gap-4">
      <DataTable
        columns={columns}
        data={transactions}
        emptyMessage="Nenhuma transação nesta página."
      />

      {totalPages > 0 && (
        <div className="flex flex-col gap-3 border-t border-foreground/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? 'Nenhuma transação'
              : `${total} ${total === 1 ? 'transação' : 'transações'} · Página ${page} de ${totalPages}`}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Próxima
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
