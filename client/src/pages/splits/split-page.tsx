import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
import {
  useHouseholdsControllerFindAll,
} from '@/api/generated/households/households'
import { useTransactionsControllerFindAll } from '@/api/generated/transactions/transactions'
import { ObjectCollectionState } from '@/components/object/object-collection-state'
import { ObjectEmptyState } from '@/components/object/object-empty-state'
import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import { SplitHeader, type SplitFilters } from '@/components/splits/split-header'
import { SplitTableSkeleton } from '@/components/splits/split-table-skeleton'
import { SplitsDataTable } from '@/components/splits/splits-data-table'
import { householdsListParams } from '@/lib/household-api-helpers'
import {
  buildMemberNameByUserId,
  filterSplitTableRows,
  flattenTransactionsToSplitRows,
  transactionHasSharedSplit,
} from '@/lib/split-table-helpers'
import { TRANSACTIONS_PAGE_SIZE } from '@/lib/transaction-api-helpers'
import { ArrowLeftRight, PieChart, SearchX, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function createDefaultFilters(householdId: string): SplitFilters {
  return {
    householdId,
    month: '',
  }
}

export function SplitPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const {
    data: households,
    isLoading: isLoadingHouseholds,
    isError: isHouseholdsError,
    refetch: refetchHouseholds,
  } = useHouseholdsControllerFindAll(householdsListParams)

  const [filters, setFilters] = useState<SplitFilters>(() => createDefaultFilters(''))

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
  }, [filters.householdId, filters.month, search])

  const listParams = useMemo(
    () => ({
      month: filters.month || undefined,
      order: 'desc' as const,
      page,
      limit: TRANSACTIONS_PAGE_SIZE,
    }),
    [filters.month, page],
  )

  const {
    data: transactionsPage,
    isLoading: isLoadingTransactions,
    isError: isTransactionsError,
    refetch: refetchTransactions,
  } = useTransactionsControllerFindAll(selectedHouseholdId, listParams, {
    query: { enabled: Boolean(selectedHouseholdId) },
  })

  const { data: categories } = useCategoriesControllerFindAll(selectedHouseholdId, {
    query: { enabled: Boolean(selectedHouseholdId) },
  })

  const selectedHousehold = useMemo(
    () => households?.find((household) => household.id === selectedHouseholdId),
    [households, selectedHouseholdId],
  )

  const transactionsOnPage = transactionsPage?.data ?? []

  const memberNameByUserId = useMemo(
    () =>
      buildMemberNameByUserId(
        transactionsOnPage,
        Object.fromEntries(
          (selectedHousehold?.members ?? []).map((member) => [
            member.userId,
            member.user.name,
          ]),
        ),
      ),
    [selectedHousehold?.members, transactionsOnPage],
  )

  const categoryNameById = useMemo(
    () =>
      Object.fromEntries((categories ?? []).map((category) => [category.id, category.name])),
    [categories],
  )

  const transactionsWithSplitsOnPage = useMemo(
    () => transactionsOnPage.filter(transactionHasSharedSplit),
    [transactionsOnPage],
  )

  const splitRows = useMemo(
    () => flattenTransactionsToSplitRows(transactionsOnPage, memberNameByUserId),
    [transactionsOnPage, memberNameByUserId],
  )

  const filteredSplitRows = useMemo(
    () => filterSplitTableRows(splitRows, search),
    [splitRows, search],
  )

  const hasAnyTransaction = (transactionsPage?.total ?? 0) > 0
  const hasAnySharedSplitOnPage = transactionsWithSplitsOnPage.length > 0
  const hasFilteredResults = filteredSplitRows.length > 0
  const isLoading = isLoadingHouseholds || isLoadingTransactions
  const isError = isHouseholdsError || isTransactionsError

  const refetch = () => {
    void refetchHouseholds()
    void refetchTransactions()
  }

  return (
    <ObjectPageLayout>
      <SplitHeader
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
        households={households ?? []}
        showToolbar={hasAnyHousehold}
      />

      <ObjectPageContent tourAnchor="splits-list">
        <ObjectCollectionState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!hasAnyHousehold}
          skeleton={<SplitTableSkeleton />}
          onRetry={refetch}
          emptyState={
            <ObjectEmptyState
              icon={Users}
              title="Nenhum grupo disponível"
              description="Crie um grupo para visualizar como as despesas são divididas entre os membros."
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
              title="Nenhuma transação neste grupo"
              description="Registre movimentações com rateio entre membros para acompanhar a divisão aqui."
              actions={[
                {
                  label: 'Ir para transações',
                  onClick: () => navigate('/dashboard/transacoes'),
                },
              ]}
            />
          ) : !hasAnySharedSplitOnPage ? (
            <ObjectEmptyState
              icon={PieChart}
              title="Nenhum rateio nesta página"
              description="As transações desta página não têm divisão entre membros. Avance a página ou registre despesas com rateio em Transações."
              actions={[
                {
                  label: 'Ir para transações',
                  onClick: () => navigate('/dashboard/transacoes'),
                },
                ...(page < (transactionsPage?.totalPages ?? 1)
                  ? [
                      {
                        label: 'Próxima página',
                        variant: 'outline' as const,
                        onClick: () => setPage((current) => current + 1),
                      },
                    ]
                  : []),
              ]}
            />
          ) : !hasFilteredResults ? (
            <ObjectEmptyState
              icon={SearchX}
              title="Nenhum rateio encontrado"
              description="Ajuste a busca ou os filtros para localizar a transação ou membro desejado."
              actions={[
                {
                  label: 'Limpar busca',
                  variant: 'outline',
                  onClick: () => setSearch(''),
                },
              ]}
            />
          ) : (
            <SplitsDataTable
              rows={filteredSplitRows}
              meta={{
                categoryNameById,
                currency: selectedHousehold?.currency ?? 'BRL',
              }}
              page={transactionsPage?.page ?? page}
              totalPages={transactionsPage?.totalPages ?? 1}
              transactionsOnPage={transactionsOnPage.length}
              transactionsWithSplitsOnPage={transactionsWithSplitsOnPage.length}
              onPageChange={setPage}
            />
          )}
        </ObjectCollectionState>
      </ObjectPageContent>
    </ObjectPageLayout>
  )
}
