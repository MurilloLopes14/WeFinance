import { Badge } from '@/components/ui/badge'
import { DEFAULT_PRESET_COLOR, normalizeHexColor } from '@/lib/color-helpers'
import { cn } from '@/lib/utils'
import type { CSSProperties } from 'react'

type TransactionCategoryBadgeProps = {
  name: string
  color?: string | null
  className?: string
}

export function TransactionCategoryBadge({
  name,
  color,
  className,
}: TransactionCategoryBadgeProps) {
  const resolvedColor = normalizeHexColor(color ?? '') ?? DEFAULT_PRESET_COLOR

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-5 max-w-[140px] truncate rounded-md border px-1.5 py-0 text-[11px] leading-none',
        className,
      )}
      style={
        {
          backgroundColor: `color-mix(in srgb, ${resolvedColor} 16%, transparent)`,
          borderColor: `color-mix(in srgb, ${resolvedColor} 40%, transparent)`,
          color: resolvedColor,
        } as CSSProperties
      }
    >
      {name}
    </Badge>
  )
}
