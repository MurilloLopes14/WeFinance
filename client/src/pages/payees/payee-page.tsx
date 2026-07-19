import {
  getCategoriesControllerFindAllQueryKey,
  categoriesControllerFindAll,
} from '@/api/generated/categories/categories'
import {
  getPayeesControllerFindAllQueryKey,
  payeesControllerFindAll,
  usePayeesControllerRemove,
} from '@/api/generated/payees/payees'
import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'
import { PayeeHeader } from '@/components/payees/payee-header'
import { PayeeTableSkeleton } from '@/components/payees/payee-table-skeleton'
import { PayeesDataTable } from '@/components/payees/payees-data-table'
import { ObjectDeleteConfirmDialog } from '@/components/object/object-delete-confirm-dialog'
import { ObjectCollectionState } from '@/components/object/object-collection-state'
import { ObjectEmptyState } from '@/components/object/object-empty-state'
import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import { useAuthSession } from '@/hooks/use-auth-session'
import { householdsListParams } from '@/lib/household-api-helpers'
import {
  findHouseholdInList,
  getHouseholdNameMap,
  isHouseholdMember,
  isMemberOfAnyHousehold,
} from '@/lib/household-helpers'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import {
  filterPayeesForTable,
  paginatePayees,
  PAYEES_PAGE_SIZE,
  type PayeeFilters,
} from '@/lib/payee-table-helpers'
import { PayeeCreateModal } from '@/pages/payees/modals/payee-create-modal'
import { PayeeEditModal } from '@/pages/payees/modals/payee-edit-modal'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { Contact, SearchX, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const defaultFilters: PayeeFilters = {
  householdId: 'all',
}

export function PayeePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<PayeeFilters>(defaultFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [editPayee, setEditPayee] = useState<PayeeResponseDto | null>(null)
  const [deletePayee, setDeletePayee] = useState<PayeeResponseDto | null>(null)

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

  const canCreatePayee = isMemberOfAnyHousehold(households, currentUser?.id)

  const householdIdsForFetch = useMemo(() => {
    if (!households?.length) return []

    if (filters.householdId === 'all') {
      return households.map((household) => household.id)
    }

    return households.some((household) => household.id === filters.householdId)
      ? [filters.householdId]
      : []
  }, [filters.householdId, households])

  const payeeQueries = useQueries({
    queries: householdIdsForFetch.map((householdId) => ({
      queryKey: getPayeesControllerFindAllQueryKey(householdId),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        payeesControllerFindAll(householdId, undefined, undefined, signal),
      enabled: Boolean(householdId),
    })),
  })

  const payees = useMemo(
    () => payeeQueries.flatMap((query) => query.data ?? []),
    [payeeQueries],
  )

  const householdIdsForCategories = useMemo(
    () => [...new Set(payees.map((payee) => payee.householdId))],
    [payees],
  )

  const categoryQueries = useQueries({
    queries: householdIdsForCategories.map((householdId) => ({
      queryKey: getCategoriesControllerFindAllQueryKey(householdId),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        categoriesControllerFindAll(householdId, undefined, signal),
      enabled: Boolean(householdId),
    })),
  })

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {}
    categoryQueries.forEach((query) => {
      query.data?.forEach((category) => {
        map[category.id] = category.name
      })
    })
    return map
  }, [categoryQueries])

  const filteredPayees = useMemo(
    () => filterPayeesForTable(payees, search, filters),
    [filters, payees, search],
  )

  const pagination = useMemo(
    () => paginatePayees(filteredPayees, page, PAYEES_PAGE_SIZE),
    [filteredPayees, page],
  )

  useEffect(() => {
    setPage(1)
  }, [filters.householdId, search])

  useEffect(() => {
    if (page > pagination.totalPages && pagination.totalPages > 0) {
      setPage(pagination.totalPages)
    }
  }, [page, pagination.totalPages])

  const hasAnyHousehold = (households?.length ?? 0) > 0
  const hasAnyPayee = payees.length > 0
  const hasFilteredResults = filteredPayees.length > 0
  const isLoadingPayees = payeeQueries.some((query) => query.isLoading)
  const isPayeesError = payeeQueries.some((query) => query.isError)
  const isLoading = isLoadingHouseholds || isLoadingPayees
  const isError = isHouseholdsError || isPayeesError
  const showHouseholdColumn = filters.householdId === 'all'

  const canManagePayee = useCallback(
    (payee: PayeeResponseDto) => {
      const household = findHouseholdInList(households, payee.householdId)
      return isHouseholdMember(household?.members, currentUser?.id)
    },
    [currentUser?.id, households],
  )

  const deleteMutation = usePayeesControllerRemove({
    mutation: {
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getPayeesControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Pagador excluído com sucesso')
        setDeletePayee(null)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível excluir o pagador'))
      },
    },
  })

  const tableMeta = useMemo(
    () => ({
      householdNameById,
      categoryNameById,
      showHouseholdColumn,
      canManagePayee,
      onEdit: setEditPayee,
      onDelete: setDeletePayee,
    }),
    [canManagePayee, categoryNameById, householdNameById, showHouseholdColumn],
  )

  const refetch = () => {
    void refetchHouseholds()
    payeeQueries.forEach((query) => {
      void query.refetch()
    })
  }

  const openCreate = () => setCreateOpen(true)

  return (
    <ObjectPageLayout>
      <PayeeHeader
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        households={households ?? []}
        showToolbar={hasAnyHousehold}
        createAction={
          canCreatePayee
            ? {
                label: 'Novo pagador',
                onClick: openCreate,
              }
            : undefined
        }
      />

      <ObjectPageContent tourAnchor="payees-list">
        <ObjectCollectionState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!hasAnyHousehold}
          skeleton={<PayeeTableSkeleton />}
          onRetry={refetch}
          emptyState={
            <ObjectEmptyState
              icon={Users}
              title="Nenhum grupo disponível"
              description="Crie um grupo antes de cadastrar pagadores e recebedores."
              actions={[
                {
                  label: 'Ir para grupos',
                  onClick: () => navigate('/dashboard/grupos'),
                },
              ]}
            />
          }
        >
          {!hasAnyPayee ? (
            <ObjectEmptyState
              icon={Contact}
              title="Nenhum pagador ainda"
              description={
                canCreatePayee
                  ? 'Cadastre quem paga ou recebe nas transações do grupo. Você também pode criar rapidamente ao registrar uma transação.'
                  : 'Ainda não há pagadores ou recebedores nos seus grupos.'
              }
              actions={
                canCreatePayee
                  ? [
                      {
                        label: 'Cadastrar primeiro pagador',
                        onClick: openCreate,
                      },
                    ]
                  : []
              }
            />
          ) : !hasFilteredResults ? (
            <ObjectEmptyState
              icon={SearchX}
              title="Nenhum pagador encontrado"
              description="Ajuste a busca ou os filtros para localizar o registro desejado."
              actions={[
                {
                  label: 'Limpar busca e filtros',
                  variant: 'outline',
                  onClick: () => {
                    setSearch('')
                    setFilters(defaultFilters)
                  },
                },
                ...(canCreatePayee
                  ? [
                      {
                        label: 'Novo pagador',
                        onClick: openCreate,
                      },
                    ]
                  : []),
              ]}
            />
          ) : (
            <PayeesDataTable
              payees={pagination.items}
              meta={tableMeta}
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          )}
        </ObjectCollectionState>
      </ObjectPageContent>

      {hasAnyHousehold && (
        <>
          <PayeeCreateModal open={createOpen} onOpenChange={setCreateOpen} />

          <PayeeEditModal
            payee={editPayee}
            open={editPayee !== null}
            onOpenChange={(open) => {
              if (!open) setEditPayee(null)
            }}
          />

          <ObjectDeleteConfirmDialog
            open={deletePayee !== null}
            onOpenChange={(open) => {
              if (!open) setDeletePayee(null)
            }}
            title="Excluir pagador"
            description={`Tem certeza que deseja excluir "${deletePayee?.name}"? Esta ação não pode ser desfeita.`}
            onConfirm={() => {
              if (!deletePayee) return
              deleteMutation.mutate({
                householdId: deletePayee.householdId,
                payeeId: deletePayee.id,
              })
            }}
            isPending={deleteMutation.isPending}
          />
        </>
      )}
    </ObjectPageLayout>
  )
}
