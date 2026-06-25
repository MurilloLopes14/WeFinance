import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'
import { ObjectCardActionsMenu, type ObjectCardAction } from '@/components/object/object-card-actions-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Contact, Pencil, Trash2 } from 'lucide-react'

type PayeeCardProps = {
  payee: PayeeResponseDto
  householdName?: string | null
  categoryName?: string | null
  showHousehold?: boolean
  onEdit?: (payee: PayeeResponseDto) => void
  onDelete?: (payee: PayeeResponseDto) => void
  className?: string
}

export function PayeeCard({
  payee,
  householdName,
  categoryName,
  showHousehold = false,
  onEdit,
  onDelete,
  className,
}: PayeeCardProps) {
  const regexRule = typeof payee.regexRule === 'string' ? payee.regexRule : undefined

  const actions: ObjectCardAction[] = []

  if (onEdit) {
    actions.push({
      id: 'edit',
      label: `Editar ${payee.name}`,
      icon: Pencil,
      onClick: () => onEdit(payee),
    })
  }

  if (onDelete) {
    actions.push({
      id: 'delete',
      label: `Excluir ${payee.name}`,
      icon: Trash2,
      variant: 'destructive',
      onClick: () => onDelete(payee),
    })
  }

  return (
    <Card size="sm" className={cn('glass-subtle h-fit w-full gap-0 py-2.5', className)}>
      <div className="flex min-w-0 items-start gap-2.5 px-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Contact className="size-4" />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 items-start gap-2">
            <CardTitle className="min-w-0 flex-1 truncate text-sm leading-snug font-medium">
              {payee.name}
            </CardTitle>
            <ObjectCardActionsMenu actions={actions} />
          </div>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
            {showHousehold && householdName && (
              <Badge
                variant="outline"
                className="h-5 max-w-full truncate rounded-md px-1.5 py-0 text-[11px] leading-none"
              >
                {householdName}
              </Badge>
            )}
            {categoryName && (
              <Badge
                variant="secondary"
                className="h-5 max-w-full truncate rounded-md px-1.5 py-0 text-[11px] leading-none"
              >
                {categoryName}
              </Badge>
            )}
          </div>

          {regexRule && (
            <p className="mt-1.5 truncate font-mono text-[11px] text-muted-foreground">
              {regexRule}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
