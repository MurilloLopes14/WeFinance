import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { Calendar, Check, Lock, Mail, Phone, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const stepIcons: LucideIcon[] = [User, Mail, Calendar, Phone, Lock]

type RegisterStepProgressProps = {
  currentStep: number
  totalSteps: number
}

export function RegisterStepProgress({
  currentStep,
  totalSteps,
}: RegisterStepProgressProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="mb-6 space-y-4 sm:mb-8">
      <div className="flex items-center justify-between gap-2">
        {stepIcons.slice(0, totalSteps).map((Icon, index) => {
          const isCompleted = index < currentStep
          const isActive = index === currentStep

          return (
            <div key={index} className="flex flex-1 items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.02 : 1,
                  opacity: isCompleted || isActive ? 1 : 0.45,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className={cn(
                  'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors sm:size-10',
                  isCompleted && 'border-primary/30 bg-primary/10 text-primary',
                  isActive &&
                    'border-primary/40 bg-primary/15 text-primary ring-2 ring-primary/15 shadow-[0_0_14px_oklch(from_var(--glow-primary)_l_c_h/10%)]',
                  !isCompleted && !isActive && 'glass-subtle text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </motion.div>

              {index < totalSteps - 1 && (
                <div className="relative mx-1.5 h-0.5 flex-1 overflow-hidden rounded-full bg-border/60 sm:mx-2">
                  <motion.div
                    initial={false}
                    animate={{ width: index < currentStep ? '100%' : '0%' }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 rounded-full bg-primary/70"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Etapa {currentStep + 1} de {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="relative h-1.5 overflow-hidden rounded-full bg-border/50">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-neon-cyan to-neon-violet"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          />
        </div>
      </div>
    </div>
  )
}
