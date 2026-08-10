import type { DailySummaryResponseDto } from '@/api/generated/models/dailySummaryResponseDto'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrivacyMode } from '@/contexts/privacy-mode-context'
import { formatAccountBalance } from '@/lib/account-helpers'
import { formatDashboardMonthLabel, getDayColorClass } from '@/lib/dashboard-helpers'
import { cn } from '@/lib/utils'
import { useMemo, type ReactNode } from 'react'

type FinancialCalendarProps = {
  data: DailySummaryResponseDto | undefined
  month: string
  onDayClick: (date: string) => void
  isLoading: boolean
  className?: string
  headerActions?: ReactNode
  /** When true, each day also shows the cumulative end-of-day balance. */
  showDayBalance?: boolean
  currency?: string
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatCompactDayBalance(value: number, currency: string): string {
  const absolute = Math.abs(value)
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    notation: absolute >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: absolute >= 1000 ? 1 : 0,
  }).format(absolute)

  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

export function FinancialCalendar({
  data,
  month,
  onDayClick,
  isLoading,
  className,
  headerActions,
  showDayBalance = false,
  currency = 'BRL',
}: FinancialCalendarProps) {
  const { amountsHidden } = usePrivacyMode()

  const daysByDate = useMemo(() => {
    const map = new Map<string, DailySummaryResponseDto['days'][number]>()
    data?.days.forEach((day) => {
      map.set(day.date, day)
    })
    return map
  }, [data?.days])

  const calendarCells = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    const firstDay = new Date(year, monthNumber - 1, 1)
    const daysInMonth = new Date(year, monthNumber, 0).getDate()
    const leadingEmpty = firstDay.getDay()
    const cells: Array<{ type: 'empty' } | { type: 'day'; date: string; dayNumber: number }> = []

    for (let index = 0; index < leadingEmpty; index += 1) {
      cells.push({ type: 'empty' })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ type: 'day', date, dayNumber: day })
    }

    return cells
  }, [month])

  return (
    <div
      className={cn(
        'glass-subtle overflow-hidden rounded-xl p-4 ring-1 ring-foreground/10',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-heading text-pretty text-sm font-semibold tracking-tight">
            Calendário financeiro
          </h3>
          <p className="mt-1 text-sm text-muted-foreground sm:text-xs">
            {formatDashboardMonthLabel(month)} — toque em um dia para ver as
            transações
            {showDayBalance ? ', com saldo final do dia' : ''}.
          </p>
        </div>
        {headerActions ? (
          <div className="w-full min-w-0 shrink-0 sm:w-auto">{headerActions}</div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn(
                'rounded-lg',
                showDayBalance ? 'min-h-14 sm:min-h-16' : 'aspect-square min-h-10',
              )}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-7 gap-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs"
            >
              {label}
            </div>
          ))}

          {calendarCells.map((cell, index) => {
            if (cell.type === 'empty') {
              return (
                <div
                  key={`empty-${index}`}
                  className={
                    showDayBalance ? 'min-h-14 sm:min-h-16' : 'aspect-square min-h-10'
                  }
                />
              )
            }

            const summary = daysByDate.get(cell.date)
            const hasTransactions = (summary?.transactionCount ?? 0) > 0
            const dayNetBalance = hasTransactions ? summary?.balance : undefined
            const endOfDayBalance = summary?.runningBalance

            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onDayClick(cell.date)}
                className={cn(
                  'relative flex min-w-0 flex-col items-center justify-center rounded-lg text-xs font-medium touch-manipulation transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-ring',
                  showDayBalance
                    ? 'min-h-14 gap-0.5 px-0.5 py-1 sm:min-h-16'
                    : 'aspect-square min-h-10',
                  getDayColorClass(dayNetBalance),
                )}
              >
                <span>{cell.dayNumber}</span>
                {hasTransactions ? (
                  showDayBalance ? (
                    <>
                      <span className="rounded-full bg-foreground/10 px-1 text-[10px] tabular-nums leading-none">
                        {summary?.transactionCount}
                        <span className="hidden sm:inline">
                          {(summary?.transactionCount ?? 0) === 1 ? ' tx' : ' txs'}
                        </span>
                      </span>
                      <span
                        className="max-w-full truncate px-0.5 text-[10px] font-medium tabular-nums leading-tight"
                        title={
                          amountsHidden || endOfDayBalance === undefined
                            ? undefined
                            : formatAccountBalance(endOfDayBalance, currency)
                        }
                      >
                        {amountsHidden
                          ? '•••'
                          : endOfDayBalance === undefined
                            ? '—'
                            : formatCompactDayBalance(endOfDayBalance, currency)}
                      </span>
                    </>
                  ) : (
                    <span className="absolute bottom-1 rounded-full bg-foreground/10 px-1 text-[10px] tabular-nums">
                      {summary?.transactionCount}
                    </span>
                  )
                ) : null}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
