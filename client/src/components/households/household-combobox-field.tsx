import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import { householdsListParams, householdsSearchParams } from '@/lib/household-api-helpers'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type HouseholdComboboxFieldProps = {
  value: string
  onValueChange: (householdId: string) => void
  disabled?: boolean
  error?: string
  className?: string
}

export function HouseholdComboboxField({
  value,
  onValueChange,
  disabled = false,
  error,
  className,
}: HouseholdComboboxFieldProps) {
  const [inputValue, setInputValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(inputValue.trim())
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [inputValue])

  const { data: searchResults, isFetching } = useHouseholdsControllerFindAll(
    householdsSearchParams(debouncedSearch),
    { query: { enabled: !disabled } },
  )

  const { data: allHouseholds } = useHouseholdsControllerFindAll(householdsListParams, {
    query: { enabled: !disabled && Boolean(value) },
  })

  const items = useMemo(() => {
    const list = searchResults ?? []
    const selected = allHouseholds?.find((household) => household.id === value)

    if (selected && !list.some((household) => household.id === value)) {
      return [selected, ...list]
    }

    return list
  }, [allHouseholds, searchResults, value])

  const selectedItem =
    items.find((household) => household.id === value) ??
    allHouseholds?.find((household) => household.id === value) ??
    null

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="category-household">Grupo</Label>
      <Combobox
        items={items}
        value={selectedItem}
        disabled={disabled}
        onValueChange={(item: HouseholdResponseDto | null) => {
          onValueChange(item?.id ?? '')
        }}
        onInputValueChange={(nextValue) => setInputValue(nextValue)}
        itemToStringLabel={(item: HouseholdResponseDto) => item.name}
        isItemEqualToValue={(item, selected) => item.id === selected.id}
      >
        <ComboboxInput
          id="category-household"
          placeholder="Buscar grupo por nome..."
          className="w-full rounded-xl glass-subtle"
          disabled={disabled}
          showClear={!disabled}
        />
        <ComboboxContent className="glass-strong glow-border">
          <ComboboxList>
            {isFetching && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Buscando grupos...
              </div>
            )}
            <ComboboxEmpty>Nenhum grupo encontrado</ComboboxEmpty>
            {items.map((household) => (
              <ComboboxItem key={household.id} value={household}>
                {household.name}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
