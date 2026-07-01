import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { ObjectHeader, ObjectFilterSelectContent } from '@/components/object/object-header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type SplitFilters = {
  householdId: string
  month: string
}

type SplitHeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: SplitFilters
  onFiltersChange: (filters: SplitFilters) => void
  households: HouseholdResponseDto[]
  showToolbar?: boolean
}

export function SplitHeader({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  households,
  showToolbar = true,
}: SplitHeaderProps) {
  const totalActiveFilters = filters.month ? 1 : 0

  return (
    <ObjectHeader
      title="Rateios"
      tourAnchor="splits-header"
      description="Veja como cada despesa ou receita foi dividida entre os membros do grupo. A tabela agrupa as parcelas por transação."
      searchValue={showToolbar ? searchValue : undefined}
      onSearchChange={showToolbar ? onSearchChange : undefined}
      searchPlaceholder="Buscar por transação ou membro..."
      filtersTitle="Filtrar rateios"
      filtersDescription="Selecione o grupo e, se quiser, restrinja por mês."
      activeFiltersCount={totalActiveFilters}
      onClearFilters={() =>
        onFiltersChange({
          ...filters,
          month: '',
        })
      }
      filtersContent={
        showToolbar ? (
          <div className="space-y-4">
            {households.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="split-filter-household">Grupo</Label>
                <Select
                  value={filters.householdId}
                  onValueChange={(value) => {
                    if (!value) return
                    onFiltersChange({
                      ...filters,
                      householdId: value,
                    })
                  }}
                  items={households.map((household) => ({
                    value: household.id,
                    label: household.name,
                  }))}
                >
                  <SelectTrigger id="split-filter-household" className="w-full rounded-xl">
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <ObjectFilterSelectContent>
                    <SelectGroup>
                      {households.map((household) => (
                        <SelectItem key={household.id} value={household.id}>
                          {household.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </ObjectFilterSelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="split-filter-month">Mês</Label>
              <Input
                id="split-filter-month"
                type="month"
                value={filters.month}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    month: event.target.value,
                  })
                }
                className="glass-subtle rounded-xl"
              />
            </div>
          </div>
        ) : undefined
      }
    />
  )
}
