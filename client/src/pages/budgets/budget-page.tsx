import { fetchBudgetsMonth, getBudgetsMonthQueryKey, useBudgetsMonth } from '@/api/budgets-api'
import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import { CategoryResponseDtoKind } from '@/api/generated/models/categoryResponseDtoKind'
import { BudgetCopyPopover } from '@/components/budgets/budget-copy-popover'
import { BudgetCategoryCardGridSkeleton } from '@/components/budgets/budget-category-card-grid-skeleton'
import { BudgetGroupCardGridSkeleton } from '@/components/budgets/budget-group-card-grid-skeleton'
import { BudgetHeader } from '@/components/budgets/budget-header'
import {
  CategoryBudgetCard,
  categoryBudgetCardGridClassName,
} from '@/components/budgets/category-budget-card'
import {
  GroupBudgetCard,
  groupBudgetCardGridClassName,
} from '@/components/budgets/group-budget-card'
import { MonthSelector } from '@/components/dashboard/month-selector'
import { DashboardHouseholdSelector } from '@/components/dashboard/dashboard-household-selector'
import { ObjectCollectionState } from '@/components/object/object-collection-state'
import { ObjectEmptyState } from '@/components/object/object-empty-state'
import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthSession } from '@/hooks/use-auth-session'
import { householdsListParams } from '@/lib/household-api-helpers'
import { findHouseholdInList } from '@/lib/household-helpers'
import { formatBudgetMonthLabel } from '@/lib/budget-page-helpers'
import { getCurrentMonthParam } from '@/lib/transaction-helpers'
import { Tags, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

type BudgetTab = 'group' | 'categories'

export function BudgetPage() {
  const navigate = useNavigate()
  const { data: currentUser } = useAuthSession()
  const [month, setMonth] = useState(getCurrentMonthParam)
  const [activeTab, setActiveTab] = useState<BudgetTab>('group')
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('')

  const {
    data: households,
    isLoading: isLoadingHouseholds,
    isError: isHouseholdsError,
    refetch: refetchHouseholds,
  } = useHouseholdsControllerFindAll(householdsListParams)

  useEffect(() => {
    if (!households?.length) {
      setSelectedHouseholdId('')
      return
    }

    setSelectedHouseholdId((current) => {
      if (current && households.some((household) => household.id === current)) {
        return current
      }
      return households[0].id
    })
  }, [households])

  const selectedHousehold = findHouseholdInList(households, selectedHouseholdId)

  const {
    data: categoryBudgetsData,
    isLoading: isLoadingCategoryBudgets,
    isError: isCategoryBudgetsError,
    refetch: refetchCategoryBudgets,
  } = useBudgetsMonth(selectedHouseholdId, month, {
    enabled: activeTab === 'categories' && Boolean(selectedHouseholdId),
  })

  const {
    data: expenseCategories,
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useCategoriesControllerFindAll(selectedHouseholdId, {
    query: {
      enabled: activeTab === 'categories' && Boolean(selectedHouseholdId),
    },
  })

  const groupBudgetQueries = useQueries({
    queries: (households ?? []).map((household) => ({
      queryKey: getBudgetsMonthQueryKey(household.id, month),
      queryFn: () => fetchBudgetsMonth(household.id, month),
      enabled: activeTab === 'group' && Boolean(household.id),
      select: (data: Awaited<ReturnType<typeof fetchBudgetsMonth>>) =>
        data.group?.amount ?? null,
    })),
  })

  const groupBudgetAmounts = useMemo(() => {
    const amounts: Record<string, number | null> = {}
    ;(households ?? []).forEach((household, index) => {
      amounts[household.id] = groupBudgetQueries[index]?.data ?? null
    })
    return amounts
  }, [households, groupBudgetQueries])

  const isGroupBudgetsLoading = groupBudgetQueries.some((query) => query.isLoading)
  const isGroupBudgetsError = groupBudgetQueries.some((query) => query.isError)

  const refetchGroupBudgets = () =>
    Promise.all(groupBudgetQueries.map((query) => query.refetch()))

  const filteredExpenseCategories = useMemo(
    () =>
      (expenseCategories ?? []).filter(
        (category) => category.kind === CategoryResponseDtoKind.expense,
      ),
    [expenseCategories],
  )

  const categoryBudgetMap = useMemo(() => {
    return new Map(
      (categoryBudgetsData?.categories ?? []).map((budget) => [
        budget.categoryId,
        budget.amount,
      ]),
    )
  }, [categoryBudgetsData])

  const isLoadingGroupTab =
    isLoadingHouseholds || (activeTab === 'group' && isGroupBudgetsLoading)

  const isLoadingCategoriesTab =
    isLoadingHouseholds ||
    isLoadingCategories ||
    isLoadingCategoryBudgets

  const hasHouseholds = (households?.length ?? 0) > 0
  const hasExpenseCategories = filteredExpenseCategories.length > 0

  const groupEmptyState = (
    <ObjectEmptyState
      icon={UsersRound}
      title="Nenhum grupo cadastrado"
      description="Crie um grupo para definir o orçamento mensal compartilhado e organizar as finanças do household."
      actions={[
        {
          label: 'Ir para Grupos',
          onClick: () => navigate('/dashboard/grupos'),
        },
      ]}
    />
  )

  const categoriesEmptyState = !hasHouseholds ? (
    <ObjectEmptyState
      icon={UsersRound}
      title="Nenhum grupo cadastrado"
      description="Antes de definir orçamentos por categoria, crie ou entre em um grupo."
      actions={[
        {
          label: 'Ir para Grupos',
          onClick: () => navigate('/dashboard/grupos'),
        },
      ]}
    />
  ) : (
    <ObjectEmptyState
      icon={Tags}
      title="Nenhuma categoria de despesa"
      description={`Cadastre categorias de despesa em ${selectedHousehold?.name ?? 'seu grupo'} para planejar quanto pode gastar em cada área.`}
      actions={[
        {
          label: 'Ir para Categorias',
          onClick: () => navigate('/dashboard/categorias'),
        },
      ]}
    />
  )

  return (
    <ObjectPageLayout>
      <BudgetHeader />

      <ObjectPageContent>
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <MonthSelector month={month} onChange={setMonth} tourAnchor="budgets-month" />
            <p className="text-center text-xs text-muted-foreground sm:text-right">
              Editando orçamentos de {formatBudgetMonthLabel(month)}
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              if (value === 'group' || value === 'categories') {
                setActiveTab(value)
              }
            }}
            className="flex min-h-0 flex-1 flex-col gap-4"
            data-tour="budgets-view"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="group">
                  <UsersRound />
                  Grupo
                </TabsTrigger>
                <TabsTrigger value="categories">
                  <Tags />
                  Categorias
                </TabsTrigger>
              </TabsList>

              <BudgetCopyPopover
                households={households ?? []}
                selectedHouseholdId={selectedHouseholdId}
                onHouseholdChange={setSelectedHouseholdId}
                month={month}
                currentUserId={currentUser?.id}
              />
            </div>

            <TabsContent value="group" className="min-h-0 flex-1 space-y-4">
              <ObjectCollectionState
                isLoading={isLoadingGroupTab}
                isError={isHouseholdsError || isGroupBudgetsError}
                isEmpty={!hasHouseholds}
                skeleton={<BudgetGroupCardGridSkeleton />}
                onRetry={() => {
                  void refetchHouseholds()
                  void refetchGroupBudgets()
                }}
                emptyState={groupEmptyState}
              >
                <div className={groupBudgetCardGridClassName}>
                  {(households ?? []).map((household) => (
                    <GroupBudgetCard
                      key={household.id}
                      household={household}
                      month={month}
                      amount={groupBudgetAmounts[household.id]}
                      currentUserId={currentUser?.id}
                    />
                  ))}
                </div>
              </ObjectCollectionState>
            </TabsContent>

            <TabsContent value="categories" className="min-h-0 flex-1 space-y-4">
              {hasHouseholds && (
                <DashboardHouseholdSelector
                  households={households ?? []}
                  value={selectedHouseholdId}
                  onChange={setSelectedHouseholdId}
                  className="sm:max-w-sm"
                />
              )}

              <ObjectCollectionState
                isLoading={isLoadingCategoriesTab}
                isError={
                  isHouseholdsError ||
                  isCategoriesError ||
                  isCategoryBudgetsError
                }
                isEmpty={!hasHouseholds || !hasExpenseCategories}
                skeleton={<BudgetCategoryCardGridSkeleton />}
                onRetry={() => {
                  void refetchHouseholds()
                  void refetchCategories()
                  void refetchCategoryBudgets()
                }}
                emptyState={categoriesEmptyState}
              >
                <div className={categoryBudgetCardGridClassName}>
                  {filteredExpenseCategories.map((category) => (
                    <CategoryBudgetCard
                      key={category.id}
                      category={category}
                      household={selectedHousehold}
                      month={month}
                      amount={categoryBudgetMap.get(category.id) ?? null}
                      currentUserId={currentUser?.id}
                    />
                  ))}
                </div>
              </ObjectCollectionState>
            </TabsContent>
          </Tabs>
        </div>
      </ObjectPageContent>
    </ObjectPageLayout>
  )
}
