import { Input } from '@/components/ui/input'
import { CreateTransactionDtoType } from '@/api/generated/models/createTransactionDtoType'
import {
  formatAmountToCurrencyInput,
  formatCurrencyInputFromDigits,
  parseCurrencyInputDigits,
} from '@/lib/currency-input-helpers'
import { getTransactionAmountClassName } from '@/lib/transaction-helpers'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

type TransactionAmountInputProps = {
  id?: string
  value: number
  onChange: (value: number) => void
  onBlur?: () => void
  disabled?: boolean
  type: CreateTransactionDtoType
  className?: string
}

export function TransactionAmountInput({
  id = 'transaction-amount',
  value,
  onChange,
  onBlur,
  disabled = false,
  type,
  className,
}: TransactionAmountInputProps) {
  const [display, setDisplay] = useState(() => formatAmountToCurrencyInput(value))
  const lastSyncedAmountRef = useRef(value)

  useEffect(() => {
    if (value === lastSyncedAmountRef.current) return

    lastSyncedAmountRef.current = value
    setDisplay(formatAmountToCurrencyInput(value))
  }, [value])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '')
    const formatted = formatCurrencyInputFromDigits(digits)
    const numeric = parseCurrencyInputDigits(digits)

    setDisplay(formatted)
    lastSyncedAmountRef.current = numeric
    onChange(numeric)
  }

  const handleBlur = () => {
    if (value > 0) {
      setDisplay(formatAmountToCurrencyInput(value))
      lastSyncedAmountRef.current = value
    }
    onBlur?.()
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      placeholder="0,00"
      disabled={disabled}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      className={cn(
        'rounded-xl font-medium tabular-nums',
        getTransactionAmountClassName(type),
        className,
      )}
    />
  )
}
