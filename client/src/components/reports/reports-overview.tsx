import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { BalanceEvolutionChart } from '@/components/dashboard/balance-evolution-chart'
import { DayTransactionsSheet } from '@/components/dashboard/day-transactions-sheet'
import { FinancialCalendar } from '@/components/dashboard/financial-calendar'
import { MonthSelector } from '@/components/dashboard/month-selector'
import { CategoryTimelineChart } from '@/components/reports/category-timeline-chart'
import { ReportMonthFilter } from '@/components/reports/report-month-filter'
import { ReportsHeader } from '@/components/reports/reports-header'
import { SplitFairnessChart } from '@/components/reports/split-fairness-chart'
import { TopPayeesPanel } from '@/components/reports/top-payees-panel'
import { ObjectPageContent } from '@/components/object/object-page-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useReportsData } from '@/hooks/use-reports-data'
import type { BalanceHistoryRange } from '@/lib/dashboard-helpers'
import {
  clearReportChartMonthOverride,
  countReportChartMonthOverrides,
  createDefaultReportsFilters,
  resolveReportsChartMonths,
  setReportChartMonthOverride,
  type CategoryTimelineGranularity,
  type CategoryTimelineScope,
  type ReportChartId,
  type ReportChartMonthOverrides,
  type ReportsFilters,
} from '@/lib/reports-helpers'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type ReportsOverviewProps = {
  households: HouseholdResponseDto[]
  initialHouseholdId?: string
}

export function ReportsOverview({
  households,
  initialHouseholdId = '',
}: ReportsOverviewProps) {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(() =>
    createDefaultReportsFilters(initialHouseholdId),
  )
  const [chartMonthOverrides, setChartMonthOverrides] =
    useState<ReportChartMonthOverrides>({})
  const [historyRange, setHistoryRange] = useState<BalanceHistoryRange>('current')
  const [categoryTimelineScope, setCategoryTimelineScope] =
    useState<CategoryTimelineScope>('household')
  const [categoryTimelineGranularity, setCategoryTimelineGranularity] =
    useState<CategoryTimelineGranularity>('monthly')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    if (!households.length) return

    setFilters((current) => {
      if (households.some((household) => household.id === current.householdId)) {
        return current
      }

      return {
        ...current,
        householdId: households[0].id,
      }
    })
  }, [households])

  const selectedHousehold = useMemo(
    () => households.find((household) => household.id === filters.householdId),
    [filters.householdId, households],
  )

  const currency = selectedHousehold?.currency ?? 'BRL'
  const hasHousehold = Boolean(filters.householdId)
  const chartMonths = useMemo(
    () => resolveReportsChartMonths(filters.month, chartMonthOverrides),
    [chartMonthOverrides, filters.month],
  )
  const independentChartCount = countReportChartMonthOverrides(chartMonthOverrides)

  const {
    splitFairness,
    topPayees,
    dailySummary,
    balanceHistory,
    balanceChartDailyData,
    balanceChartMonth,
    categoryTimeline,
    isBalanceChartLoading,
    isError,
    refetchAll,
  } = useReportsData(
    filters.householdId,
    chartMonths,
    historyRange,
    categoryTimelineScope,
    categoryTimelineGranularity,
  )

  const handleFiltersChange = (next: ReportsFilters) => {
    const monthChanged = next.month !== filters.month
    setFilters(next)
    if (monthChanged) {
      setChartMonthOverrides({})
    }
  }

  const handleGlobalMonthChange = (month: string) => {
    setFilters((current) => ({ ...current, month }))
    setChartMonthOverrides({})
  }

  const handleChartMonthChange = (chartId: ReportChartId, month: string) => {
    setChartMonthOverrides((current) =>
      setReportChartMonthOverride(current, chartId, month, filters.month),
    )
  }

  const handleFollowGlobal = (chartId: ReportChartId) => {
    setChartMonthOverrides((current) =>
      clearReportChartMonthOverride(current, chartId),
    )
  }

  const renderChartMonthFilter = (chartId: ReportChartId) => (
    <ReportMonthFilter
      month={chartMonths[chartId]}
      isOverride={Boolean(chartMonthOverrides[chartId])}
      onMonthChange={(month) => handleChartMonthChange(chartId, month)}
      onFollowGlobal={() => handleFollowGlobal(chartId)}
    />
  )

  return (
    <>
      <ReportsHeader
        households={households}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        showToolbar={households.length > 0}
      />

      <ObjectPageContent>
        {!hasHousehold ? (
          <div className="glass-subtle space-y-4 rounded-xl px-4 py-6 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">
              Crie ou entre em um grupo para visualizar os relatórios.
            </p>
            <Button
              type="button"
              className="glow-primary rounded-xl"
              onClick={() => navigate('/dashboard/grupos')}
            >
              Ir para grupos
            </Button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-col gap-4">
            <div className="glass-subtle flex flex-col gap-3 rounded-xl p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading text-pretty text-sm font-semibold tracking-tight">
                    Mês geral
                  </p>
                  {independentChartCount > 0 ? (
                    <Badge variant="secondary" className="rounded-md">
                      {independentChartCount}{' '}
                      {independentChartCount === 1
                        ? 'gráfico independente'
                        : 'gráficos independentes'}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground sm:text-xs">
                  Altera todos os gráficos. Cada um também pode usar um mês próprio.
                </p>
              </div>

              <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:items-end">
                <MonthSelector
                  month={filters.month}
                  onChange={handleGlobalMonthChange}
                />
                {independentChartCount > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-full rounded-lg px-2 text-xs touch-manipulation sm:h-8 sm:w-auto"
                    onClick={() => setChartMonthOverrides({})}
                  >
                    Sincronizar todos com o geral
                  </Button>
                ) : null}
              </div>
            </div>

            {isError ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  onClick={() => {
                    void refetchAll()
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
              <BalanceEvolutionChart
                className="min-h-0 lg:col-span-7 lg:h-full"
                monthlyData={balanceHistory.data}
                dailyData={balanceChartDailyData?.data}
                dailyMonth={balanceChartMonth}
                historyRange={historyRange}
                onHistoryRangeChange={setHistoryRange}
                currency={currency}
                isLoading={isBalanceChartLoading}
              />
              <FinancialCalendar
                className="min-h-0 lg:col-span-5 lg:h-full"
                data={dailySummary.data}
                month={chartMonths.calendar}
                isLoading={dailySummary.isLoading}
                onDayClick={setSelectedDay}
                headerActions={renderChartMonthFilter('calendar')}
                showDayBalance
                currency={currency}
              />
            </div>

            <CategoryTimelineChart
              data={categoryTimeline.data}
              currency={currency}
              isLoading={categoryTimeline.isLoading}
              headerActions={renderChartMonthFilter('categoryTimeline')}
              scope={categoryTimelineScope}
              onScopeChange={setCategoryTimelineScope}
              granularity={categoryTimelineGranularity}
              onGranularityChange={setCategoryTimelineGranularity}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
              <SplitFairnessChart
                data={splitFairness.data}
                currency={currency}
                isLoading={splitFairness.isLoading}
                headerActions={renderChartMonthFilter('splitFairness')}
              />
              <TopPayeesPanel
                data={topPayees.data}
                currency={currency}
                isLoading={topPayees.isLoading}
                headerActions={renderChartMonthFilter('topPayees')}
              />
            </div>

            <DayTransactionsSheet
              date={selectedDay}
              householdId={filters.householdId}
              currency={currency}
              onClose={() => setSelectedDay(null)}
            />
          </div>
        )}
      </ObjectPageContent>
    </>
  )
}
