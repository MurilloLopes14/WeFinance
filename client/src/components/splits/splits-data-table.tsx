import { DataTable } from '@/components/data-table/data-table'
import { TablePaginationFooter } from '@/components/data-table/table-pagination-footer'
import { SplitCardList } from '@/components/splits/split-card-list'
import {
  createSplitColumns,
  type SplitTableMeta,
} from '@/components/splits/split-columns'
import type { SplitTableRow } from '@/lib/split-table-helpers'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

type SplitsDataTableProps = {
  rows: SplitTableRow[]
  meta: SplitTableMeta
  page: number
  totalPages: number
  transactionsOnPage: number
  transactionsWithSplitsOnPage: number
  onPageChange: (page: number) => void
}

export function SplitsDataTable({
  rows,
  meta,
  page,
  totalPages,
  transactionsOnPage,
  transactionsWithSplitsOnPage,
  onPageChange,
}: SplitsDataTableProps) {
  const columns = useMemo(() => createSplitColumns(meta), [meta])

  const summary =
    rows.length === 0
      ? `${transactionsWithSplitsOnPage} de ${transactionsOnPage} transações com rateio nesta página`
      : `${rows.length} ${rows.length === 1 ? 'parcela' : 'parcelas'} · ${transactionsWithSplitsOnPage} ${transactionsWithSplitsOnPage === 1 ? 'transação' : 'transações'} com rateio · Página ${page} de ${totalPages}`

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="md:hidden">
        <SplitCardList
          rows={rows}
          categoryNameById={meta.categoryNameById}
          currency={meta.currency}
        />
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage="Nenhum rateio nesta página."
          getRowClassName={(row) =>
            cn(
              row.original.isFirstInGroup &&
                'border-l-2 border-primary/35 bg-primary/[0.03] hover:bg-primary/[0.05]',
              !row.original.isFirstInGroup && 'border-l-2 border-primary/35',
            )
          }
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
