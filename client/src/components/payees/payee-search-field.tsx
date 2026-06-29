import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import { filterPayeesByQuery } from '@/lib/payee-helpers'
import { cn } from '@/lib/utils'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type PayeeSearchFieldProps = {
  payees: PayeeResponseDto[]
  value: string
  onValueChange: (payeeId: string) => void
  onQueryChange?: (query: string) => void
  allowQuickCreate?: boolean
  onQuickCreate?: () => void
  isQuickCreating?: boolean
  disabled?: boolean
  error?: string
  id?: string
  label?: string
  className?: string
}

export function PayeeSearchField({
  payees,
  value,
  onValueChange,
  onQueryChange,
  allowQuickCreate = false,
  onQuickCreate,
  isQuickCreating = false,
  disabled = false,
  error,
  id = 'payee-search',
  label = 'Pagador / recebedor',
  className,
}: PayeeSearchFieldProps) {
  const [inputValue, setInputValue] = useState('')

  const selectedPayee = useMemo(
    () => payees.find((payee) => payee.id === value) ?? null,
    [payees, value],
  )

  useEffect(() => {
    if (!value) {
      setInputValue('')
      return
    }

    if (selectedPayee) {
      setInputValue(selectedPayee.name)
    }
  }, [value, selectedPayee?.id, selectedPayee?.name])

  const filteredPayees = useMemo(
    () => filterPayeesByQuery(payees, inputValue),
    [inputValue, payees],
  )

  const trimmedQuery = inputValue.trim()
  const showQuickCreate =
    allowQuickCreate &&
    Boolean(trimmedQuery) &&
    !filteredPayees.some((payee) => payee.name.toLowerCase() === trimmedQuery.toLowerCase())

  const handleInputChange = (nextValue: string) => {
    setInputValue(nextValue)
    onQueryChange?.(nextValue)

    if (selectedPayee && nextValue !== selectedPayee.name) {
      onValueChange('')
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Combobox
        items={filteredPayees}
        value={selectedPayee}
        disabled={disabled || isQuickCreating}
        onValueChange={(item: PayeeResponseDto | null) => {
          onValueChange(item?.id ?? '')
          setInputValue(item?.name ?? '')
          onQueryChange?.(item?.name ?? '')
        }}
        onInputValueChange={handleInputChange}
        itemToStringLabel={(item: PayeeResponseDto) => item.name}
        isItemEqualToValue={(item, selected) => item.id === selected.id}
      >
        <ComboboxInput
          id={id}
          placeholder="Buscar ou digitar nome..."
          className="w-full rounded-xl glass-subtle"
          disabled={disabled || isQuickCreating}
          showClear={!disabled && !isQuickCreating}
        />
        <ComboboxContent className="glow-border">
          <ComboboxList>
            {filteredPayees.length === 0 && !showQuickCreate ? (
              <ComboboxEmpty>Nenhum beneficiário encontrado</ComboboxEmpty>
            ) : (
              filteredPayees.map((payee) => (
                <ComboboxItem key={payee.id} value={payee}>
                  {payee.name}
                </ComboboxItem>
              ))
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {showQuickCreate && onQuickCreate && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-xl text-xs"
          disabled={disabled || isQuickCreating}
          onClick={onQuickCreate}
        >
          {isQuickCreating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Cadastrar &quot;{trimmedQuery}&quot; e usar
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
