import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'

import { CategoryDonutChart } from '@/components/dashboard/category-donut-chart'

import { BalanceEvolutionChart } from '@/components/dashboard/balance-evolution-chart'

import { DayTransactionsSheet } from '@/components/dashboard/day-transactions-sheet'

import {

  DashboardPerspectiveTabs,

  type DashboardPerspective,

} from '@/components/dashboard/dashboard-perspective-tabs'

import { FinancialCalendar } from '@/components/dashboard/financial-calendar'

import { MonthSelector } from '@/components/dashboard/month-selector'

import { RecentTransactionsPanel } from '@/components/dashboard/recent-transactions-panel'

import { UpcomingFixosPanel } from '@/components/dashboard/upcoming-fixos-panel'

import { InsightsSection } from '@/components/insights/insights-section'

import { ObjectPageLayout } from '@/components/object/object-page-layout'

import { useDashboardActivityData } from '@/hooks/use-dashboard-activity-data'

import { useDashboardData } from '@/hooks/use-dashboard-data'

import { useMixedHouseholdInsights } from '@/hooks/use-mixed-household-insights'

import { householdsListParams } from '@/lib/household-api-helpers'

import type { BalanceHistoryRange } from '@/lib/dashboard-helpers'

import { getCurrentMonthParam } from '@/lib/transaction-helpers'

import { useEffect, useMemo, useState } from 'react'



export function DashboardHomePage() {

  const [month, setMonth] = useState(getCurrentMonthParam)

  const [historyRange, setHistoryRange] = useState<BalanceHistoryRange>('current')

  const [perspective, setPerspective] = useState<DashboardPerspective>('personal')

  const [selectedHouseholdId, setSelectedHouseholdId] = useState('')

  const [selectedDay, setSelectedDay] = useState<string | null>(null)



  const { data: households } = useHouseholdsControllerFindAll(householdsListParams)



  useEffect(() => {

    if (!households?.length) return



    setSelectedHouseholdId((current) => {

      if (households.some((household) => household.id === current)) {

        return current

      }

      return households[0].id

    })

  }, [households])



  const selectedHousehold = useMemo(

    () => households?.find((household) => household.id === selectedHouseholdId),

    [households, selectedHouseholdId],

  )



  const currency = selectedHousehold?.currency ?? 'BRL'

  const hasHousehold = Boolean(selectedHouseholdId)



  const {

    personalSummary,

    summary,

    personalBreakdown,

    householdBreakdown,

    dailySummary,

    balanceHistory,

    balanceChartDailyData,

    balanceChartMonth,

    isBalanceChartLoading,

    isLoading: isLoadingDashboard,

  } = useDashboardData(selectedHouseholdId, month, historyRange)



  const {

    recentTransactions,

    subscriptions,

    isLoadingTransactions,

    isLoadingSubscriptions,

    isErrorTransactions,

    isErrorSubscriptions,

    refetchTransactions,

    refetchSubscriptions,

  } = useDashboardActivityData(selectedHouseholdId, month)



  const {

    insights,

    month: insightsMonth,

    isLoading: isLoadingInsights,

    isError: isInsightsError,

    refetch: refetchInsights,

  } = useMixedHouseholdInsights({

    households: households ?? [],

    month,

    enabled: (households?.length ?? 0) > 0,

  })



  const categoryBreakdown =

    perspective === 'personal' ? personalBreakdown.data : householdBreakdown.data



  return (

    <ObjectPageLayout>

      <header className="space-y-4" data-tour="dashboard-header">

        <div className="space-y-1.5">

          <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">

            Visão geral das suas finanças com indicadores pessoais e do grupo.

          </p>

        </div>



        <div className="flex items-center justify-between gap-3">

          <MonthSelector month={month} onChange={setMonth} tourAnchor="dashboard-month" />

          <InsightsSection

            variant="mobile"

            insights={insights}

            month={insightsMonth}

            isLoading={isLoadingInsights}

            isError={isInsightsError}

            showHouseholdName={(households?.length ?? 0) > 1}

            onRetry={refetchInsights}

            className="shrink-0"

          />

        </div>

      </header>

      <InsightsSection
        variant="desktop"
        insights={insights}
        month={insightsMonth}
        isLoading={isLoadingInsights}
        isError={isInsightsError}
        showHouseholdName={(households?.length ?? 0) > 1}
        onRetry={refetchInsights}
      />

      {hasHousehold ? (

        <div className="flex flex-col gap-4">

          <DashboardPerspectiveTabs

            perspective={perspective}

            onPerspectiveChange={setPerspective}

            households={households ?? []}

            selectedHouseholdId={selectedHouseholdId}

            onHouseholdChange={(householdId) => {

              setSelectedHouseholdId(householdId)

              setSelectedDay(null)

            }}

            personalSummary={personalSummary.data}

            householdSummary={summary.data}

            currency={currency}

            isLoading={isLoadingDashboard}

          />



          <div className="order-2 grid grid-cols-1 gap-4 lg:order-3 lg:grid-cols-2">

            <RecentTransactionsPanel

              transactions={recentTransactions}

              currency={currency}

              isLoading={isLoadingTransactions}

              isError={isErrorTransactions}

              onRetry={() => {

                void refetchTransactions()

              }}

            />

            <UpcomingFixosPanel

              subscriptions={subscriptions}

              currency={currency}

              isLoading={isLoadingSubscriptions}

              isError={isErrorSubscriptions}

              onRetry={() => {

                void refetchSubscriptions()

              }}

            />

          </div>



          <div className="order-3 flex flex-col gap-4 lg:order-2" data-tour="dashboard-reports">

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            <BalanceEvolutionChart

              className="lg:col-span-7"

              monthlyData={balanceHistory.data}

              dailyData={balanceChartDailyData?.data}

              dailyMonth={balanceChartMonth}

              historyRange={historyRange}

              onHistoryRangeChange={setHistoryRange}

              currency={currency}

              isLoading={isBalanceChartLoading}

            />

            <CategoryDonutChart

              className="lg:col-span-5"

              title="Despesas por categoria"

              data={categoryBreakdown}

              currency={currency}

              isLoading={isLoadingDashboard}

            />

            </div>



            <FinancialCalendar

              data={dailySummary.data}

              month={month}

              isLoading={isLoadingDashboard}

              onDayClick={setSelectedDay}

            />

          </div>



          <DayTransactionsSheet

            date={selectedDay}

            householdId={selectedHouseholdId}

            currency={currency}

            onClose={() => setSelectedDay(null)}

          />

        </div>

      ) : (

        <div className="glass-subtle rounded-xl px-4 py-6 text-sm text-muted-foreground ring-1 ring-foreground/10">

          Crie ou entre em um grupo para visualizar o dashboard.

        </div>

      )}

    </ObjectPageLayout>

  )

}


