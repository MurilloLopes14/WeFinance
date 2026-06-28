import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import { ObjectCardActionsMenu, type ObjectCardAction } from '@/components/object/object-card-actions-menu'
import { TransactionOwnerAvatar } from '@/components/transactions/transaction-owner-avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  formatTransactionAmount,
  formatTransactionDate,
  getTransactionAmountClassName,
  getTransactionTypeLabel,
} from '@/lib/transaction-helpers'
import { SensitiveValue } from '@/components/privacy/sensitive-value'
import { cn } from '@/lib/utils'
import { Pencil, Trash2 } from 'lucide-react'

type TransactionCardProps = {
  transaction: TransactionResponseDto
  accountName?: string
  categoryName?: string
  currency: string
  onEdit?: (transaction: TransactionResponseDto) => void
  onDelete?: (transaction: TransactionResponseDto) => void
  className?: string
}

export function TransactionCard({
  transaction,
  accountName,
  categoryName,
  currency,
  onEdit,
  onDelete,
  className,
}: TransactionCardProps) {
  const description =
    transaction.description?.trim() || getTransactionTypeLabel(transaction.type)

  const actions: ObjectCardAction[] = []

  if (onEdit) {
    actions.push({
      id: 'edit',
      label: `Editar ${description}`,
      icon: Pencil,
      onClick: () => onEdit(transaction),
    })
  }

  if (onDelete) {
    actions.push({
      id: 'delete',
      label: `Excluir ${description}`,
      icon: Trash2,
      variant: 'destructive',
      onClick: () => onDelete(transaction),
    })
  }

  return (
    <Card
      size="sm"
      className={cn('glass-subtle w-full gap-0 py-3.5 ring-1 ring-foreground/10', className)}
    >
      <div className="flex min-w-0 items-start gap-3 px-4">
        <TransactionOwnerAvatar owner={transaction.owner} size="default" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="line-clamp-2 text-sm font-medium leading-snug">{description}</p>
            <div className="flex shrink-0 items-start gap-1">
              <SensitiveValue
                size="md"
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  getTransactionAmountClassName(transaction.type),
                )}
              >
                {formatTransactionAmount(transaction.amount, transaction.type, currency)}
              </SensitiveValue>
              {actions.length > 0 ? <ObjectCardActionsMenu actions={actions} /> : null}
            </div>
          </div>

          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {formatTransactionDate(transaction.date)}
          </p>

          <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="h-5 rounded-md px-1.5 py-0 text-[11px]">
              {getTransactionTypeLabel(transaction.type)}
            </Badge>
            {accountName ? (
              <Badge
                variant="outline"
                className="h-5 max-w-[46%] truncate rounded-md px-1.5 py-0 text-[11px]"
              >
                {accountName}
              </Badge>
            ) : null}
            {categoryName ? (
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                {categoryName}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
