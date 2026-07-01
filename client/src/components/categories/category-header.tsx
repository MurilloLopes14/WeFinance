import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import type { CategoryResponseDtoKind } from '@/api/generated/models/categoryResponseDtoKind'
import { ObjectHeader, ObjectFilterSelectContent, type ObjectHeaderCreateAction } from '@/components/object/object-header'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCategoryKindLabel } from '@/lib/category-helpers'

export type CategoryHouseholdFilter = 'all' | (string & {})

export type CategoryFilters = {
  householdId: CategoryHouseholdFilter
  kind: CategoryResponseDtoKind | 'all'
}

type CategoryHeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: CategoryFilters
  onFiltersChange: (filters: CategoryFilters) => void
  households: HouseholdResponseDto[]
  createAction?: ObjectHeaderCreateAction
  showToolbar?: boolean
}

const kindOptions: Array<{ value: CategoryFilters['kind']; label: string }> = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'expense', label: getCategoryKindLabel('expense') },
  { value: 'income', label: getCategoryKindLabel('income') },
  { value: 'transfer', label: getCategoryKindLabel('transfer') },
]

export function CategoryHeader({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  households,
  createAction,
  showToolbar = true,
}: CategoryHeaderProps) {
  const totalActiveFilters =
    (filters.householdId === 'all' ? 0 : 1) + (filters.kind === 'all' ? 0 : 1)

  return (
    <ObjectHeader
      title="Categorias"
      tourAnchor="categories-header"
      description="Organize despesas, receitas e transferências por grupo. Use cores e subcategorias para manter tudo fácil de encontrar."
      searchValue={showToolbar ? searchValue : undefined}
      onSearchChange={showToolbar ? onSearchChange : undefined}
      searchPlaceholder="Buscar categorias por nome..."
      filtersTitle="Filtrar categorias"
      filtersDescription="Refine a listagem por grupo e tipo de categoria."
      activeFiltersCount={totalActiveFilters}
      onClearFilters={() =>
        onFiltersChange({
          householdId: 'all',
          kind: 'all',
        })
      }
      createAction={createAction}
      filtersContent={
        showToolbar ? (
          <div className="space-y-4">
            {households.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="category-filter-household">Grupo</Label>
                <Select
                  value={filters.householdId}
                  onValueChange={(value) => {
                    if (!value) return
                    onFiltersChange({
                      ...filters,
                      householdId: value as CategoryFilters['householdId'],
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
                    id="category-filter-household"
                    className="w-full rounded-xl"
                  >
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <ObjectFilterSelectContent>
                    <SelectGroup>
                      <SelectItem value="all">Todos os grupos</SelectItem>
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
              <Label htmlFor="category-filter-kind">Tipo</Label>
              <Select
                value={filters.kind}
                onValueChange={(value) => {
                  if (!value) return
                  onFiltersChange({
                    ...filters,
                    kind: value as CategoryFilters['kind'],
                  })
                }}
                items={kindOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              >
                <SelectTrigger id="category-filter-kind" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <ObjectFilterSelectContent>
                  <SelectGroup>
                    {kindOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </ObjectFilterSelectContent>
              </Select>
            </div>
          </div>
        ) : undefined
      }
    />
  )
}
