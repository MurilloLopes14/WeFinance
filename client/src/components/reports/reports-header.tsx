import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { ObjectHeader, ObjectFilterSelectContent } from '@/components/object/object-header'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createDefaultReportsFilters,
  type ReportsFilters,
} from '@/lib/reports-helpers'
import { useEffect, useState } from 'react'

type ReportsHeaderProps = {
  households: HouseholdResponseDto[]
  filters: ReportsFilters
  onFiltersChange: (filters: ReportsFilters) => void
  showToolbar?: boolean
}

export function ReportsHeader({
  households,
  filters,
  onFiltersChange,
  showToolbar = true,
}: ReportsHeaderProps) {
  const [draftFilters, setDraftFilters] = useState(filters)

  useEffect(() => {
    setDraftFilters(filters)
  }, [filters])

  const hasHouseholdFilter =
    Boolean(filters.householdId) && households.length > 1

  return (
    <ObjectHeader
      title="Relatórios"
      description="Análises aprofundadas do grupo com mês geral e filtros individuais por gráfico."
      filtersTitle="Filtrar relatórios"
      filtersDescription="Escolha o grupo. O mês geral fica na faixa abaixo e cada gráfico pode ter um mês próprio."
      activeFiltersCount={hasHouseholdFilter ? 1 : 0}
      onFiltersOpenChange={(open) => {
        if (open) setDraftFilters(filters)
      }}
      onApplyFilters={() => onFiltersChange(draftFilters)}
      onClearFilters={() => {
        const cleared = createDefaultReportsFilters(filters.householdId)
        setDraftFilters(cleared)
        onFiltersChange(cleared)
      }}
      filtersContent={
        showToolbar && households.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="reports-filter-household">Grupo</Label>
            <Select
              value={draftFilters.householdId}
              onValueChange={(value) => {
                if (!value) return
                setDraftFilters((current) => ({
                  ...current,
                  householdId: value,
                }))
              }}
              items={households.map((household) => ({
                value: household.id,
                label: household.name,
              }))}
            >
              <SelectTrigger
                id="reports-filter-household"
                className="h-11 w-full rounded-xl touch-manipulation sm:h-9"
              >
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
        ) : undefined
      }
    />
  )
}
