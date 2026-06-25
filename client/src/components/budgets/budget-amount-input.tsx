import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  formatBudgetAmountForInput,
  parseBudgetAmountInput,
} from '@/lib/budget-page-helpers'
import { cn } from '@/lib/utils'
import { Check, Loader2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

type SaveIndicatorState = 'idle' | 'saving' | 'saved'

type BudgetAmountInputProps = {
  label: string
  value?: number | null
  currency: string
  disabled?: boolean
  onSave: (amount: number | null) => Promise<void>
  className?: string
}

const budgetNumberInputClassName =
  '[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export function BudgetAmountInput({
  label,
  value,
  currency,
  disabled = false,
  onSave,
  className,
}: BudgetAmountInputProps) {
  const inputId = useId()
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [draft, setDraft] = useState(formatBudgetAmountForInput(value))
  const [error, setError] = useState<string | null>(null)
  const [indicatorState, setIndicatorState] = useState<SaveIndicatorState>('idle')

  useEffect(() => {
    setDraft(formatBudgetAmountForInput(value))
    setError(null)
  }, [value])

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  const clearSavedTimeout = () => {
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = null
    }
  }

  const scheduleHideIndicator = () => {
    clearSavedTimeout()
    savedTimeoutRef.current = setTimeout(() => {
      setIndicatorState('idle')
      savedTimeoutRef.current = null
    }, 900)
  }

  const commit = async () => {
    if (disabled || indicatorState === 'saving') return

    const parsed = parseBudgetAmountInput(draft)

    if (parsed === undefined) {
      setError('Informe um valor maior que zero')
      return
    }

    const current = value ?? null
    if (parsed === current) return

    setError(null)
    clearSavedTimeout()
    setIndicatorState('saving')

    try {
      await onSave(parsed)
      setIndicatorState('saved')
      scheduleHideIndicator()
    } catch {
      setDraft(formatBudgetAmountForInput(value))
      setIndicatorState('idle')
    }
  }

  const isBusy = indicatorState === 'saving'

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          name="budget-amount"
          type="number"
          inputMode="decimal"
          min={0.01}
          step={0.01}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled || isBusy}
          placeholder="0,00…"
          className={cn(
            'rounded-xl pr-10 tabular-nums',
            budgetNumberInputClassName,
          )}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            setError(null)
          }}
          onBlur={() => {
            void commit()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
        />
        {indicatorState !== 'idle' && (
          <span
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
            aria-live="polite"
            aria-label={indicatorState === 'saving' ? 'Salvando…' : 'Salvo'}
          >
            <Loader2
              className={cn(
                'absolute inset-0 size-4 text-muted-foreground transition-all duration-300 motion-reduce:transition-none',
                indicatorState === 'saving'
                  ? 'scale-100 opacity-100 motion-safe:animate-spin'
                  : 'scale-75 opacity-0',
              )}
              aria-hidden="true"
            />
            <Check
              className={cn(
                'absolute inset-0 size-4 text-emerald-500 transition-all duration-300 motion-reduce:transition-none',
                indicatorState === 'saved'
                  ? 'scale-100 opacity-100'
                  : 'scale-75 opacity-0',
              )}
              aria-hidden="true"
            />
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Moeda: {currency}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
