import type { SubscriptionResponseDto } from '@/api/generated/models/subscriptionResponseDto'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import { formatAccountBalance } from '@/lib/account-helpers'
import {
  filterInstallmentSubscriptionsByQuery,
  formatInstallmentProgress,
  getPendingInstallmentNumbers,
} from '@/lib/subscription-helpers'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'

type InstallmentSubscriptionSearchFieldProps = {
  subscriptions: SubscriptionResponseDto[]
  value: string
  onValueChange: (subscriptionId: string) => void
  disabled?: boolean
  error?: string
  id?: string
  label?: string
  className?: string
  currency?: string
}

export function InstallmentSubscriptionSearchField({
  subscriptions,
  value,
  onValueChange,
  disabled = false,
  error,
  id = 'installment-subscription-search',
  label = 'Parcelamento',
  className,
  currency = 'BRL',
}: InstallmentSubscriptionSearchFieldProps) {
  const [inputValue, setInputValue] = useState('')

  const selectedSubscription = useMemo(
    () => subscriptions.find((subscription) => subscription.id === value) ?? null,
    [subscriptions, value],
  )

  useEffect(() => {
    if (!value) {
      setInputValue('')
      return
    }

    if (selectedSubscription) {
      setInputValue(selectedSubscription.name)
    }
  }, [value, selectedSubscription?.id, selectedSubscription?.name])

  const filteredSubscriptions = useMemo(
    () => filterInstallmentSubscriptionsByQuery(subscriptions, inputValue),
    [inputValue, subscriptions],
  )

  const handleInputChange = (nextValue: string) => {
    setInputValue(nextValue)

    if (selectedSubscription && nextValue !== selectedSubscription.name) {
      onValueChange('')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Combobox
        items={filteredSubscriptions}
        value={selectedSubscription}
        disabled={disabled}
        onValueChange={(item: SubscriptionResponseDto | null) => {
          onValueChange(item?.id ?? '')
          setInputValue(item?.name ?? '')
        }}
        onInputValueChange={handleInputChange}
        itemToStringLabel={(item: SubscriptionResponseDto) => item.name}
        isItemEqualToValue={(item, selected) => item.id === selected.id}
      >
        <ComboboxInput
          id={id}
          placeholder="Buscar parcelamento…"
          className="w-full rounded-xl glass-subtle"
          disabled={disabled}
          showClear={!disabled}
          spellCheck={false}
        />
        <ComboboxContent className="glow-border">
          <ComboboxList>
            {filteredSubscriptions.length === 0 ? (
              <ComboboxEmpty>Nenhum parcelamento encontrado</ComboboxEmpty>
            ) : (
              filteredSubscriptions.map((subscription) => {
                const pending = getPendingInstallmentNumbers(
                  subscription.generatedInstallments,
                  subscription.installmentTotal,
                )
                const progress = formatInstallmentProgress(
                  subscription.installmentsGenerated,
                  subscription.installmentTotal,
                )

                return (
                  <ComboboxItem key={subscription.id} value={subscription}>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span className="truncate">{subscription.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {progress} · {formatAccountBalance(subscription.amount, currency)}
                        {pending.length === 0 ? ' · concluído' : ''}
                      </span>
                    </div>
                  </ComboboxItem>
                )
              })
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
