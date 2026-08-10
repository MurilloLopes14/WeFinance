import type { TopPayeesResponseDto } from '@/api/generated/models/topPayeesResponseDto'
import { SENSITIVE_MASK_LABEL } from '@/components/privacy/sensitive-value'
import { ReportChartShell } from '@/components/reports/report-chart-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrivacyMode } from '@/contexts/privacy-mode-context'
import { useSensitiveCurrencyText } from '@/hooks/use-sensitive-currency-formatter'
import { Contact } from 'lucide-react'
import type { ReactNode } from 'react'

type TopPayeesPanelProps = {
  data: TopPayeesResponseDto | undefined
  currency?: string
  isLoading: boolean
  className?: string
  headerActions?: ReactNode
}

export function TopPayeesPanel({
  data,
  currency = 'BRL',
  isLoading,
  className,
  headerActions,
}: TopPayeesPanelProps) {
  const formatCurrencyText = useSensitiveCurrencyText(currency)
  const { amountsHidden } = usePrivacyMode()
  const payees = data?.payees ?? []
  const hasData = payees.length > 0

  return (
    <ReportChartShell
      className={className}
      title="Top favorecidos"
      description={
        <>
          <p>Favorecidos com maior volume de despesas no período.</p>
          {hasData && data ? (
            <p className="tabular-nums">
              Total despesas:{' '}
              <span className="font-medium text-foreground">
                {amountsHidden
                  ? SENSITIVE_MASK_LABEL
                  : formatCurrencyText(data.totalExpenses)}
              </span>
            </p>
          ) : null}
        </>
      }
      headerActions={headerActions}
      contentClassName="flex flex-col"
    >
      {isLoading ? (
        <div className="flex flex-1 flex-col gap-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : !hasData ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Contact className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Nenhum favorecido com despesas neste período.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
          {payees.map((payee, index) => {
            const key = payee.payeeId ?? `${payee.name}-${index}`
            const barWidth = Math.max(4, Math.min(100, payee.percentage))

            return (
              <li
                key={key}
                className="rounded-xl px-2 py-2.5 transition-colors hover:bg-foreground/5"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p className="truncate text-sm font-medium text-foreground">
                        {payee.name}
                      </p>
                    </div>
                    <p className="mt-0.5 pl-7 text-xs text-muted-foreground">
                      {payee.transactionCount}{' '}
                      {payee.transactionCount === 1
                        ? 'transação'
                        : 'transações'}
                      {' · '}
                      {amountsHidden
                        ? '•••'
                        : `${payee.percentage.toLocaleString('pt-BR', {
                            maximumFractionDigits: 1,
                          })}%`}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                    {amountsHidden
                      ? SENSITIVE_MASK_LABEL
                      : formatCurrencyText(payee.amount)}
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/8">
                  <div
                    className="h-full rounded-full bg-chart-1"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </ReportChartShell>
  )
}
