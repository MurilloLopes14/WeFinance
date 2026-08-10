import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type ReportChartShellProps = {
  title: string
  description?: ReactNode
  titleAddon?: ReactNode
  headerActions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function ReportChartShell({
  title,
  description,
  titleAddon,
  headerActions,
  children,
  className,
  contentClassName,
}: ReportChartShellProps) {
  return (
    <div
      className={cn(
        'glass-subtle flex h-full min-h-0 flex-col overflow-hidden rounded-xl p-4 ring-1 ring-foreground/10',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1">
            <h3 className="font-heading text-pretty text-sm font-semibold tracking-tight">
              {title}
            </h3>
            {titleAddon}
          </div>
          {description ? (
            typeof description === 'string' ? (
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-xs">
                {description}
              </p>
            ) : (
              <div className="space-y-1 text-sm leading-relaxed text-muted-foreground sm:text-xs">
                {description}
              </div>
            )
          ) : null}
        </div>
        {headerActions ? (
          <div className="w-full min-w-0 shrink-0 sm:w-auto">{headerActions}</div>
        ) : null}
      </div>
      <div className={cn('mt-4 min-h-0 flex-1', contentClassName)}>{children}</div>
    </div>
  )
}
