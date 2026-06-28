import { SplitPreviewAvatarGroup } from '@/components/splits/split-preview-avatar-group'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { formatAccountBalance } from '@/lib/account-helpers'
import { getUserInitials } from '@/lib/household-helpers'
import type { SplitTableRow } from '@/lib/split-table-helpers'
import {
  formatTransactionAmount,
  formatTransactionDate,
  getTransactionAmountClassName,
  getTransactionTypeLabel,
} from '@/lib/transaction-helpers'
import { SensitiveValue } from '@/components/privacy/sensitive-value'
import { cn } from '@/lib/utils'

type SplitTransactionCardProps = {
  rows: SplitTableRow[]
  categoryNameById: Record<string, string | undefined>
  currency: string
  className?: string
}

export function SplitTransactionCard({
  rows,
  categoryNameById,
  currency,
  className,
}: SplitTransactionCardProps) {
  const header = rows.find((row) => row.isFirstInGroup) ?? rows[0]
  if (!header) return null

  const description = header.description || 'Sem descrição'

  return (
    <Card
      size="sm"
      className={cn(
        'glass-subtle w-full gap-0 overflow-hidden border-l-2 border-primary/40 py-0 ring-1 ring-foreground/10',
        className,
      )}
    >
      <div className="space-y-3 px-4 py-3.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="line-clamp-2 text-sm leading-snug font-medium">
              {description}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="h-5 rounded-md px-1.5 py-0 text-[11px]">
                {getTransactionTypeLabel(header.type)}
              </Badge>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatTransactionDate(header.date)}
              </span>
            </div>
          </div>

          <SensitiveValue
            size="md"
            className={cn(
              'shrink-0 text-sm font-semibold tabular-nums',
              getTransactionAmountClassName(header.type),
            )}
          >
            {formatTransactionAmount(header.transactionAmount, header.type, currency)}
          </SensitiveValue>
        </div>

        {header.splitPreview ? (
          <SplitPreviewAvatarGroup preview={header.splitPreview} size="sm" />
        ) : null}
      </div>

      <ul className="divide-y divide-foreground/8 border-t border-foreground/8 bg-foreground/[0.02]">
        {rows.map((row) => {
          const previewMember = row.splitPreview?.members.find(
            (member) => member.id === row.memberUserId,
          )
          const rowCategoryName = row.splitCategoryId
            ? categoryNameById[row.splitCategoryId]
            : undefined

          return (
            <li
              key={row.rowKey}
              className="flex min-w-0 items-center gap-3 px-4 py-2.5"
            >
              <Avatar size="sm" className="border border-foreground/10">
                {previewMember?.avatarUrl ? (
                  <AvatarImage src={previewMember.avatarUrl} alt={row.memberName} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                  {getUserInitials(row.memberName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.memberName}</p>
                {rowCategoryName ? (
                  <p className="truncate text-xs text-muted-foreground">{rowCategoryName}</p>
                ) : null}
              </div>

              <div className="shrink-0 text-right">
                <SensitiveValue size="sm" className="block text-sm font-medium tabular-nums">
                  {formatAccountBalance(row.share, currency)}
                </SensitiveValue>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {row.sharePercent.toLocaleString('pt-BR', {
                    maximumFractionDigits: 1,
                  })}
                  %
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
