import { useAccountsControllerFindAll } from '@/api/generated/accounts/accounts'
import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import {
  getTransactionsControllerFindAllQueryKey,
  useTransactionsControllerFindAll,
  useTransactionsControllerRemove,
} from '@/api/generated/transactions/transactions'
import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import { InsightsSection } from '@/components/insights/insights-section'
import { ObjectDeleteConfirmDialog } from '@/components/object/object-delete-confirm-dialog'
import { TransactionHeader, type TransactionFilters } from '@/components/transactions/transaction-header'
import { TransactionTableSkeleton } from '@/components/transactions/transaction-table-skeleton'
import { TransactionsDataTable } from '@/components/transactions/transactions-data-table'
import { ObjectCollectionState } from '@/components/object/object-collection-state'
import { ObjectEmptyState } from '@/components/object/object-empty-state'
import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import { useTransactionCreate } from '@/contexts/transaction-create-context'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useHouseholdInsights } from '@/hooks/use-household-insights'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { householdsListParams } from '@/lib/household-api-helpers'
import { buildTransactionListParams } from '@/lib/transaction-api-helpers'
import { formatInsightMonthLabel } from '@/lib/insight-helpers'
import { canMutateTransaction, getCurrentMonthParam, getTransactionTypeLabel } from '@/lib/transaction-helpers'
import { TransactionEditModal } from '@/pages/transactions/modals/transaction-edit-modal'
import { ArrowLeftRight, SearchX, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

function createDefaultFilters(householdId: string): TransactionFilters {
  return {
    householdId,
    month: '',
    type: 'all',
    accountId: 'all',
  }
}

export function TransactionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { openCreate } = useTransactionCreate()
  const { data: currentUser } = useAuthSession()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editTransaction, setEditTransaction] = useState<TransactionResponseDto | null>(null)
  const [deleteTransaction, setDeleteTransaction] = useState<TransactionResponseDto | null>(null)

  const {
    data: households,
    isLoading: isLoadingHouseholds,
    isError: isHouseholdsError,
    refetch: refetchHouseholds,
  } = useHouseholdsControllerFindAll(householdsListParams)

  const [filters, setFilters] = useState<TransactionFilters>(() =>
    createDefaultFilters(''),
  )

  const hasAnyHousehold = (households?.length ?? 0) > 0
  const selectedHouseholdId = filters.householdId

  useEffect(() => {
    if (!households?.length) return

    setFilters((current) => {
      const householdStillValid = households.some(
        (household) => household.id === current.householdId,
      )

      if (householdStillValid) return current

      return createDefaultFilters(households[0].id)
    })
  }, [households])

  useEffect(() => {
    setPage(1)
  }, [filters.householdId, filters.month, filters.type, filters.accountId, search])

  useEffect(() => {
    const state = location.state as { openCreate?: boolean } | null
    if (state?.openCreate) {
      openCreate(selectedHouseholdId || undefined)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate, openCreate, selectedHouseholdId])

  const listParams = useMemo(
    () => buildTransactionListParams(filters, page),
    [filters, page],
  )

  const {
    data: transactionsPage,
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
    refetch: refetchTransactions,
  } = useTransactionsControllerFindAll(selectedHouseholdId, listParams, {
    query: { enabled: Boolean(selectedHouseholdId) },
  })

  const { data: accounts } = useAccountsControllerFindAll(selectedHouseholdId, {
    query: { enabled: Boolean(selectedHouseholdId) },
  })

  const { data: categories } = useCategoriesControllerFindAll(selectedHouseholdId, {
    query: { enabled: Boolean(selectedHouseholdId) },
  })

  const selectedHousehold = useMemo(
    () => households?.find((household) => household.id === selectedHouseholdId),
    [households, selectedHouseholdId],
  )

  const insightsMonth = filters.month || getCurrentMonthParam()

  const {
    insights,
    month: insightsReferenceMonth,
    isLoading: isLoadingInsights,
    isError: isInsightsError,
    refetch: refetchInsights,
  } = useHouseholdInsights({
    householdId: selectedHouseholdId,
    householdName: selectedHousehold?.name,
    month: insightsMonth,
    enabled: Boolean(selectedHouseholdId),
  })

  const accountNameById = useMemo(
    () => Object.fromEntries((accounts ?? []).map((account) => [account.id, account.name])),
    [accounts],
  )

  const categoryNameById = useMemo(
    () =>
      Object.fromEntries((categories ?? []).map((category) => [category.id, category.name])),
    [categories],
  )

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const rows = transactionsPage?.data ?? []

    if (normalizedSearch.length === 0) return rows

    return rows.filter((transaction) =>
      (transaction.description?.toLowerCase().includes(normalizedSearch) ?? false),
    )
  }, [search, transactionsPage?.data])

  const hasAnyTransaction = (transactionsPage?.total ?? 0) > 0
  const hasFilteredResults = filteredTransactions.length > 0
  const isLoading = isLoadingHouseholds || isLoadingTransactions
  const isError = isHouseholdsError || isTransactionsError

  const refetch = () => {
    void refetchHouseholds()
    void refetchTransactions()
    void refetchInsights()
  }

  const handleFiltersChange = (nextFilters: TransactionFilters) => {
    setFilters(nextFilters)
  }

  const canMutate = useCallback(
    (transaction: TransactionResponseDto) => canMutateTransaction(transaction, currentUser?.id),
    [currentUser?.id],
  )

  const deleteMutation = useTransactionsControllerRemove({
    mutation: {
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getTransactionsControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Transação excluída com sucesso')
        setDeleteTransaction(null)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível excluir a transação'))
      },
    },
  })

  const tableMeta = useMemo(
    () => ({
      accountNameById,
      categoryNameById,
      currency: selectedHousehold?.currency ?? 'BRL',
      canMutateTransaction: canMutate,
      onEdit: setEditTransaction,
      onDelete: setDeleteTransaction,
    }),
    [accountNameById, canMutate, categoryNameById, selectedHousehold?.currency],
  )

  const deleteTransactionLabel = deleteTransaction
    ? deleteTransaction.description?.trim() || getTransactionTypeLabel(deleteTransaction.type)
    : ''

  return (
    <ObjectPageLayout>
      <TransactionHeader
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        households={households ?? []}
        accounts={accounts ?? []}
        showToolbar={hasAnyHousehold}
        createAction={{
          label: 'Nova transação',
          onClick: () => openCreate(selectedHouseholdId),
        }}
      />

      {hasAnyHousehold && (
        <InsightsSection
          insights={insights}
          month={insightsReferenceMonth}
          isLoading={isLoadingInsights}
          isError={isInsightsError}
          description={`Análises do grupo selecionado para ${formatInsightMonthLabel(insightsMonth)}.`}
          layout="compact"
          tourAnchor="transactions-insights"
          onRetry={() => {
            void refetchInsights()
          }}
        />
      )}

      <ObjectPageContent tourAnchor="transactions-table">
        <ObjectCollectionState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!hasAnyHousehold}
          skeleton={<TransactionTableSkeleton />}
          onRetry={refetch}
          emptyState={
            <ObjectEmptyState
              icon={Users}
              title="Nenhum grupo disponível"
              description="Crie um grupo antes de registrar transações financeiras."
              actions={[
                {
                  label: 'Ir para grupos',
                  onClick: () => navigate('/dashboard/grupos'),
                },
              ]}
            />
          }
        >
          {!hasAnyTransaction ? (
            <ObjectEmptyState
              icon={ArrowLeftRight}
              title="Nenhuma transação ainda"
              description="Registre a primeira movimentação para acompanhar despesas, receitas e transferências."
              actions={[
                {
                  label: 'Nova transação',
                  onClick: () => openCreate(selectedHouseholdId),
                },
              ]}
            />
          ) : !hasFilteredResults ? (
            <ObjectEmptyState
              icon={SearchX}
              title="Nenhuma transação encontrada"
              description="Ajuste a busca ou os filtros para localizar a movimentação desejada."
              actions={[
                {
                  label: 'Limpar busca',
                  variant: 'outline',
                  onClick: () => setSearch(''),
                },
                {
                  label: 'Nova transação',
                  onClick: () => openCreate(selectedHouseholdId),
                },
              ]}
            />
          ) : (
            <TransactionsDataTable
              transactions={filteredTransactions}
              meta={tableMeta}
              page={transactionsPage?.page ?? page}
              totalPages={transactionsPage?.totalPages ?? 1}
              total={transactionsPage?.total ?? 0}
              onPageChange={setPage}
            />
          )}
        </ObjectCollectionState>
      </ObjectPageContent>

      {hasAnyHousehold && (
        <>
          <TransactionEditModal
            transaction={editTransaction}
            open={editTransaction !== null}
            onOpenChange={(open) => {
              if (!open) setEditTransaction(null)
            }}
          />

          <ObjectDeleteConfirmDialog
            open={deleteTransaction !== null}
            onOpenChange={(open) => {
              if (!open) setDeleteTransaction(null)
            }}
            title="Excluir transação"
            description={`Tem certeza que deseja excluir "${deleteTransactionLabel}"? Esta ação não pode ser desfeita.`}
            onConfirm={() => {
              if (!deleteTransaction) return
              deleteMutation.mutate({
                householdId: deleteTransaction.householdId,
                txId: deleteTransaction.id,
              })
            }}
            isPending={deleteMutation.isPending}
          />
        </>
      )}
    </ObjectPageLayout>
  )
}
