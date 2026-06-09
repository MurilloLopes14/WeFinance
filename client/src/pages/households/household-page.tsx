import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import { householdsListParams } from '@/lib/household-api-helpers'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { HouseholdCard, householdCardGridClassName } from '@/components/households/household-card'
import { HouseholdCardGridSkeleton } from '@/components/households/household-card-grid-skeleton'
import {
  HouseholdHeader,
  type HouseholdFilters,
} from '@/components/households/household-header'
import { ObjectCollectionState } from '@/components/object/object-collection-state'
import { ObjectEmptyState } from '@/components/object/object-empty-state'
import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import { HouseholdCreateModal } from '@/pages/households/modals/household-create-modal'
import { HouseholdEditMembersModal } from '@/pages/households/modals/household-edit-members-modal'
import { HouseholdEditModal } from '@/pages/households/modals/household-edit-modal'
import { HouseholdView } from '@/pages/households/modals/household-view'
import { SearchX, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

const defaultFilters: HouseholdFilters = {
  splitType: 'all',
}

export function HouseholdPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<HouseholdFilters>(defaultFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewHousehold, setViewHousehold] = useState<HouseholdResponseDto | null>(null)
  const [editHousehold, setEditHousehold] = useState<HouseholdResponseDto | null>(null)
  const [membersHousehold, setMembersHousehold] = useState<HouseholdResponseDto | null>(null)

  const { data, isLoading, isError, refetch } =
    useHouseholdsControllerFindAll(householdsListParams)

  const filteredHouseholds = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return (data ?? []).filter((household) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        household.name.toLowerCase().includes(normalizedSearch)

      const matchesSplitType =
        filters.splitType === 'all' || household.defaultSplitType === filters.splitType

      return matchesSearch && matchesSplitType
    })
  }, [data, filters.splitType, search])

  const hasAnyHousehold = (data?.length ?? 0) > 0
  const hasFilteredResults = filteredHouseholds.length > 0

  const openCreate = () => setCreateOpen(true)

  return (
    <ObjectPageLayout>
      <HouseholdHeader
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        createAction={{
          label: 'Novo grupo',
          onClick: openCreate,
        }}
      />

      <ObjectPageContent>
        <ObjectCollectionState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!hasAnyHousehold}
          skeleton={<HouseholdCardGridSkeleton />}
          onRetry={() => refetch()}
          emptyState={
            <ObjectEmptyState
              icon={Users}
              title="Nenhum grupo ainda"
              description="Crie seu primeiro grupo para começar a organizar finanças compartilhadas com outras pessoas."
              actions={[
                {
                  label: 'Criar primeiro grupo',
                  onClick: openCreate,
                },
              ]}
            />
          }
        >
          {!hasFilteredResults ? (
            <ObjectEmptyState
              icon={SearchX}
              title="Nenhum grupo encontrado"
              description="Ajuste a busca ou os filtros para localizar o grupo desejado."
              actions={[
                {
                  label: 'Limpar busca e filtros',
                  variant: 'outline',
                  onClick: () => {
                    setSearch('')
                    setFilters(defaultFilters)
                  },
                },
                {
                  label: 'Novo grupo',
                  onClick: openCreate,
                },
              ]}
            />
          ) : (
            <div className={householdCardGridClassName}>
              {filteredHouseholds.map((household) => (
                <HouseholdCard
                  key={household.id}
                  household={household}
                  onView={setViewHousehold}
                  onEdit={setEditHousehold}
                  onManageMembers={setMembersHousehold}
                />
              ))}
            </div>
          )}
        </ObjectCollectionState>
      </ObjectPageContent>

      <HouseholdCreateModal open={createOpen} onOpenChange={setCreateOpen} />

      <HouseholdView
        household={viewHousehold}
        open={viewHousehold !== null}
        onOpenChange={(open) => {
          if (!open) setViewHousehold(null)
        }}
        onEdit={(household) => {
          setViewHousehold(null)
          setEditHousehold(household)
        }}
      />

      <HouseholdEditModal
        household={editHousehold}
        open={editHousehold !== null}
        onOpenChange={(open) => {
          if (!open) setEditHousehold(null)
        }}
      />

      <HouseholdEditMembersModal
        household={membersHousehold}
        open={membersHousehold !== null}
        onOpenChange={(open) => {
          if (!open) setMembersHousehold(null)
        }}
      />
    </ObjectPageLayout>
  )
}
