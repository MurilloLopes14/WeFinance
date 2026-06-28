import type { SubscriptionResponseDto } from '@/api/generated/models/subscriptionResponseDto'
import { DashboardPanel } from '@/components/dashboard/dashboard-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getUpcomingSubscriptions } from '@/lib/dashboard-helpers'
import { formatAccountBalance } from '@/lib/account-helpers'
import {
  formatSubscriptionNextRun,
  getSubscriptionTypeLabel,
} from '@/lib/subscription-helpers'
import { getTransactionAmountClassName } from '@/lib/transaction-helpers'
import { SensitiveValue } from '@/components/privacy/sensitive-value'
import { cn } from '@/lib/utils'
import { ArrowRight, CalendarClock } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

type UpcomingFixosPanelProps = {
  subscriptions: SubscriptionResponseDto[]
  currency?: string
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  className?: string
}

export function UpcomingFixosPanel({
  subscriptions,
  currency = 'BRL',
  isLoading,
  isError,
  onRetry,
  className,
}: UpcomingFixosPanelProps) {
  const upcoming = useMemo(() => getUpcomingSubscriptions(subscriptions, 5), [subscriptions])

  return (
    <DashboardPanel
      title="Próximos fixos"
      description="Cobranças e depósitos programados, ordenados por data."
      className={className}
      action={
        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 rounded-lg px-2 text-xs"
          render={<Link to="/dashboard/fixos" />}
        >
          Ver fixos
          <ArrowRight className="size-3.5" />
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="text-sm text-muted-foreground">Não foi possível carregar os fixos.</p>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onRetry}>
              Tentar novamente
            </Button>
          )}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <CalendarClock className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum fixo ativo agendado.</p>
        </div>
      ) : (
        <ul className="divide-y divide-foreground/8">
          {upcoming.map((subscription) => (
            <li
              key={subscription.id}
              className="flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-medium">{subscription.name}</p>
                  <Badge variant="secondary" className="h-5 shrink-0 rounded-md px-1.5 text-[10px]">
                    {getSubscriptionTypeLabel(subscription.type)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatSubscriptionNextRun(subscription.nextRunAt)}
                </p>
              </div>
              <SensitiveValue
                size="md"
                className={cn(
                  'shrink-0 text-sm font-semibold tabular-nums',
                  getTransactionAmountClassName(subscription.type),
                )}
              >
                {formatAccountBalance(subscription.amount, currency)}
              </SensitiveValue>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  )
}
