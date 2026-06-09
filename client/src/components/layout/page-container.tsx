import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type PageContainerProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main'
}

export function PageContainer({
  children,
  className,
  as: Component = 'div',
}: PageContainerProps) {
  return (
    <Component
      className={cn(
        'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8',
        className,
      )}
    >
      {children}
    </Component>
  )
}
