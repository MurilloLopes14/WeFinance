import { cn } from '@/lib/utils'

type SectionProps = {
  id?: string
  children: React.ReactNode
  className?: string
  containerClassName?: string
}

export function LandingSection({
  id,
  children,
  className,
  containerClassName,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 py-16 sm:scroll-mt-28 sm:py-20 lg:py-24',
        className,
      )}
    >
      <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', containerClassName)}>
        {children}
      </div>
    </section>
  )
}

export function LandingDivider() {
  return <div className="divider-glass mx-auto w-[min(100%-2rem,72rem)] max-w-6xl" />
}
