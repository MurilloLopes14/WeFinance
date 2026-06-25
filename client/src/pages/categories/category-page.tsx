import {
  categoriesControllerFindAll,
  getCategoriesControllerFindAllQueryKey,
  useCategoriesControllerRemove,
} from '@/api/generated/categories/categories'
import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import type { CategoryResponseDto } from '@/api/generated/models/categoryResponseDto'
import {
  CategoryCard,
  categoryCardGridClassName,
} from '@/components/categories/category-card'
import { CategoryCardGridSkeleton } from '@/components/categories/category-card-grid-skeleton'
import {
  CategoryHeader,
  type CategoryFilters,
} from '@/components/categories/category-header'
import { ObjectDeleteConfirmDialog } from '@/components/object/object-delete-confirm-dialog'
import { ObjectCollectionState } from '@/components/object/object-collection-state'
import { ObjectEmptyState } from '@/components/object/object-empty-state'
import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import { useAuthSession } from '@/hooks/use-auth-session'
import { findCategoryInList } from '@/lib/category-helpers'
import { householdsListParams } from '@/lib/household-api-helpers'
import {
  findHouseholdInList,
  getHouseholdNameMap,
  isHouseholdOwner,
  isOwnerOfAnyHousehold,
} from '@/lib/household-helpers'
import { CategoryCreateModal } from '@/pages/categories/modals/category-create-modal'
import { CategoryEditModal } from '@/pages/categories/modals/category-edit-modal'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { SearchX, Tags, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const defaultFilters: CategoryFilters = {
  householdId: 'all',
  kind: 'all',
}

export function CategoryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<CategoryFilters>(defaultFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<CategoryResponseDto | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<CategoryResponseDto | null>(null)

  const { data: currentUser } = useAuthSession()
  const {
    data: households,
    isLoading: isLoadingHouseholds,
    isError: isHouseholdsError,
    refetch: refetchHouseholds,
  } = useHouseholdsControllerFindAll(householdsListParams)

  const householdNameById = useMemo(
    () => getHouseholdNameMap(households),
    [households],
  )

  const canCreateCategory = isOwnerOfAnyHousehold(households, currentUser?.id)

  const householdIdsForFetch = useMemo(() => {
    if (!households?.length) return []

    if (filters.householdId === 'all') {
      return households.map((household) => household.id)
    }

    return households.some((household) => household.id === filters.householdId)
      ? [filters.householdId]
      : []
  }, [filters.householdId, households])

  const categoryQueries = useQueries({
    queries: householdIdsForFetch.map((householdId) => ({
      queryKey: getCategoriesControllerFindAllQueryKey(householdId),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        categoriesControllerFindAll(householdId, undefined, signal),
      enabled: Boolean(householdId),
    })),
  })

  const categories = useMemo(
    () => categoryQueries.flatMap((query) => query.data ?? []),
    [categoryQueries],
  )

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return categories.filter((category) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        category.name.toLowerCase().includes(normalizedSearch)

      const matchesKind = filters.kind === 'all' || category.kind === filters.kind

      const matchesHousehold =
        filters.householdId === 'all' || category.householdId === filters.householdId

      return matchesSearch && matchesKind && matchesHousehold
    })
  }, [categories, filters.householdId, filters.kind, search])

  const hasAnyHousehold = (households?.length ?? 0) > 0
  const hasAnyCategory = categories.length > 0
  const hasFilteredResults = filteredCategories.length > 0
  const isLoadingCategories = categoryQueries.some((query) => query.isLoading)
  const isCategoriesError = categoryQueries.some((query) => query.isError)
  const isLoading = isLoadingHouseholds || isLoadingCategories
  const isError = isHouseholdsError || isCategoriesError

  const openCreate = () => setCreateOpen(true)

  const canEditCategory = (category: CategoryResponseDto) => {
    const household = findHouseholdInList(households, category.householdId)
    return isHouseholdOwner(household?.members, currentUser?.id)
  }

  const deleteMutation = useCategoriesControllerRemove({
    mutation: {
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getCategoriesControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Categoria excluída com sucesso')
        setDeleteCategory(null)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível excluir a categoria'))
      },
    },
  })

  const refetch = () => {
    void refetchHouseholds()
    categoryQueries.forEach((query) => {
      void query.refetch()
    })
  }

  return (
    <ObjectPageLayout>
      <CategoryHeader
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        households={households ?? []}
        showToolbar={hasAnyHousehold}
        createAction={
          canCreateCategory
            ? {
                label: 'Nova categoria',
                onClick: openCreate,
              }
            : undefined
        }
      />

      <ObjectPageContent tourAnchor="categories-list">
        <ObjectCollectionState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!hasAnyHousehold}
          skeleton={<CategoryCardGridSkeleton />}
          onRetry={refetch}
          emptyState={
            <ObjectEmptyState
              icon={Users}
              title="Nenhum grupo disponível"
              description="Crie um grupo antes de cadastrar categorias. Elas são organizadas por grupo familiar."
              actions={[
                {
                  label: 'Ir para grupos',
                  onClick: () => navigate('/dashboard/grupos'),
                },
              ]}
            />
          }
        >
          {!hasAnyCategory ? (
            <ObjectEmptyState
              icon={Tags}
              title="Nenhuma categoria ainda"
              description={
                canCreateCategory
                  ? 'Crie a primeira categoria escolhendo o grupo no formulário de cadastro.'
                  : 'Ainda não há categorias nos seus grupos.'
              }
              actions={
                canCreateCategory
                  ? [
                      {
                        label: 'Criar primeira categoria',
                        onClick: openCreate,
                      },
                    ]
                  : []
              }
            />
          ) : !hasFilteredResults ? (
            <ObjectEmptyState
              icon={SearchX}
              title="Nenhuma categoria encontrada"
              description="Ajuste a busca ou os filtros para localizar a categoria desejada."
              actions={[
                {
                  label: 'Limpar busca e filtros',
                  variant: 'outline',
                  onClick: () => {
                    setSearch('')
                    setFilters(defaultFilters)
                  },
                },
                ...(canCreateCategory
                  ? [
                      {
                        label: 'Nova categoria',
                        onClick: openCreate,
                      },
                    ]
                  : []),
              ]}
            />
          ) : (
            <div className={categoryCardGridClassName}>
              {filteredCategories.map((category) => {
                const parent = category.parentId
                  ? findCategoryInList(categories, category.parentId)
                  : undefined

                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    householdName={householdNameById[category.householdId]}
                    parentName={parent?.name}
                    onEdit={canEditCategory(category) ? setEditCategory : undefined}
                    onDelete={canEditCategory(category) ? setDeleteCategory : undefined}
                  />
                )
              })}
            </div>
          )}
        </ObjectCollectionState>
      </ObjectPageContent>

      {hasAnyHousehold && (
        <>
          <CategoryCreateModal open={createOpen} onOpenChange={setCreateOpen} />

          <CategoryEditModal
            category={editCategory}
            open={editCategory !== null}
            onOpenChange={(open) => {
              if (!open) setEditCategory(null)
            }}
          />

          <ObjectDeleteConfirmDialog
            open={deleteCategory !== null}
            onOpenChange={(open) => {
              if (!open) setDeleteCategory(null)
            }}
            title="Excluir categoria"
            description={`Tem certeza que deseja excluir "${deleteCategory?.name}"? Esta ação não pode ser desfeita.`}
            onConfirm={() => {
              if (!deleteCategory) return
              deleteMutation.mutate({
                householdId: deleteCategory.householdId,
                categoryId: deleteCategory.id,
              })
            }}
            isPending={deleteMutation.isPending}
          />
        </>
      )}
    </ObjectPageLayout>
  )
}
