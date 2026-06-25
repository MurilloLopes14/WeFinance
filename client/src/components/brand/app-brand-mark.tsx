import { BRAND_LOGO_SRC } from '@/lib/brand-assets'
import { cn } from '@/lib/utils'

type AppBrandMarkProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClassName = {
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
} as const

export function AppBrandMark({ className, size = 'sm' }: AppBrandMarkProps) {
  return (
    <span className={cn('inline-flex shrink-0', className)}>
      <img
        src={BRAND_LOGO_SRC}
        alt=""
        aria-hidden
        className={cn('brand-mark-glow rounded-xl object-contain', sizeClassName[size])}
      />
    </span>
  )
}
