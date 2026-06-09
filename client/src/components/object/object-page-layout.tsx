import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type ObjectPageLayoutProps = {
  children: ReactNode
  className?: string
}

export function ObjectPageLayout({ children, className }: ObjectPageLayoutProps) {
  return (
    <div className={cn('flex h-full min-h-0 w-full flex-1 flex-col gap-6', className)}>
      {children}
    </div>
  )
}

type ObjectPageContentProps = {
  children: ReactNode
  className?: string
}

export function ObjectPageContent({ children, className }: ObjectPageContentProps) {
  return (
    <section
      className={cn(
        'glass-subtle flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl ring-1 ring-foreground/10',
        className,
      )}
    >
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-auto p-4 md:p-6">
        {children}
      </div>
    </section>
  )
}
