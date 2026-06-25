import { useAccountsControllerFindAll } from '@/api/generated/accounts/accounts'
import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import { useTransactionsControllerFindAll } from '@/api/generated/transactions/transactions'
import { InsightsSection } from '@/components/insights/insights-section'
import { TransactionHeader, type TransactionFilters } from '@/components/transactions/transaction-header'
import { TransactionTableSkeleton } from '@/components/transactions/transaction-table-skeleton'
import { TransactionsDataTable } from '@/components/transactions/transactions-data-table'
import { ObjectCollectionState } from '@/components/object/object-collection-state'
import { ObjectEmptyState } from '@/components/object/object-empty-state'
import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import { useTransactionCreate } from '@/contexts/transaction-create-context'
import { useHouseholdInsights } from '@/hooks/use-household-insights'
import { householdsListParams } from '@/lib/household-api-helpers'
import { buildTransactionListParams } from '@/lib/transaction-api-helpers'
import { formatInsightMonthLabel } from '@/lib/insight-helpers'
import { getCurrentMonthParam } from '@/lib/transaction-helpers'
import { ArrowLeftRight, SearchX, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

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
  const { openCreate } = useTransactionCreate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

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
              meta={{
                accountNameById,
                categoryNameById,
                currency: selectedHousehold?.currency ?? 'BRL',
              }}
              page={transactionsPage?.page ?? page}
              totalPages={transactionsPage?.totalPages ?? 1}
              total={transactionsPage?.total ?? 0}
              onPageChange={setPage}
            />
          )}
        </ObjectCollectionState>
      </ObjectPageContent>
    </ObjectPageLayout>
  )
}
