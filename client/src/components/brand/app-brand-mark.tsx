import { BRAND_LOGO_SRC } from '@/lib/brand-assets'
import { cn } from '@/lib/utils'

type AppBrandMarkProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Pulso animado — apenas em landing/auth; desligado no app logado. */
  animated?: boolean
}

const sizeClassName = {
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
} as const

export function AppBrandMark({ className, size = 'sm', animated = false }: AppBrandMarkProps) {
  return (
    <span className={cn('inline-flex shrink-0', className)}>
      <img
        src={BRAND_LOGO_SRC}
        alt=""
        aria-hidden
        className={cn(
          'rounded-xl object-contain',
          animated ? 'brand-mark-glow' : 'brand-mark-glow-static',
          sizeClassName[size],
        )}
      />
    </span>
  )
}
