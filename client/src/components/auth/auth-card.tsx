import { cn } from '@/lib/utils'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

type AuthCardProps = HTMLMotionProps<'div'> & {
  children: ReactNode
}

export function AuthCard({ children, className, ...props }: AuthCardProps) {
  return (
    <motion.div
      className={cn(
        'glass-strong relative isolate w-full overflow-hidden rounded-2xl border border-glass-border/60 p-5 shadow-[0_8px_32px_oklch(0_0_0/28%),0_0_48px_-20px_oklch(from_var(--glow-primary)_l_c_h/18%)] sm:rounded-3xl sm:p-8',
        className,
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
