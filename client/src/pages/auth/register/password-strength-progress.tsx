import { Progress, ProgressLabel } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { getPasswordStrength, type PasswordStrengthTone } from './password-strength'

type PasswordStrengthProgressProps = {
  password: string
}

const toneIndicatorClass: Record<PasswordStrengthTone, string> = {
  empty: '[&_[data-slot=progress-indicator]]:bg-muted-foreground/25',
  weak: '[&_[data-slot=progress-indicator]]:bg-destructive',
  fair: '[&_[data-slot=progress-indicator]]:bg-amber-500',
  good: '[&_[data-slot=progress-indicator]]:bg-neon-cyan',
  strong: '[&_[data-slot=progress-indicator]]:bg-primary',
}

const toneLabelClass: Record<PasswordStrengthTone, string> = {
  empty: 'text-muted-foreground',
  weak: 'text-destructive',
  fair: 'text-amber-500',
  good: 'text-neon-cyan',
  strong: 'text-primary',
}

export function PasswordStrengthProgress({
  password,
}: PasswordStrengthProgressProps) {
  const strength = getPasswordStrength(password)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-2.5"
    >
      <Progress
        value={strength.score}
        className={cn(
          'w-full flex-col gap-1.5',
          toneIndicatorClass[strength.tone],
        )}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <ProgressLabel className="text-xs font-normal text-muted-foreground">
            Força da senha
          </ProgressLabel>
          <span
            className={cn(
              'text-xs font-medium',
              toneLabelClass[strength.tone],
            )}
          >
            {strength.label}
          </span>
        </div>
      </Progress>

      <ul className="flex flex-wrap gap-1.5">
        {strength.results.map((criterion) => (
          <li
            key={criterion.id}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.7rem] transition-colors',
              criterion.met
                ? 'bg-primary/12 text-primary'
                : 'bg-muted/40 text-muted-foreground',
            )}
          >
            {criterion.met && <Check className="size-3 shrink-0" aria-hidden />}
            {criterion.label}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
