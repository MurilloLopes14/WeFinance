import type { DailySummaryResponseDto } from '@/api/generated/models/dailySummaryResponseDto'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDashboardMonthLabel, getDayColorClass } from '@/lib/dashboard-helpers'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

type FinancialCalendarProps = {
  data: DailySummaryResponseDto | undefined
  month: string
  onDayClick: (date: string) => void
  isLoading: boolean
  className?: string
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function FinancialCalendar({
  data,
  month,
  onDayClick,
  isLoading,
  className,
}: FinancialCalendarProps) {
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
        'glass-subtle rounded-xl p-4 ring-1 ring-foreground/10',
        className,
      )}
    >
      <h3 className="font-heading text-sm font-semibold tracking-tight">
        Calendário financeiro
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatDashboardMonthLabel(month)} — clique em um dia para ver as transações.
      </p>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {label}
              </div>
            ))}

            {calendarCells.map((cell, index) => {
              if (cell.type === 'empty') {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const summary = daysByDate.get(cell.date)
              const hasTransactions = (summary?.transactionCount ?? 0) > 0
              const balance = hasTransactions ? summary?.balance : undefined

              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => onDayClick(cell.date)}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-medium transition hover:ring-2 hover:ring-primary/30',
                    getDayColorClass(balance),
                  )}
                >
                  <span>{cell.dayNumber}</span>
                  {hasTransactions && (
                    <span className="absolute bottom-1 rounded-full bg-foreground/10 px-1 text-[9px] tabular-nums">
                      {summary?.transactionCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
