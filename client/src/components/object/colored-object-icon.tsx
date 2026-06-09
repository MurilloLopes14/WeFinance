import { DEFAULT_PRESET_COLOR } from '@/lib/color-helpers'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type ColoredObjectIconProps = {
  color?: string | null
  icon: LucideIcon
  className?: string
  iconClassName?: string
}

export function ColoredObjectIcon({
  color,
  icon: Icon,
  className,
  iconClassName,
}: ColoredObjectIconProps) {
  const backgroundColor = color ?? DEFAULT_PRESET_COLOR

  return (
    <span
      aria-hidden
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-2xl border-2 border-white',
        className,
      )}
      style={{ backgroundColor }}
    >
      <Icon
        className={cn('size-4 text-white drop-shadow-sm', iconClassName)}
        strokeWidth={2.25}
      />
    </span>
  )
}
