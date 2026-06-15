import { cn } from '@/lib/utils'

type OrFadeSeparatorProps = {
  label?: string
  className?: string
}

export function OrFadeSeparator({ label = 'ou', className }: OrFadeSeparatorProps) {
  return (
    <div
      role="separator"
      aria-label={label}
      className={cn('flex items-center gap-2 py-2', className)}
    >
      <div
        aria-hidden
        className="h-px min-w-0 flex-1 bg-gradient-to-r from-foreground/20 via-foreground/8 to-transparent"
      />
      <span className="relative shrink-0 px-2 select-none">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -inset-x-3 scale-[1.35] rounded-full bg-popover/70 blur-md dark:bg-popover/50"
        />
        <span className="relative text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground/75">
          {label}
        </span>
      </span>
      <div
        aria-hidden
        className="h-px min-w-0 flex-1 bg-gradient-to-l from-foreground/20 via-foreground/8 to-transparent"
      />
    </div>
  )
}
