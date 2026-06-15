import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import { Badge } from '@/components/ui/badge'
import {
  formatTransactionAmount,
  formatTransactionDate,
  getTransactionAmountClassName,
  getTransactionTypeLabel,
} from '@/lib/transaction-helpers'
import { cn } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'

export type TransactionTableMeta = {
  accountNameById: Record<string, string | undefined>
  categoryNameById: Record<string, string | undefined>
  currency: string
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
        <span
          className={cn(
            'block text-right font-medium tabular-nums',
            getTransactionAmountClassName(row.original.type),
          )}
        >
          {formatTransactionAmount(row.original.amount, row.original.type, meta.currency)}
        </span>
      ),
    },
  ]
}
