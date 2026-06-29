import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type DashboardPanelProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        'glass-subtle flex h-full min-h-0 flex-col rounded-xl p-4 ring-1 ring-foreground/10',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="font-heading text-sm font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  )
}
