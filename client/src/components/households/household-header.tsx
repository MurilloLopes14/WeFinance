import { ObjectHeader, type ObjectHeaderCreateAction } from '@/components/object/object-header'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { HouseholdResponseDtoDefaultSplitType } from '@/api/generated/models/householdResponseDtoDefaultSplitType'

export type HouseholdFilters = {
  splitType: HouseholdResponseDtoDefaultSplitType | 'all'
}

type HouseholdHeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: HouseholdFilters
  onFiltersChange: (filters: HouseholdFilters) => void
  createAction?: ObjectHeaderCreateAction
  showToolbar?: boolean
}

const splitTypeOptions: Array<{
  value: HouseholdFilters['splitType']
  label: string
}> = [
  { value: 'all', label: 'Todos os rateios' },
  { value: 'equal', label: 'Igualitário' },
  { value: 'percent', label: 'Percentual' },
  { value: 'fixed', label: 'Fixo' },
]

export function HouseholdHeader({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  createAction,
  showToolbar = true,
}: HouseholdHeaderProps) {
  const activeFiltersCount = filters.splitType === 'all' ? 0 : 1

  return (
    <ObjectHeader
      title="Grupos"
      description="Organize finanças compartilhadas com família, casal ou amigos. Cada grupo tem moeda, rateio e membros próprios."
      searchValue={showToolbar ? searchValue : undefined}
      onSearchChange={showToolbar ? onSearchChange : undefined}
      searchPlaceholder="Buscar grupos por nome..."
      filtersTitle="Filtrar grupos"
      filtersDescription="Combine filtros para encontrar grupos específicos."
      activeFiltersCount={activeFiltersCount}
      onClearFilters={() => onFiltersChange({ splitType: 'all' })}
      createAction={createAction}
      filtersContent={
        showToolbar ? (
          <div className="space-y-2">
            <Label htmlFor="household-filter-split">Tipo de rateio</Label>
            <Select
              value={filters.splitType}
              onValueChange={(value) => {
                if (!value) return
                onFiltersChange({
                  splitType: value as HouseholdFilters['splitType'],
                })
              }}
              items={splitTypeOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            >
              <SelectTrigger id="household-filter-split" className="w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong glow-border">
                <SelectGroup>
                  {splitTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ) : undefined
      }
    />
  )
}

export function getHouseholdSplitTypeLabel(
  splitType: HouseholdResponseDtoDefaultSplitType,
): string {
  switch (splitType) {
    case 'equal':
      return 'Igualitário'
    case 'percent':
      return 'Percentual'
    case 'fixed':
      return 'Fixo'
    default:
      return splitType
  }
}
