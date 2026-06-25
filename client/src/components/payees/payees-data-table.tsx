import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'
import { DataTable } from '@/components/data-table/data-table'
import { TablePaginationFooter } from '@/components/data-table/table-pagination-footer'
import { PayeeCardList } from '@/components/payees/payee-card-list'
import {
  createPayeeColumns,
  type PayeeTableMeta,
} from '@/components/payees/payee-columns'
import { useMemo } from 'react'

type PayeesDataTableProps = {
  payees: PayeeResponseDto[]
  meta: PayeeTableMeta
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

export function PayeesDataTable({
  payees,
  meta,
  page,
  totalPages,
  total,
  onPageChange,
}: PayeesDataTableProps) {
  const columns = useMemo(() => createPayeeColumns(meta), [meta])

  const summary =
    total === 0
      ? 'Nenhum pagador ou recebedor'
      : `${total} ${total === 1 ? 'registro' : 'registros'} · Página ${page} de ${totalPages}`

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="md:hidden">
        <PayeeCardList
          payees={payees}
          householdNameById={meta.householdNameById}
          categoryNameById={meta.categoryNameById}
          showHousehold={meta.showHouseholdColumn}
          canManagePayee={meta.canManagePayee}
          onEdit={meta.onEdit}
          onDelete={meta.onDelete}
        />
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={payees}
          emptyMessage="Nenhum pagador nesta página."
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
