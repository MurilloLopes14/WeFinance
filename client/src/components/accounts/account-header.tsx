import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import type { AccountResponseDtoType } from '@/api/generated/models/accountResponseDtoType'
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
import { getAccountTypeLabel } from '@/lib/account-helpers'

export type AccountHouseholdFilter = 'all' | (string & {})

export type AccountFilters = {
  householdId: AccountHouseholdFilter
  type: AccountResponseDtoType | 'all'
}

type AccountHeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: AccountFilters
  onFiltersChange: (filters: AccountFilters) => void
  households: HouseholdResponseDto[]
  createAction?: ObjectHeaderCreateAction
  showToolbar?: boolean
}

const accountTypeOptions: Array<{
  value: AccountFilters['type']
  label: string
}> = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'checking', label: getAccountTypeLabel('checking') },
  { value: 'savings', label: getAccountTypeLabel('savings') },
  { value: 'credit', label: getAccountTypeLabel('credit') },
  { value: 'cash', label: getAccountTypeLabel('cash') },
  { value: 'investment', label: getAccountTypeLabel('investment') },
]

export function AccountHeader({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  households,
  createAction,
  showToolbar = true,
}: AccountHeaderProps) {
  const totalActiveFilters =
    (filters.householdId === 'all' ? 0 : 1) + (filters.type === 'all' ? 0 : 1)

  return (
    <ObjectHeader
      title="Contas"
      tourAnchor="accounts-header"
      description="Cadastre contas bancárias, cartões, poupança e investimentos por grupo para registrar transações e acompanhar saldos."
      searchValue={showToolbar ? searchValue : undefined}
      onSearchChange={showToolbar ? onSearchChange : undefined}
      searchPlaceholder="Buscar contas por nome ou instituição..."
      filtersTitle="Filtrar contas"
      filtersDescription="Refine a listagem por grupo e tipo de conta."
      activeFiltersCount={totalActiveFilters}
      onClearFilters={() =>
        onFiltersChange({
          householdId: 'all',
          type: 'all',
        })
      }
      createAction={createAction}
      filtersContent={
        showToolbar ? (
          <div className="space-y-4">
            {households.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="account-filter-household">Grupo</Label>
                <Select
                  value={filters.householdId}
                  onValueChange={(value) => {
                    if (!value) return
                    onFiltersChange({
                      ...filters,
                      householdId: value as AccountFilters['householdId'],
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
                    id="account-filter-household"
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
              <Label htmlFor="account-filter-type">Tipo</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => {
                  if (!value) return
                  onFiltersChange({
                    ...filters,
                    type: value as AccountFilters['type'],
                  })
                }}
                items={accountTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              >
                <SelectTrigger id="account-filter-type" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong glow-border">
                  <SelectGroup>
                    {accountTypeOptions.map((option) => (
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
