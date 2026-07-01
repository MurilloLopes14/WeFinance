import type { AccountResponseDto } from '@/api/generated/models/accountResponseDto'
import { AccountResponseDtoType } from '@/api/generated/models/accountResponseDtoType'
import { ColoredObjectIcon } from '@/components/object/colored-object-icon'
import { ObjectCardActionsMenu, type ObjectCardAction } from '@/components/object/object-card-actions-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import {
  formatAccountBalance,
  getAccountCurrency,
  getAccountTypeLabel,
} from '@/lib/account-helpers'
import { SensitiveValue } from '@/components/privacy/sensitive-value'
import { DEFAULT_PRESET_COLOR } from '@/lib/color-helpers'
import { cn } from '@/lib/utils'
import { Pencil, Trash2, Wallet } from 'lucide-react'
import type { CSSProperties } from 'react'

export const accountCardGridClassName =
  'grid w-full auto-rows-min grid-cols-1 content-start items-start gap-3 sm:grid-cols-2 xl:grid-cols-3'

const accountBadgeClassName =
  'h-5 shrink-0 rounded-md px-1.5 py-0 text-[11px] leading-none'

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
  const isCredit = account.type === AccountResponseDtoType.credit

  const actions: ObjectCardAction[] = []

  if (onEdit) {
    actions.push({
      id: 'edit',
      label: `Editar ${account.name}`,
      icon: Pencil,
      onClick: () => onEdit(account),
    })
  }

  if (onDelete) {
    actions.push({
      id: 'delete',
      label: `Excluir ${account.name}`,
      icon: Trash2,
      variant: 'destructive',
      onClick: () => onDelete(account),
    })
  }

  return (
    <Card
      size="sm"
      className={cn(
        'glass-subtle account-card-glow h-fit w-full gap-0 self-start py-4',
        className,
      )}
      style={{ '--account-color': accountColor } as CSSProperties}
    >
      <div className="flex min-w-0 items-start gap-3 px-4 sm:items-center sm:gap-3.5">
        <ColoredObjectIcon
          color={account.color}
          icon={Wallet}
          className="size-10 rounded-2xl sm:size-11"
          iconClassName="size-5"
        />

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 items-center gap-1.5">
            <CardTitle className="min-w-0 truncate text-base leading-snug font-medium">
              {account.name}
            </CardTitle>
            {account.user?.name ? (
              <Badge
                variant="outline"
                className={cn(accountBadgeClassName, 'max-w-[42%] shrink-0 truncate')}
              >
                {account.user.name}
              </Badge>
            ) : null}
          </div>

          <SensitiveValue
            size="lg"
            className="mt-1.5 block truncate text-lg leading-none font-semibold tracking-tight tabular-nums"
          >
            {formatAccountBalance(account.balanceManual, currency)}
          </SensitiveValue>

          <div className="mt-2.5 flex min-w-0 items-center gap-1.5 overflow-hidden">
            {householdName && (
              <Badge
                variant="outline"
                className={cn(
                  accountBadgeClassName,
                  'max-w-[42%] truncate sm:max-w-36',
                )}
              >
                {householdName}
              </Badge>
            )}
            <Badge variant="secondary" className={accountBadgeClassName}>
              {getAccountTypeLabel(account.type)}
            </Badge>
            {isCredit && account.creditLimit != null ? (
              <Badge
                variant="outline"
                className={cn(accountBadgeClassName, 'max-w-[38%] truncate')}
              >
                Limite{' '}
                <SensitiveValue className="tabular-nums">
                  {formatAccountBalance(account.creditLimit, currency)}
                </SensitiveValue>
              </Badge>
            ) : null}
            {isCredit && account.invoiceClosingDay != null ? (
              <Badge variant="outline" className={accountBadgeClassName}>
                Fecha dia {account.invoiceClosingDay}
              </Badge>
            ) : null}
            {account.institution && (
              <p className="min-w-0 flex-1 truncate text-xs leading-none text-muted-foreground">
                {account.institution}
              </p>
            )}
          </div>
        </div>

        <ObjectCardActionsMenu actions={actions} menuLabel={`Ações de ${account.name}`} />
      </div>
    </Card>
  )
}
