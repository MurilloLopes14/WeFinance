import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type HouseholdGatedFormSectionProps = {
  householdId: string
  children: ReactNode
  className?: string
}

export function HouseholdGatedFormSection({
  householdId,
  children,
  className,
}: HouseholdGatedFormSectionProps) {
  const locked = !householdId

  return (
    <div className={cn('min-w-0 space-y-4', className)}>
      {locked ? (
        <p className="text-sm text-muted-foreground">
          Selecione um grupo para preencher os demais campos.
        </p>
      ) : null}

      <fieldset
        disabled={locked}
        className="min-w-0 space-y-4 border-0 p-0 m-0 disabled:opacity-60"
      >
        {children}
      </fieldset>
    </div>
  )
}
