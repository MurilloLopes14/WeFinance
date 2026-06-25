import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SplitPreviewAvatarGroup } from '@/components/splits/split-preview-avatar-group'
import type { SplitTableRow } from '@/lib/split-table-helpers'
import { formatAccountBalance } from '@/lib/account-helpers'
import {
  formatTransactionAmount,
  formatTransactionDate,
  getTransactionAmountClassName,
  getTransactionTypeLabel,
} from '@/lib/transaction-helpers'
import { getUserInitials } from '@/lib/household-helpers'
import { cn } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'

export type SplitTableMeta = {
  categoryNameById: Record<string, string | undefined>
  currency: string
}

export function createSplitColumns(meta: SplitTableMeta): ColumnDef<SplitTableRow>[] {
  return [
    {
      accessorKey: 'date',
      header: 'Data',
      cell: ({ row }) => (
        <span
          className={cn(
            'tabular-nums',
            !row.original.isFirstInGroup && 'text-transparent select-none',
          )}
          aria-hidden={!row.original.isFirstInGroup}
        >
          {formatTransactionDate(row.original.date)}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Transação',
      cell: ({ row }) => (
        <span
          className={cn(
            'max-w-[200px] truncate',
            row.original.isFirstInGroup ? 'font-medium' : 'text-muted-foreground',
          )}
        >
          {row.original.isFirstInGroup
            ? row.original.description || '—'
            : '↳ mesma transação'}
        </span>
      ),
    },
    {
      accessorKey: 'splitPreview',
      header: 'Membros',
      cell: ({ row }) =>
        row.original.isFirstInGroup && row.original.splitPreview ? (
          <SplitPreviewAvatarGroup preview={row.original.splitPreview} size="sm" />
        ) : (
          <span className="text-transparent select-none" aria-hidden>
            —
          </span>
        ),
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) =>
        row.original.isFirstInGroup ? (
          <Badge variant="secondary" className="rounded-md">
            {getTransactionTypeLabel(row.original.type)}
          </Badge>
        ) : (
          <span className="text-transparent select-none" aria-hidden>
            —
          </span>
        ),
    },
    {
      accessorKey: 'transactionAmount',
      header: () => <span className="block text-right">Valor total</span>,
      cell: ({ row }) =>
        row.original.isFirstInGroup ? (
          <span
            className={cn(
              'block text-right font-medium tabular-nums',
              getTransactionAmountClassName(row.original.type),
            )}
          >
            {formatTransactionAmount(
              row.original.transactionAmount,
              row.original.type,
              meta.currency,
            )}
          </span>
        ) : (
          <span className="block text-right text-transparent select-none" aria-hidden>
            —
          </span>
        ),
    },
    {
      accessorKey: 'memberName',
      header: 'Membro',
      cell: ({ row }) => {
        const previewMember = row.original.splitPreview?.members.find(
          (member) => member.id === row.original.memberUserId,
        )

        return (
          <div className="flex items-center gap-2.5">
            <Avatar size="sm" className="border border-foreground/10">
              {previewMember?.avatarUrl ? (
                <AvatarImage src={previewMember.avatarUrl} alt={row.original.memberName} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                {getUserInitials(row.original.memberName)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[140px] truncate">{row.original.memberName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'share',
      header: () => <span className="block text-right">Parte</span>,
      cell: ({ row }) => (
        <span className="block text-right font-medium tabular-nums">
          {formatAccountBalance(row.original.share, meta.currency)}
        </span>
      ),
    },
    {
      accessorKey: 'sharePercent',
      header: () => <span className="block text-right">%</span>,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums text-muted-foreground">
          {row.original.sharePercent.toLocaleString('pt-BR', {
            maximumFractionDigits: 1,
          })}
          %
        </span>
      ),
    },
    {
      accessorKey: 'splitCategoryId',
      header: 'Categoria',
      cell: ({ row }) => (
        <span className="max-w-[120px] truncate text-muted-foreground">
          {row.original.splitCategoryId
            ? (meta.categoryNameById[row.original.splitCategoryId] ?? '—')
            : '—'}
        </span>
      ),
    },
  ]
}
