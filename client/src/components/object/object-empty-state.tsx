import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

export type ObjectEmptyAction = {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'secondary'
}

type ObjectEmptyStateProps = {
  title: string
  description: string
  icon?: LucideIcon
  actions?: ObjectEmptyAction[]
  className?: string
}

export function ObjectEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actions = [],
  className,
}: ObjectEmptyStateProps) {
  return (
    <Empty
      className={cn(
        'flex h-full min-h-0 w-full flex-1 flex-col justify-center border border-dashed border-border/60',
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>

      {actions.length > 0 && (
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant={action.variant ?? 'default'}
                onClick={action.onClick}
                className={action.variant === 'default' ? 'glow-primary rounded-xl' : 'rounded-xl'}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </EmptyContent>
      )}
    </Empty>
  )
}
