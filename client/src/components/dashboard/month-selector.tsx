import { Button } from '@/components/ui/button'
import {
  addMonthsToParam,
  compareMonthParams,
  formatDashboardMonthLabel,
  isMonthAfterCurrent,
} from '@/lib/dashboard-helpers'
import { getCurrentMonthParam } from '@/lib/transaction-helpers'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type MonthSelectorProps = {
  month: string
  onChange: (month: string) => void
  tourAnchor?: string
  /** Destaca o mês (ex.: override independente no gráfico). */
  emphasized?: boolean
  className?: string
}

export function MonthSelector({
  month,
  onChange,
  tourAnchor,
  emphasized = false,
  className,
}: MonthSelectorProps) {
  const currentMonth = getCurrentMonthParam()
  const canGoForward = compareMonthParams(month, currentMonth) < 0

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-1',
        className,
      )}
      {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 shrink-0 rounded-xl touch-manipulation sm:size-9"
        aria-label="Mês anterior"
        onClick={() => onChange(addMonthsToParam(month, -1))}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>

      <p
        className={cn(
          'min-w-0 flex-1 text-center font-heading text-sm font-semibold tracking-tight text-pretty tabular-nums sm:min-w-44 sm:flex-none sm:text-base',
          emphasized && 'text-primary',
        )}
      >
        {formatDashboardMonthLabel(month)}
      </p>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 shrink-0 rounded-xl touch-manipulation sm:size-9"
        aria-label="Próximo mês"
        disabled={!canGoForward || isMonthAfterCurrent(addMonthsToParam(month, 1))}
        onClick={() => {
          const nextMonth = addMonthsToParam(month, 1)
          if (!isMonthAfterCurrent(nextMonth)) {
            onChange(nextMonth)
          }
        }}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
