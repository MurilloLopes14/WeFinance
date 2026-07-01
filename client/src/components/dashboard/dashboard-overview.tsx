import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { CategoryDonutChart } from '@/components/dashboard/category-donut-chart'
import { BalanceEvolutionChart } from '@/components/dashboard/balance-evolution-chart'
import { DayTransactionsSheet } from '@/components/dashboard/day-transactions-sheet'
import {
  DashboardPerspectiveTabs,
  type DashboardPerspective,
} from '@/components/dashboard/dashboard-perspective-tabs'
import { FinancialCalendar } from '@/components/dashboard/financial-calendar'
import { CreditAccountsPanel } from '@/components/dashboard/credit-accounts-panel'
import { MonthSelector } from '@/components/dashboard/month-selector'
import { RecentTransactionsPanel } from '@/components/dashboard/recent-transactions-panel'
import { UpcomingFixosPanel } from '@/components/dashboard/upcoming-fixos-panel'
import { InsightsSection } from '@/components/insights/insights-section'
import { PrivacyToggleButton } from '@/components/privacy/privacy-toggle-button'
import { useDashboardActivityData } from '@/hooks/use-dashboard-activity-data'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useHouseholdInsights } from '@/hooks/use-household-insights'
import type { BalanceHistoryRange } from '@/lib/dashboard-helpers'
import { formatInsightMonthLabel } from '@/lib/insight-helpers'
import { getCurrentMonthParam } from '@/lib/transaction-helpers'
import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'

type DashboardOverviewProps = {
  households: HouseholdResponseDto[]
  householdId: string
  onHouseholdChange: (householdId: string) => void
}

export function DashboardOverview({
  households,
  householdId,
  onHouseholdChange,
}: DashboardOverviewProps) {
  const [month, setMonth] = useState(getCurrentMonthParam)
  const [historyRange, setHistoryRange] = useState<BalanceHistoryRange>('current')
  const [perspective, setPerspective] = useState<DashboardPerspective>('personal')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const selectedHousehold = useMemo(
    () => households.find((household) => household.id === householdId),
    [households, householdId],
  )

  const currency = selectedHousehold?.currency ?? 'BRL'
  const hasHousehold = Boolean(householdId)

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
  } = useDashboardData(householdId, month, historyRange)

  const {
    recentTransactions,
    subscriptions,
    isLoadingTransactions,
    isLoadingSubscriptions,
    isErrorTransactions,
    isErrorSubscriptions,
    refetchTransactions,
    refetchSubscriptions,
  } = useDashboardActivityData(householdId, month)

  const {
    insights,
    month: insightsMonth,
    isLoading: isLoadingInsights,
    isError: isInsightsError,
    refetch: refetchInsights,
  } = useHouseholdInsights({
    householdId,
    householdName: selectedHousehold?.name,
    month,
    enabled: hasHousehold,
  })

  const categoryBreakdown =
    perspective === 'personal' ? personalBreakdown.data : householdBreakdown.data
  const creditAccounts = personalSummary.data?.creditAccounts ?? []
  const showCreditPanel =
    perspective === 'household' && (isLoadingDashboard || creditAccounts.length > 0)
  const dashboardSidePanelClassName = 'min-h-0 max-lg:min-h-52 lg:h-full'

  return (
    <section className="space-y-4" aria-label="Dashboard">
      <header className="space-y-4" data-tour="dashboard-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Visão geral das suas finanças com indicadores pessoais e do grupo.
            </p>
          </div>
          <PrivacyToggleButton className="sm:mt-0.5" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <MonthSelector month={month} onChange={setMonth} tourAnchor="dashboard-month" />
          <InsightsSection
            variant="mobile"
            insights={insights}
            month={insightsMonth}
            isLoading={isLoadingInsights}
            isError={isInsightsError}
            description={`Análises do grupo para ${formatInsightMonthLabel(month)}.`}
            layout="compact"
            tourAnchor="dashboard-insights"
            onRetry={() => {
              void refetchInsights()
            }}
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
        description={`Análises do grupo para ${formatInsightMonthLabel(month)}.`}
        layout="compact"
        tourAnchor="dashboard-insights"
        onRetry={() => {
          void refetchInsights()
        }}
      />

      {hasHousehold ? (
        <div className="flex flex-col gap-4">
          <DashboardPerspectiveTabs
            perspective={perspective}
            onPerspectiveChange={setPerspective}
            households={households}
            selectedHouseholdId={householdId}
            onHouseholdChange={(nextHouseholdId) => {
              onHouseholdChange(nextHouseholdId)
              setSelectedDay(null)
            }}
            personalSummary={personalSummary.data}
            householdSummary={summary.data}
            currency={currency}
            isLoading={isLoadingDashboard}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12" data-tour="dashboard-reports">
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            <div
              className={cn(
                'flex min-h-0 flex-col gap-4',
                showCreditPanel
                  ? 'lg:grid lg:h-full lg:grid-rows-3 lg:gap-4'
                  : 'lg:grid lg:h-full lg:grid-rows-2 lg:gap-4',
              )}
            >
              <RecentTransactionsPanel
                className={dashboardSidePanelClassName}
                transactions={recentTransactions}
                currency={currency}
                isLoading={isLoadingTransactions}
                isError={isErrorTransactions}
                onRetry={() => {
                  void refetchTransactions()
                }}
              />
              <UpcomingFixosPanel
                className={dashboardSidePanelClassName}
                subscriptions={subscriptions}
                currency={currency}
                isLoading={isLoadingSubscriptions}
                isError={isErrorSubscriptions}
                onRetry={() => {
                  void refetchSubscriptions()
                }}
              />
              {showCreditPanel ? (
                <CreditAccountsPanel
                  variant="compact"
                  className={dashboardSidePanelClassName}
                  accounts={isLoadingDashboard ? [] : creditAccounts}
                  currency={currency}
                  isLoading={isLoadingDashboard}
                />
              ) : null}
            </div>

            <FinancialCalendar
              data={dailySummary.data}
              month={month}
              isLoading={isLoadingDashboard}
              onDayClick={setSelectedDay}
              className="min-h-0 lg:h-full"
            />
          </div>

          <DayTransactionsSheet
            date={selectedDay}
            householdId={householdId}
            currency={currency}
            onClose={() => setSelectedDay(null)}
          />
        </div>
      ) : (
        <div className="glass-subtle rounded-xl px-4 py-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
          Crie ou entre em um grupo para visualizar a visão geral.
        </div>
      )}
    </section>
  )
}
