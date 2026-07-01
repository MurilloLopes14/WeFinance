import { KpiCard } from '@/components/dashboard/kpi-card'
import type { KpiCardProps } from '@/components/dashboard/kpi-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { CreditAccountSummaryDto } from '@/api/generated/models/creditAccountSummaryDto'
import type { TransactionSummaryResponseDto } from '@/api/generated/models/transactionSummaryResponseDto'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

export type AccountBalanceBreakdown = {
  available: number
  invested: number
  total: number
}

/** Orphan cards on the last row span the full width (2 cols mobile, 3 cols sm+). */
export const kpiCardsGridClassName =
  'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 [&>:last-child:nth-child(2n-1)]:col-span-2 sm:[&>:last-child:nth-child(3n-2)]:col-span-3'

type KpiCardsColumnProps = {
  data: TransactionSummaryResponseDto | undefined
  currency: string
  isLoading: boolean
  label?: string
  accountBalances?: AccountBalanceBreakdown
  /** Exibe o card "A pagar" com o total informado (ex.: resumo do grupo). */
  toBePaid?: number
  /** Reserva espaço para o card "A pagar" no layout (ex.: aba Grupo). */
  includeToBePaidCard?: boolean
  creditAccounts?: CreditAccountSummaryDto[]
  className?: string
}

export function KpiCardsColumn({
  data,
  currency,
  isLoading,
  label,
  accountBalances,
  toBePaid,
  includeToBePaidCard = false,
  creditAccounts,
  className,
}: KpiCardsColumnProps) {
  const showAccountBalances = accountBalances !== undefined
  const showToBePaidCard = includeToBePaidCard || toBePaid !== undefined
  const creditAccountsToBePaid =
    creditAccounts?.reduce((sum, account) => sum + account.toBeSpent, 0) ?? 0
  const resolvedToBePaid = toBePaid ?? creditAccountsToBePaid
  const showCreditAccountsCard =
    !showToBePaidCard && creditAccounts !== undefined && creditAccounts.length > 0

  const kpiCards = useMemo(() => {
    const cards: Omit<KpiCardProps, 'currency'>[] = [
      {
        label: 'Receitas',
        value: data?.totalIncome ?? 0,
        variant: 'income',
      },
      {
        label: 'Despesas',
        value: data?.totalExpenses ?? 0,
        variant: 'expense',
      },
      {
        label: 'Saldo',
        value: data?.balance ?? 0,
        variant: 'balance',
      },
    ]

    if (showAccountBalances && accountBalances) {
      cards.push(
        {
          label: 'Disponível',
          value: accountBalances.available,
          variant: 'available',
        },
        {
          label: 'Investido',
          value: accountBalances.invested,
          variant: 'invested',
        },
        {
          label: 'Total',
          value: accountBalances.total,
          variant: 'total',
        },
      )
    }

    if (showToBePaidCard || showCreditAccountsCard) {
      cards.push({
        label: 'A pagar',
        value: resolvedToBePaid,
        variant: 'toBePaid',
      })
    }

    return cards
  }, [
    accountBalances,
    creditAccounts,
    data?.balance,
    data?.totalExpenses,
    data?.totalIncome,
    resolvedToBePaid,
    showAccountBalances,
    showCreditAccountsCard,
    showToBePaidCard,
  ])

  const skeletonCount = isLoading
    ? showAccountBalances
      ? 6 + (showToBePaidCard || showCreditAccountsCard ? 1 : 0)
      : 3 + (showToBePaidCard || showCreditAccountsCard ? 1 : 0)
    : kpiCards.length

  return (
    <div className={cn('space-y-3', className)}>
      {label ? (
        <h3 className="font-heading text-sm font-semibold tracking-tight">{label}</h3>
      ) : null}

      {isLoading ? (
        <div className={kpiCardsGridClassName}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <Skeleton key={index} className="h-17 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className={kpiCardsGridClassName}>
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} currency={currency} />
          ))}
        </div>
      )}
    </div>
  )
}
