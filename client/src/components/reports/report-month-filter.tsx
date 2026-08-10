import { MonthSelector } from '@/components/dashboard/month-selector'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link2 } from 'lucide-react'

type ReportMonthFilterProps = {
  month: string
  isOverride: boolean
  onMonthChange: (month: string) => void
  onFollowGlobal: () => void
  label?: string
  className?: string
}

export function ReportMonthFilter({
  month,
  isOverride,
  onMonthChange,
  onFollowGlobal,
  label = 'Mês do gráfico',
  className,
}: ReportMonthFilterProps) {
  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-1.5 sm:w-auto', className)}>
      <div className="flex min-h-5 items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        {isOverride ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 gap-1 rounded-lg px-2 text-xs touch-manipulation"
            onClick={onFollowGlobal}
            aria-label="Seguir mês geral"
          >
            <Link2 className="size-3.5" aria-hidden="true" />
            Seguir geral
          </Button>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">Geral</span>
        )}
      </div>

      <MonthSelector
        month={month}
        onChange={onMonthChange}
        emphasized={isOverride}
      />
    </div>
  )
}
