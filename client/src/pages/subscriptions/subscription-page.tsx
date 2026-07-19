import { accountsControllerFindAll, getAccountsControllerFindAllQueryKey } from '@/api/generated/accounts/accounts'
import { categoriesControllerFindAll, getCategoriesControllerFindAllQueryKey } from '@/api/generated/categories/categories'
import {
  subscriptionsControllerFindAll,
  getSubscriptionsControllerFindAllQueryKey,
  useSubscriptionsControllerRemove,
} from '@/api/generated/subscriptions/subscriptions'
import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import type { SubscriptionResponseDto } from '@/api/generated/models/subscriptionResponseDto'
import {
  SubscriptionCard,
  subscriptionCardGridClassName,
} from '@/components/subscriptions/subscription-card'
import { SubscriptionCardGridSkeleton } from '@/components/subscriptions/subscription-card-grid-skeleton'
import {
  SubscriptionHeader,
  type SubscriptionFilters,
} from '@/components/subscriptions/subscription-header'
import { ObjectDeleteConfirmDialog } from '@/components/object/object-delete-confirm-dialog'
import { ObjectCollectionState } from '@/components/object/object-collection-state'
import { ObjectEmptyState } from '@/components/object/object-empty-state'
import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import { useAuthSession } from '@/hooks/use-auth-session'
import { householdsListParams } from '@/lib/household-api-helpers'
import {
  canManageAnyHousehold,
  findHouseholdInList,
  getHouseholdNameMap,
  isHouseholdAtLeastModerator,
} from '@/lib/household-helpers'
import { SubscriptionCreateModal } from '@/pages/subscriptions/modals/subscription-create-modal'
import { SubscriptionEditModal } from '@/pages/subscriptions/modals/subscription-edit-modal'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, SearchX, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const defaultFilters: SubscriptionFilters = {
  householdId: 'all',
  type: 'all',
  active: 'all',
}

