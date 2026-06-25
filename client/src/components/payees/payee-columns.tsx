import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'
import { ObjectCardActionsMenu } from '@/components/object/object-card-actions-menu'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

export type PayeeTableMeta = {
  householdNameById: Record<string, string | undefined>
  categoryNameById: Record<string, string | undefined>
  showHouseholdColumn: boolean
  canManagePayee: (payee: PayeeResponseDto) => boolean
  onEdit: (payee: PayeeResponseDto) => void
  onDelete: (payee: PayeeResponseDto) => void
}

export function createPayeeColumns(meta: PayeeTableMeta): ColumnDef<PayeeResponseDto>[] {
  const columns: ColumnDef<PayeeResponseDto>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <span className="max-w-[220px] truncate font-medium">{row.original.name}</span>
      ),
    },
  ]

  if (meta.showHouseholdColumn) {
    columns.push({
      accessorKey: 'householdId',
      header: 'Grupo',
      cell: ({ row }) => (
        <Badge variant="outline" className="max-w-[160px] truncate rounded-md">
          {meta.householdNameById[row.original.householdId] ?? '—'}
        </Badge>
      ),
    })
  }

  columns.push(
    {
      accessorKey: 'defaultCategoryId',
      header: 'Categoria padrão',
      cell: ({ row }) => {
        const categoryId =
          typeof row.original.defaultCategoryId === 'string'
            ? row.original.defaultCategoryId
            : undefined

        return (
          <span className="max-w-[180px] truncate text-muted-foreground">
            {categoryId ? (meta.categoryNameById[categoryId] ?? '—') : '—'}
          </span>
        )
      },
    },
    {
      accessorKey: 'regexRule',
      header: 'Regra de importação',
      cell: ({ row }) => {
        const regexRule =
          typeof row.original.regexRule === 'string' ? row.original.regexRule : undefined

        return (
          <span
            className="max-w-[200px] truncate font-mono text-xs text-muted-foreground"
            title={regexRule}
          >
            {regexRule ?? '—'}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => {
        if (!meta.canManagePayee(row.original)) return null

        return (
          <div className="flex justify-end">
            <ObjectCardActionsMenu
              actions={[
                {
                  id: 'edit',
                  label: `Editar ${row.original.name}`,
                  icon: Pencil,
                  onClick: () => meta.onEdit(row.original),
                },
                {
                  id: 'delete',
                  label: `Excluir ${row.original.name}`,
                  icon: Trash2,
                  variant: 'destructive',
                  onClick: () => meta.onDelete(row.original),
                },
              ]}
            />
          </div>
        )
      },
    },
  )

  return columns
}
