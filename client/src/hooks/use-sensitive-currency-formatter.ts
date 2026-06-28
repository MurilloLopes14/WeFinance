import { usePrivacyMode } from '@/contexts/privacy-mode-context'
import { formatAccountBalance } from '@/lib/account-helpers'
import { SENSITIVE_MASK_LABEL } from '@/components/privacy/sensitive-value'
import { useCallback } from 'react'

export function useSensitiveCurrencyFormatter(currency = 'BRL') {
  const { amountsHidden } = usePrivacyMode()

  return useCallback(
    (value: number) => {
      if (amountsHidden) return SENSITIVE_MASK_LABEL
      return formatAccountBalance(value, currency).replace(/\s/g, '\u00a0')
    },
    [amountsHidden, currency],
  )
}

export function useSensitiveCurrencyText(currency = 'BRL') {
  const { amountsHidden } = usePrivacyMode()

  return useCallback(
    (value: number) => {
      if (amountsHidden) return SENSITIVE_MASK_LABEL
      return formatAccountBalance(value, currency)
    },
    [amountsHidden, currency],
  )
}