export function SubscriptionPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<SubscriptionFilters>(defaultFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [editSubscription, setEditSubscription] = useState<SubscriptionResponseDto | null>(null)
  const [deleteSubscription, setDeleteSubscription] = useState<SubscriptionResponseDto | null>(
    null,
  )

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

  const householdCurrencyById = useMemo(() => {
    const map: Record<string, string> = {}
    households?.forEach((household) => {
      map[household.id] = household.currency
    })
    return map
  }, [households])

  const canCreateSubscription = canManageAnyHousehold(households, currentUser?.id)

  const householdIdsForFetch = useMemo(() => {
    if (!households?.length) return []

    if (filters.householdId === 'all') {
      return households.map((household) => household.id)
    }

    return households.some((household) => household.id === filters.householdId)
      ? [filters.householdId]
      : []
  }, [filters.householdId, households])

  const subscriptionQueries = useQueries({
    queries: householdIdsForFetch.map((householdId) => ({
      queryKey: getSubscriptionsControllerFindAllQueryKey(householdId),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        subscriptionsControllerFindAll(householdId, undefined, undefined, signal),
      enabled: Boolean(householdId),
    })),
  })

  const subscriptions = useMemo(
    () => subscriptionQueries.flatMap((query) => query.data ?? []),
    [subscriptionQueries],
  )

  const householdIdsForMeta = useMemo(
    () => [...new Set(subscriptions.map((subscription) => subscription.householdId))],
    [subscriptions],
  )

  const accountQueries = useQueries({
    queries: householdIdsForMeta.map((householdId) => ({
      queryKey: getAccountsControllerFindAllQueryKey(householdId),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        accountsControllerFindAll(householdId, undefined, signal),
      enabled: Boolean(householdId),
    })),
  })

  const categoryQueries = useQueries({
    queries: householdIdsForMeta.map((householdId) => ({
      queryKey: getCategoriesControllerFindAllQueryKey(householdId),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        categoriesControllerFindAll(householdId, undefined, signal),
      enabled: Boolean(householdId),
    })),
  })

  const accountNameById = useMemo(() => {
    const map: Record<string, string> = {}
    accountQueries.forEach((query) => {
      query.data?.forEach((account) => {
        map[account.id] = account.name
      })
    })
    return map
  }, [accountQueries])

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {}
    categoryQueries.forEach((query) => {
      query.data?.forEach((category) => {
        map[category.id] = category.name
      })
    })
    return map
  }, [categoryQueries])

  const filteredSubscriptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return subscriptions.filter((subscription) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        subscription.name.toLowerCase().includes(normalizedSearch)

      const matchesType = filters.type === 'all' || subscription.type === filters.type

      const matchesHousehold =
        filters.householdId === 'all' || subscription.householdId === filters.householdId

      const matchesActive =
        filters.active === 'all' ||
        (filters.active === 'active' ? subscription.active : !subscription.active)

      return matchesSearch && matchesType && matchesHousehold && matchesActive
    })
  }, [filters.active, filters.householdId, filters.type, search, subscriptions])

  const hasAnyHousehold = (households?.length ?? 0) > 0
  const hasAnySubscription = subscriptions.length > 0
  const hasFilteredResults = filteredSubscriptions.length > 0
  const isLoadingSubscriptions = subscriptionQueries.some((query) => query.isLoading)
  const isSubscriptionsError = subscriptionQueries.some((query) => query.isError)
  const isLoading = isLoadingHouseholds || isLoadingSubscriptions
  const isError = isHouseholdsError || isSubscriptionsError

  const openCreate = () => setCreateOpen(true)

  const canEditSubscription = (subscription: SubscriptionResponseDto) => {
    const household = findHouseholdInList(households, subscription.householdId)
    return isHouseholdAtLeastModerator(household?.members, currentUser?.id)
  }

  const deleteMutation = useSubscriptionsControllerRemove({
    mutation: {
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getSubscriptionsControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Fixo excluído com sucesso')
        setDeleteSubscription(null)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível excluir o fixo'))
      },
    },
  })

  const refetch = () => {
    void refetchHouseholds()
    subscriptionQueries.forEach((query) => {
      void query.refetch()
    })
  }

  return (
    <ObjectPageLayout>
      <SubscriptionHeader
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        households={households ?? []}
        showToolbar={hasAnyHousehold}
        createAction={
          canCreateSubscription
            ? {
                label: 'Novo fixo',
                onClick: openCreate,
              }
            : undefined
        }
      />

      <ObjectPageContent tourAnchor="subscriptions-list">
        <ObjectCollectionState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!hasAnyHousehold}
          skeleton={<SubscriptionCardGridSkeleton />}
          onRetry={refetch}
          emptyState={
            <ObjectEmptyState
              icon={Users}
              title="Nenhum grupo disponível"
              description="Crie um grupo antes de cadastrar despesas e receitas fixas."
              actions={[
                {
                  label: 'Ir para grupos',
                  onClick: () => navigate('/dashboard/grupos'),
                },
              ]}
            />
          }
        >
          {!hasAnySubscription ? (
            <ObjectEmptyState
              icon={CalendarClock}
              title="Nenhum fixo ainda"
              description={
                canCreateSubscription
                  ? 'Cadastre o primeiro fixo para automatizar despesas e receitas fixas do grupo.'
                  : 'Ainda não há fixos nos seus grupos.'
              }
              actions={
                canCreateSubscription
                  ? [
                      {
                        label: 'Criar primeiro fixo',
                        onClick: openCreate,
                      },
                    ]
                  : []
              }
            />
          ) : !hasFilteredResults ? (
            <ObjectEmptyState
              icon={SearchX}
              title="Nenhum fixo encontrado"
              description="Ajuste a busca ou os filtros para localizar o fixo desejado."
              actions={[
                {
                  label: 'Limpar busca e filtros',
                  variant: 'outline',
                  onClick: () => {
                    setSearch('')
                    setFilters(defaultFilters)
                  },
                },
                ...(canCreateSubscription
                  ? [
                      {
                        label: 'Novo fixo',
                        onClick: openCreate,
                      },
                    ]
                  : []),
              ]}
            />
          ) : (
            <div className={subscriptionCardGridClassName}>
              {filteredSubscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  householdName={householdNameById[subscription.householdId]}
                  accountName={accountNameById[subscription.accountId]}
                  categoryName={
                    subscription.categoryId
                      ? categoryNameById[subscription.categoryId]
                      : undefined
                  }
                  currency={householdCurrencyById[subscription.householdId] ?? 'BRL'}
                  onEdit={
                    canEditSubscription(subscription) ? setEditSubscription : undefined
                  }
                  onDelete={
                    canEditSubscription(subscription) ? setDeleteSubscription : undefined
                  }
                />
              ))}
            </div>
          )}
        </ObjectCollectionState>
      </ObjectPageContent>

      {hasAnyHousehold && (
        <>
          <SubscriptionCreateModal open={createOpen} onOpenChange={setCreateOpen} />

          <SubscriptionEditModal
            subscription={editSubscription}
            open={editSubscription !== null}
            onOpenChange={(open) => {
              if (!open) setEditSubscription(null)
            }}
          />

          <ObjectDeleteConfirmDialog
            open={deleteSubscription !== null}
            onOpenChange={(open) => {
              if (!open) setDeleteSubscription(null)
            }}
            title="Excluir fixo"
            description={`Tem certeza que deseja excluir "${deleteSubscription?.name}"? Esta ação não pode ser desfeita.`}
            onConfirm={() => {
              if (!deleteSubscription) return
              deleteMutation.mutate({
                householdId: deleteSubscription.householdId,
                subId: deleteSubscription.id,
              })
            }}
            isPending={deleteMutation.isPending}
          />
        </>
      )}
    </ObjectPageLayout>
  )
}
