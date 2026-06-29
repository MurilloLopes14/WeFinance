import type { CreditAccountSummaryDto } from '@/api/generated/models/creditAccountSummaryDto'
import { DashboardPanel } from '@/components/dashboard/dashboard-panel'
import { SensitiveValue } from '@/components/privacy/sensitive-value'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAccountBalance } from '@/lib/account-helpers'
import { cn } from '@/lib/utils'
import { CreditCard } from 'lucide-react'

type CreditAccountsPanelProps = {
  accounts: CreditAccountSummaryDto[]
  currency: string
  isLoading: boolean
  variant?: 'default' | 'compact'
  className?: string
}

function formatDueDayLabel(day: number | null | undefined): string | null {
  if (day == null) return null
  return `Vence dia ${day}`
}

export function CreditAccountsPanel({
  accounts,
  currency,
  isLoading,
  variant = 'default',
  className,
}: CreditAccountsPanelProps) {
  const isCompact = variant === 'compact'

  if (!isLoading && accounts.length === 0) return null

  return (
    <DashboardPanel
      title="Cartões de crédito"
      description={
        isCompact
          ? 'Faturas em aberto dos seus cartões.'
          : 'Gastos da fatura atual e limite disponível por cartão.'
      }
      className={className}
    >
      {isLoading ? (
        <div className={cn('space-y-2.5', isCompact && 'min-h-0 flex-1')}>
          {Array.from({ length: isCompact ? 3 : 2 }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn('w-full rounded-xl', isCompact ? 'h-12' : 'h-24')}
            />
          ))}
        </div>
      ) : isCompact ? (
        <ul className="divide-y divide-foreground/8">
          {accounts.map((account) => {
            const dueLabel = formatDueDayLabel(account.invoiceDueDay)

            return (
              <li
                key={account.accountId}
                className="flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <CreditCard className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{account.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Disp.{' '}
                    <SensitiveValue className="tabular-nums">
                      {formatAccountBalance(account.availableCredit, currency)}
                    </SensitiveValue>
                    {' · '}Limite{' '}
                    <SensitiveValue className="tabular-nums">
                      {formatAccountBalance(account.creditLimit, currency)}
                    </SensitiveValue>
                    {dueLabel ? ` · ${dueLabel}` : null}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[10px] leading-none text-muted-foreground">A pagar</p>
                  <SensitiveValue
                    size="md"
                    className={cn(
                      'mt-0.5 block text-sm font-semibold tabular-nums',
                      account.toBeSpent > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-foreground',
                    )}
                  >
                    {formatAccountBalance(account.toBeSpent, currency)}
                  </SensitiveValue>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {accounts.map((account) => {
            const dueLabel = formatDueDayLabel(account.invoiceDueDay)

            return (
              <div
                key={account.accountId}
                className="glass-subtle flex min-w-0 flex-col gap-2 rounded-xl p-3 ring-1 ring-foreground/10 sm:p-4"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <CreditCard className="size-4" />
                  </div>
                  <p className="min-w-0 truncate text-sm font-medium">{account.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">A pagar</p>
                    <SensitiveValue
                      className={cn(
                        'mt-0.5 block font-heading text-sm font-semibold tabular-nums',
                        account.toBeSpent > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-foreground',
                      )}
                    >
                      {formatAccountBalance(account.toBeSpent, currency)}
                    </SensitiveValue>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Disponível</p>
                    <SensitiveValue className="mt-0.5 block font-heading text-sm font-semibold tabular-nums text-neon-cyan">
                      {formatAccountBalance(account.availableCredit, currency)}
                    </SensitiveValue>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Limite{' '}
                  <SensitiveValue className="tabular-nums">
                    {formatAccountBalance(account.creditLimit, currency)}
                  </SensitiveValue>
                  {dueLabel ? ` · ${dueLabel}` : null}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </DashboardPanel>
  )
}
