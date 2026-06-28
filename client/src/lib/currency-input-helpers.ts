/**
 * Currency input helpers for pt-BR display. Form state remains a plain number for the API.
 * Digits are interpreted as centavos while typing (e.g. "1234" → "12,34").
 */

export function formatCurrencyInputFromDigits(digits: string): string {
  const onlyDigits = digits.replace(/\D/g, '')
  if (onlyDigits.length === 0) return ''

  const amount = Number(onlyDigits) / 100

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function parseCurrencyInputDigits(digits: string): number {
  const onlyDigits = digits.replace(/\D/g, '')
  if (onlyDigits.length === 0) return 0

  return Number(onlyDigits) / 100
}

export function formatAmountToCurrencyInput(value: number): string {
  if (!value || Number.isNaN(value) || value <= 0) return ''

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function digitsFromAmount(value: number): string {
  if (!value || Number.isNaN(value) || value <= 0) return ''
  return String(Math.round(value * 100))
}
