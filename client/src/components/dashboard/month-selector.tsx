import { Button } from '@/components/ui/button'
import {
  addMonthsToParam,
  compareMonthParams,
  formatDashboardMonthLabel,
  isMonthAfterCurrent,
} from '@/lib/dashboard-helpers'
import { getCurrentMonthParam } from '@/lib/transaction-helpers'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type MonthSelectorProps = {
  month: string
  onChange: (month: string) => void
  tourAnchor?: string
}

export function MonthSelector({ month, onChange, tourAnchor }: MonthSelectorProps) {
  const currentMonth = getCurrentMonthParam()
  const canGoForward = compareMonthParams(month, currentMonth) < 0

  return (
    <div
      className="flex items-center justify-center gap-1 sm:justify-start"
      {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-xl"
        aria-label="Mês anterior"
        onClick={() => onChange(addMonthsToParam(month, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <p className="min-w-[10rem] text-center font-heading text-sm font-semibold tracking-tight sm:min-w-[11rem] sm:text-base">
        {formatDashboardMonthLabel(month)}
      </p>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 rounded-xl"
        aria-label="Próximo mês"
        disabled={!canGoForward || isMonthAfterCurrent(addMonthsToParam(month, 1))}
        onClick={() => {
          const nextMonth = addMonthsToParam(month, 1)
          if (!isMonthAfterCurrent(nextMonth)) {
            onChange(nextMonth)
          }
        }}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
