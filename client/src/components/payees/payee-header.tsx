import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
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
import type { PayeeFilters } from '@/lib/payee-table-helpers'

type PayeeHeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: PayeeFilters
  onFiltersChange: (filters: PayeeFilters) => void
  households: HouseholdResponseDto[]
  createAction?: ObjectHeaderCreateAction
  showToolbar?: boolean
}

export function PayeeHeader({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  households,
  createAction,
  showToolbar = true,
}: PayeeHeaderProps) {
  const totalActiveFilters = filters.householdId === 'all' ? 0 : 1

  return (
    <ObjectHeader
      title="Pagadores e recebedores"
      tourAnchor="payees-header"
      toolbarTourAnchor="payees-toolbar"
      description="Cadastre quem paga ou recebe nas transações do grupo. Use regras de correspondência para identificar automaticamente lançamentos importados."
      searchValue={showToolbar ? searchValue : undefined}
      onSearchChange={showToolbar ? onSearchChange : undefined}
      searchPlaceholder="Buscar por nome..."
      filtersTitle="Filtrar pagadores"
      filtersDescription="Refine a listagem por grupo."
      activeFiltersCount={totalActiveFilters}
      onClearFilters={() =>
        onFiltersChange({
          householdId: 'all',
        })
      }
      createAction={createAction}
      filtersContent={
        showToolbar ? (
          <div className="space-y-4">
            {households.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="payee-filter-household">Grupo</Label>
                <Select
                  value={filters.householdId}
                  onValueChange={(value) => {
                    if (!value) return
                    onFiltersChange({
                      ...filters,
                      householdId: value as PayeeFilters['householdId'],
                    })
                  }}
                  items={[
                    { value: 'all', label: 'Todos os grupos' },
                    ...households.map((household) => ({
                      value: household.id,
                      label: household.name,
                    })),
                  ]}
                >
                  <SelectTrigger
                    id="payee-filter-household"
                    className="w-full rounded-xl"
                  >
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong glow-border">
                    <SelectGroup>
                      <SelectItem value="all">Todos os grupos</SelectItem>
                      {households.map((household) => (
                        <SelectItem key={household.id} value={household.id}>
                          {household.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ) : undefined
      }
    />
  )
}
