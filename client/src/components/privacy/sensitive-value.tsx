import { usePrivacyMode } from '@/contexts/privacy-mode-context'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export const SENSITIVE_MASK_LABEL = 'Valor oculto'

export type SensitiveValueSize = 'sm' | 'md' | 'lg' | 'auto'

const sizeClassName: Record<SensitiveValueSize, string> = {
  sm: 'h-4 min-w-12',
  md: 'h-5 min-w-16',
  lg: 'h-6 min-w-24',
  auto: 'h-[1.1em] min-w-[4.5rem]',
}

type SensitiveValueMaskProps = {
  className?: string
  size?: SensitiveValueSize
}

export function SensitiveValueMask({
  className,
  size = 'auto',
}: SensitiveValueMaskProps) {
  return (
    <span
      role="img"
      aria-label={SENSITIVE_MASK_LABEL}
      className={cn(
        'sensitive-value-mask inline-block max-w-full shrink-0 align-middle',
        sizeClassName[size],
        className,
      )}
    />
  )
}

type SensitiveValueProps = {
  children: ReactNode
  className?: string
  size?: SensitiveValueSize
}

export function SensitiveValue({ children, className, size = 'auto' }: SensitiveValueProps) {
  const { amountsHidden } = usePrivacyMode()

  if (amountsHidden) {
    return <SensitiveValueMask className={className} size={size} />
  }

  return <span className={className}>{children}</span>
}
