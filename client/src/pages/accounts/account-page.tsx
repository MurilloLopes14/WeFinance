import {
  accountsControllerFindAll,
  getAccountsControllerFindAllQueryKey,
  useAccountsControllerRemove,
} from '@/api/generated/accounts/accounts'
import type { AccountResponseDto } from '@/api/generated/models/accountResponseDto'
import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import {
  AccountCard,
  accountCardGridClassName,
} from '@/components/accounts/account-card'
import { AccountCardGridSkeleton } from '@/components/accounts/account-card-grid-skeleton'
import {
  AccountHeader,
  type AccountFilters,
} from '@/components/accounts/account-header'
import { ObjectDeleteConfirmDialog } from '@/components/object/object-delete-confirm-dialog'
import { ObjectCollectionState } from '@/components/object/object-collection-state'
import { ObjectEmptyState } from '@/components/object/object-empty-state'
import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import { useAuthSession } from '@/hooks/use-auth-session'
import { householdsListParams } from '@/lib/household-api-helpers'
import {
  findHouseholdInList,
  getHouseholdNameMap,
  isHouseholdOwner,
  isOwnerOfAnyHousehold,
} from '@/lib/household-helpers'
import { AccountCreateModal } from '@/pages/accounts/modals/account-create-modal'
import { AccountEditModal } from '@/pages/accounts/modals/account-edit-modal'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { Landmark, SearchX, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const defaultFilters: AccountFilters = {
  householdId: 'all',
  type: 'all',
}

export function AccountPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<AccountFilters>(defaultFilters)
  const [createOpen, setCreateOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<AccountResponseDto | null>(null)
  const [deleteAccount, setDeleteAccount] = useState<AccountResponseDto | null>(null)

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

  const householdCurrencyById = useMemo(
    () =>
      Object.fromEntries(
        (households ?? []).map((household) => [household.id, household.currency]),
      ),
    [households],
  )

  const canCreateAccount = isOwnerOfAnyHousehold(households, currentUser?.id)

  const householdIdsForFetch = useMemo(() => {
    if (!households?.length) return []

    if (filters.householdId === 'all') {
      return households.map((household) => household.id)
    }

    return households.some((household) => household.id === filters.householdId)
      ? [filters.householdId]
      : []
  }, [filters.householdId, households])

  const accountQueries = useQueries({
    queries: householdIdsForFetch.map((householdId) => ({
      queryKey: getAccountsControllerFindAllQueryKey(householdId),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        accountsControllerFindAll(householdId, undefined, signal),
      enabled: Boolean(householdId),
    })),
  })

  const accounts = useMemo(
    () => accountQueries.flatMap((query) => query.data ?? []),
    [accountQueries],
  )

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return accounts.filter((account) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        account.name.toLowerCase().includes(normalizedSearch) ||
        (account.institution?.toLowerCase().includes(normalizedSearch) ?? false) ||
        (account.user?.name.toLowerCase().includes(normalizedSearch) ?? false) ||
        (account.user?.email.toLowerCase().includes(normalizedSearch) ?? false)

      const matchesType = filters.type === 'all' || account.type === filters.type

      const matchesHousehold =
        filters.householdId === 'all' || account.householdId === filters.householdId

      return matchesSearch && matchesType && matchesHousehold
    })
  }, [accounts, filters.householdId, filters.type, search])

  const hasAnyHousehold = (households?.length ?? 0) > 0
  const hasAnyAccount = accounts.length > 0
  const hasFilteredResults = filteredAccounts.length > 0
  const isLoadingAccounts = accountQueries.some((query) => query.isLoading)
  const isAccountsError = accountQueries.some((query) => query.isError)
  const isLoading = isLoadingHouseholds || isLoadingAccounts
  const isError = isHouseholdsError || isAccountsError

  const openCreate = () => setCreateOpen(true)

  const canEditAccount = (account: AccountResponseDto) => {
    const household = findHouseholdInList(households, account.householdId)
    return isHouseholdOwner(household?.members, currentUser?.id)
  }

  const deleteMutation = useAccountsControllerRemove({
    mutation: {
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getAccountsControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Conta excluída com sucesso')
        setDeleteAccount(null)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível excluir a conta'))
      },
    },
  })

  const refetch = () => {
    void refetchHouseholds()
    accountQueries.forEach((query) => {
      void query.refetch()
    })
  }

  return (
    <ObjectPageLayout>
      <AccountHeader
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        households={households ?? []}
        showToolbar={hasAnyHousehold}
        createAction={
          canCreateAccount
            ? {
                label: 'Nova conta',
                onClick: openCreate,
              }
            : undefined
        }
      />

      <ObjectPageContent tourAnchor="accounts-list">
        <ObjectCollectionState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!hasAnyHousehold}
          skeleton={<AccountCardGridSkeleton />}
          onRetry={refetch}
          emptyState={
            <ObjectEmptyState
              icon={Users}
              title="Nenhum grupo disponível"
              description="Crie um grupo antes de cadastrar contas financeiras."
              actions={[
                {
                  label: 'Ir para grupos',
                  onClick: () => navigate('/dashboard/grupos'),
                },
              ]}
            />
          }
        >
          {!hasAnyAccount ? (
            <ObjectEmptyState
              icon={Landmark}
              title="Nenhuma conta ainda"
              description={
                canCreateAccount
                  ? 'Crie a primeira conta escolhendo o grupo no formulário de cadastro.'
                  : 'Ainda não há contas nos seus grupos.'
              }
              actions={
                canCreateAccount
                  ? [
                      {
                        label: 'Criar primeira conta',
                        onClick: openCreate,
                      },
                    ]
                  : []
              }
            />
          ) : !hasFilteredResults ? (
            <ObjectEmptyState
              icon={SearchX}
              title="Nenhuma conta encontrada"
              description="Ajuste a busca ou os filtros para localizar a conta desejada."
              actions={[
                {
                  label: 'Limpar busca e filtros',
                  variant: 'outline',
                  onClick: () => {
                    setSearch('')
                    setFilters(defaultFilters)
                  },
                },
                ...(canCreateAccount
                  ? [
                      {
                        label: 'Nova conta',
                        onClick: openCreate,
                      },
                    ]
                  : []),
              ]}
            />
          ) : (
            <div className={accountCardGridClassName}>
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  householdName={householdNameById[account.householdId]}
                  householdCurrencyById={householdCurrencyById}
                  onEdit={canEditAccount(account) ? setEditAccount : undefined}
                  onDelete={canEditAccount(account) ? setDeleteAccount : undefined}
                />
              ))}
            </div>
          )}
        </ObjectCollectionState>
      </ObjectPageContent>

      {hasAnyHousehold && (
        <>
          <AccountCreateModal open={createOpen} onOpenChange={setCreateOpen} />

          <AccountEditModal
            account={editAccount}
            open={editAccount !== null}
            onOpenChange={(open) => {
              if (!open) setEditAccount(null)
            }}
          />

          <ObjectDeleteConfirmDialog
            open={deleteAccount !== null}
            onOpenChange={(open) => {
              if (!open) setDeleteAccount(null)
            }}
            title="Excluir conta"
            description={`Tem certeza que deseja excluir "${deleteAccount?.name}"? Esta ação não pode ser desfeita.`}
            onConfirm={() => {
              if (!deleteAccount) return
              deleteMutation.mutate({
                householdId: deleteAccount.householdId,
                accountId: deleteAccount.id,
              })
            }}
            isPending={deleteMutation.isPending}
          />
        </>
      )}
    </ObjectPageLayout>
  )
}
