import type { AccountResponseDto } from '@/api/generated/models/accountResponseDto'
import { ColoredObjectIcon } from '@/components/object/colored-object-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import {
  formatAccountBalance,
  getAccountCurrency,
  getAccountTypeLabel,
} from '@/lib/account-helpers'
import { DEFAULT_PRESET_COLOR } from '@/lib/color-helpers'
import { cn } from '@/lib/utils'
import { Pencil, Trash2, Wallet } from 'lucide-react'
import type { CSSProperties } from 'react'

export const accountCardGridClassName =
  'grid w-full auto-rows-min grid-cols-1 content-start items-start gap-3 sm:grid-cols-2 xl:grid-cols-3'

type AccountCardProps = {
  account: AccountResponseDto
  householdName?: string | null
  householdCurrencyById?: Record<string, string | undefined>
  onEdit?: (account: AccountResponseDto) => void
  onDelete?: (account: AccountResponseDto) => void
  className?: string
}

export function AccountCard({
  account,
  householdName,
  householdCurrencyById = {},
  onEdit,
  onDelete,
  className,
}: AccountCardProps) {
  const accountColor = account.color ?? DEFAULT_PRESET_COLOR
  const currency = getAccountCurrency(account, householdCurrencyById)

  return (
    <Card
      size="sm"
      className={cn(
        'glass-subtle account-card-glow h-fit w-full gap-0 self-start py-4',
        className,
      )}
      style={{ '--account-color': accountColor } as CSSProperties}
    >
      <div className="flex min-w-0 items-center gap-3.5 px-4">
        <ColoredObjectIcon
          color={account.color}
          icon={Wallet}
          className="size-11 rounded-2xl"
          iconClassName="size-5"
        />

        <div className="min-w-0 flex-1">
          <CardTitle className="line-clamp-1 text-base leading-snug font-medium">
            {account.name}
          </CardTitle>

          <p className="mt-1.5 text-lg leading-none font-semibold tracking-tight">
            {formatAccountBalance(account.balanceManual, currency)}
          </p>

          <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1.5">
            {householdName && (
              <Badge
                variant="outline"
                className="h-5 max-w-36 shrink-0 truncate rounded-md px-1.5 py-0 text-[11px] leading-none"
              >
                {householdName}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[11px] leading-none"
            >
              {getAccountTypeLabel(account.type)}
            </Badge>
            {account.institution && (
              <p className="truncate text-xs leading-none text-muted-foreground">
                {account.institution}
              </p>
            )}
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex shrink-0 items-center gap-0.5">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label={`Editar ${account.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit(account)
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 text-destructive hover:text-destructive"
                aria-label={`Excluir ${account.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(account)
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
