import { formatAccountBalance } from '@/lib/account-helpers'
import { cn } from '@/lib/utils'

type KpiCardProps = {
  label: string
  value: number
  currency: string
  variant: 'income' | 'expense' | 'balance' | 'available' | 'invested' | 'total'
}

export function KpiCard({ label, value, currency, variant }: KpiCardProps) {
  const formatted = formatAccountBalance(value, currency)

  const valueClassName = (() => {
    if (variant === 'income') {
      return 'text-emerald-600 dark:text-emerald-400'
    }
    if (variant === 'expense') {
      return 'text-destructive'
    }
    if (variant === 'balance') {
      if (value < 0) {
        return 'text-destructive'
      }
      if (value > 0) {
        return 'text-primary'
      }
      return 'text-foreground'
    }
    if (variant === 'available') {
      return 'text-neon-cyan'
    }
    if (variant === 'invested') {
      return 'text-neon-violet'
    }
    if (variant === 'total') {
      if (value < 0) {
        return 'text-destructive'
      }
      if (value > 0) {
        return 'text-primary'
      }
      return 'text-foreground'
    }
    return 'text-foreground'
  })()

  return (
    <div className="glass-subtle flex min-w-0 flex-col rounded-xl px-3 py-3 ring-1 ring-foreground/10 sm:px-4">
      <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</p>
      <p
        className={cn(
          'mt-1 min-w-0 font-heading text-sm font-semibold leading-tight tabular-nums tracking-tight sm:text-xl',
          valueClassName,
        )}
      >
        {formatted}
      </p>
    </div>
  )
}
