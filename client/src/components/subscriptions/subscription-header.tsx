import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import type { SubscriptionResponseDtoType } from '@/api/generated/models/subscriptionResponseDtoType'
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
import { getSubscriptionTypeLabel } from '@/lib/subscription-helpers'

export type SubscriptionHouseholdFilter = 'all' | (string & {})

export type SubscriptionActiveFilter = 'all' | 'active' | 'inactive'

export type SubscriptionFilters = {
  householdId: SubscriptionHouseholdFilter
  type: SubscriptionResponseDtoType | 'all'
  active: SubscriptionActiveFilter
}

type SubscriptionHeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: SubscriptionFilters
  onFiltersChange: (filters: SubscriptionFilters) => void
  households: HouseholdResponseDto[]
  createAction?: ObjectHeaderCreateAction
  showToolbar?: boolean
}

const typeOptions: Array<{ value: SubscriptionFilters['type']; label: string }> = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'expense', label: getSubscriptionTypeLabel('expense') },
  { value: 'income', label: getSubscriptionTypeLabel('income') },
]

const activeOptions: Array<{ value: SubscriptionFilters['active']; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Ativas' },
  { value: 'inactive', label: 'Pausadas' },
]

export function SubscriptionHeader({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  households,
  createAction,
  showToolbar = true,
}: SubscriptionHeaderProps) {
  const totalActiveFilters =
    (filters.householdId === 'all' ? 0 : 1) +
    (filters.type === 'all' ? 0 : 1) +
    (filters.active === 'all' ? 0 : 1)

  return (
    <ObjectHeader
      title="Despesas e Receitas Fixas"
      tourAnchor="subscriptions-header"
      description="Gerencie despesas e receitas fixas do grupo. Cada fixo gera transações automaticamente na data programada."
      searchValue={showToolbar ? searchValue : undefined}
      onSearchChange={showToolbar ? onSearchChange : undefined}
      searchPlaceholder="Buscar fixos por nome..."
      filtersTitle="Filtrar fixos"
      filtersDescription="Refine a listagem por grupo, tipo e status."
      activeFiltersCount={totalActiveFilters}
      onClearFilters={() =>
        onFiltersChange({
          householdId: 'all',
          type: 'all',
          active: 'all',
        })
      }
      createAction={createAction}
      filtersContent={
        showToolbar ? (
          <div className="space-y-4">
            {households.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subscription-filter-household">Grupo</Label>
                <Select
                  value={filters.householdId}
                  onValueChange={(value) => {
                    if (!value) return
                    onFiltersChange({
                      ...filters,
                      householdId: value as SubscriptionFilters['householdId'],
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
                    id="subscription-filter-household"
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

            <div className="space-y-2">
              <Label htmlFor="subscription-filter-type">Tipo</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => {
                  if (!value) return
                  onFiltersChange({
                    ...filters,
                    type: value as SubscriptionFilters['type'],
                  })
                }}
                items={typeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              >
                <SelectTrigger id="subscription-filter-type" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong glow-border">
                  <SelectGroup>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription-filter-active">Status</Label>
              <Select
                value={filters.active}
                onValueChange={(value) => {
                  if (!value) return
                  onFiltersChange({
                    ...filters,
                    active: value as SubscriptionFilters['active'],
                  })
                }}
                items={activeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              >
                <SelectTrigger id="subscription-filter-active" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong glow-border">
                  <SelectGroup>
                    {activeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : undefined
      }
    />
  )
}
