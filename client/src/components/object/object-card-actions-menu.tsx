import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import type { MouseEvent } from 'react'

export type ObjectCardAction = {
  id: string
  label: string
  icon: LucideIcon
  onClick: (event: MouseEvent<HTMLElement>) => void
  variant?: 'default' | 'destructive'
}

type ObjectCardActionsMenuProps = {
  actions: ObjectCardAction[]
  className?: string
  menuLabel?: string
}

export function ObjectCardActionsMenu({
  actions,
  className,
  menuLabel = 'Ações',
}: ObjectCardActionsMenuProps) {
  if (actions.length === 0) return null

  if (actions.length === 1) {
    const action = actions[0]

    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          'size-7 shrink-0',
          action.variant === 'destructive' && 'text-destructive hover:text-destructive',
          className,
        )}
        aria-label={action.label}
        onClick={(event) => {
          event.stopPropagation()
          action.onClick(event)
        }}
      >
        <action.icon className="size-3.5" />
      </Button>
    )
  }

  return (
    <>
      <div className={cn('hidden shrink-0 items-center gap-0.5 md:flex', className)}>
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              'size-7',
              action.variant === 'destructive' && 'text-destructive hover:text-destructive',
            )}
            aria-label={action.label}
            onClick={(event) => {
              event.stopPropagation()
              action.onClick(event)
            }}
          >
            <action.icon className="size-3.5" />
          </Button>
        ))}
      </div>

      <div className={cn('shrink-0 md:hidden', className)}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7"
                aria-label={menuLabel}
                onClick={(event) => event.stopPropagation()}
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-44">
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                variant={action.variant}
                onClick={(event) => {
                  event.stopPropagation()
                  action.onClick(event)
                }}
              >
                <action.icon />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
