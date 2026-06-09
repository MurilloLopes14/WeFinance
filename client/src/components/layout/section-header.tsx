import { FadeIn } from '@/components/landing/fade-in'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type SectionHeaderProps = {
  eyebrow: string
  title: ReactNode
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeaderProps) {
  return (
    <FadeIn
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary sm:text-xs sm:tracking-widest">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
          {description}
        </p>
      )}
    </FadeIn>
  )
}
