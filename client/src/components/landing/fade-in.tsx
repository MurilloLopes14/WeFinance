import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { useFadeIn } from '@/hooks/use-fade-in'

type FadeInProps = {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

const hiddenOffset = {
  up: 'translate-y-5 sm:translate-y-8',
  down: '-translate-y-5 sm:-translate-y-8',
  left: 'translate-x-5 sm:translate-x-8',
  right: '-translate-x-5 sm:-translate-x-8',
  none: '',
} as const

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
}: FadeInProps) {
  const { ref, isVisible } = useFadeIn()

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out will-change-[opacity,transform]',
        isVisible
          ? 'translate-x-0 translate-y-0 opacity-100'
          : cn('opacity-0', hiddenOffset[direction]),
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
