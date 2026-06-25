import { KpiCard } from '@/components/dashboard/kpi-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { TransactionSummaryResponseDto } from '@/api/generated/models/transactionSummaryResponseDto'
import { cn } from '@/lib/utils'

export type AccountBalanceBreakdown = {
  available: number
  invested: number
  total: number
}

type KpiCardsColumnProps = {
  data: TransactionSummaryResponseDto | undefined
  currency: string
  isLoading: boolean
  label?: string
  accountBalances?: AccountBalanceBreakdown
  className?: string
}

export function KpiCardsColumn({
  data,
  currency,
  isLoading,
  label,
  accountBalances,
  className,
}: KpiCardsColumnProps) {
  const showAccountBalances = accountBalances !== undefined
  const skeletonCount = showAccountBalances ? 6 : 3

  return (
    <div className={cn('space-y-3', className)}>
      {label ? (
        <h3 className="font-heading text-sm font-semibold tracking-tight">{label}</h3>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <Skeleton key={index} className="h-[4.25rem] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={cn(
              'grid gap-2 sm:gap-3',
              showAccountBalances ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3',
            )}
          >
            <KpiCard
              label="Receitas"
              value={data?.totalIncome ?? 0}
              currency={currency}
              variant="income"
            />
            <KpiCard
              label="Despesas"
              value={data?.totalExpenses ?? 0}
              currency={currency}
              variant="expense"
            />
            <KpiCard
              label="Saldo"
              value={data?.balance ?? 0}
              currency={currency}
              variant="balance"
            />
          </div>

          {showAccountBalances && accountBalances ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <KpiCard
                label="Disponível"
                value={accountBalances.available}
                currency={currency}
                variant="available"
              />
              <KpiCard
                label="Investido"
                value={accountBalances.invested}
                currency={currency}
                variant="invested"
              />
              <KpiCard
                label="Total"
                value={accountBalances.total}
                currency={currency}
                variant="total"
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
