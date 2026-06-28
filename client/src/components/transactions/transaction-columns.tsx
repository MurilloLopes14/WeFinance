import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import { ObjectCardActionsMenu } from '@/components/object/object-card-actions-menu'
import { Badge } from '@/components/ui/badge'
import { TransactionOwnerAvatar } from '@/components/transactions/transaction-owner-avatar'
import {
  formatTransactionAmount,
  formatTransactionDate,
  getTransactionAmountClassName,
  getTransactionTypeLabel,
} from '@/lib/transaction-helpers'
import { SensitiveValue } from '@/components/privacy/sensitive-value'
import { cn } from '@/lib/utils'
import { Pencil, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

export type TransactionTableMeta = {
  accountNameById: Record<string, string | undefined>
  categoryNameById: Record<string, string | undefined>
  currency: string
  canMutateTransaction: (transaction: TransactionResponseDto) => boolean
  onEdit: (transaction: TransactionResponseDto) => void
  onDelete: (transaction: TransactionResponseDto) => void
}

export function createTransactionColumns(
  meta: TransactionTableMeta,
): ColumnDef<TransactionResponseDto>[] {
  return [
    {
      accessorKey: 'date',
      header: 'Data',
      cell: ({ row }) => (
        <span className="tabular-nums">{formatTransactionDate(row.original.date)}</span>
      ),
    },
    {
      accessorKey: 'owner',
      header: 'Responsável',
      cell: ({ row }) => (
        <TransactionOwnerAvatar owner={row.original.owner} showName />
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => (
        <span className="max-w-[220px] truncate font-medium">
          {row.original.description?.trim() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="secondary" className="rounded-md">
          {getTransactionTypeLabel(row.original.type)}
        </Badge>
      ),
    },
    {
      accessorKey: 'accountId',
      header: 'Conta',
      cell: ({ row }) => (
        <span className="max-w-[140px] truncate text-muted-foreground">
          {meta.accountNameById[row.original.accountId] ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'categoryId',
      header: 'Categoria',
      cell: ({ row }) => (
        <span className="max-w-[140px] truncate text-muted-foreground">
          {row.original.categoryId
            ? (meta.categoryNameById[row.original.categoryId] ?? '—')
            : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: () => <span className="block text-right">Valor</span>,
      cell: ({ row }) => (
        <SensitiveValue
          size="md"
          className={cn(
            'block text-right font-medium tabular-nums',
            getTransactionAmountClassName(row.original.type),
          )}
        >
          {formatTransactionAmount(row.original.amount, row.original.type, meta.currency)}
        </SensitiveValue>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => {
        if (!meta.canMutateTransaction(row.original)) return null

        const label =
          row.original.description?.trim() || getTransactionTypeLabel(row.original.type)

        return (
          <div className="flex justify-end">
            <ObjectCardActionsMenu
              actions={[
                {
                  id: 'edit',
                  label: `Editar ${label}`,
                  icon: Pencil,
                  onClick: () => meta.onEdit(row.original),
                },
                {
                  id: 'delete',
                  label: `Excluir ${label}`,
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
  ]
}
