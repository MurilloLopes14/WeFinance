import {
  transactionsControllerGetBalanceHistory,
  transactionsControllerGetDailySummary,
  useTransactionsControllerGetCategoryTimeline,
  useTransactionsControllerGetSplitFairness,
  useTransactionsControllerGetTopPayees,
} from '@/api/generated/transactions/transactions'
import { defaultQueryOptions } from '@/api/default-query-options'
import type {
  CategoryTimelineGranularity,
  CategoryTimelineScope,
  ReportsChartMonths,
} from '@/lib/reports-helpers'
import { resolveCategoryTimelineQuery } from '@/lib/reports-helpers'
import {
  getBalanceHistoryChartMonth,
  isDailyBalanceHistoryRange,
  resolveBalanceHistoryQuery,
  type BalanceHistoryRange,
} from '@/lib/dashboard-helpers'
import { useQuery } from '@tanstack/react-query'

function useMonthReportQuery<T>(
  queryKey: readonly unknown[],
  queryFn: (signal?: AbortSignal) => Promise<T>,
  enabled: boolean,
) {
  return useQuery({
    ...defaultQueryOptions({
      queryFn: ({ signal }) => queryFn(signal),
      enabled,
    }),
    queryKey,
  })
}

export function useReportsData(
  householdId: string,
  months: ReportsChartMonths,
  historyRange: BalanceHistoryRange = 'current',
  categoryTimelineScope: CategoryTimelineScope = 'household',
  categoryTimelineGranularity: CategoryTimelineGranularity = 'monthly',
) {
  const enabled = Boolean(householdId)
  const isDailyChart = isDailyBalanceHistoryRange(historyRange)
  const balanceChartMonth = getBalanceHistoryChartMonth(months.balance, historyRange)
  const balanceHistoryParams = resolveBalanceHistoryQuery(months.balance, historyRange)
  const categoryTimelineParams = resolveCategoryTimelineQuery(
    months.categoryTimeline,
    categoryTimelineScope,
    categoryTimelineGranularity,
  )

  const splitFairness = useTransactionsControllerGetSplitFairness(
    householdId,
    { month: months.splitFairness },
    {
      query: {
        enabled,
      },
    },
  )

  const topPayees = useTransactionsControllerGetTopPayees(
    householdId,
    {
      month: months.topPayees,
      scope: 'household',
      limit: 10,
    },
    {
      query: {
        enabled,
      },
    },
  )

  const categoryTimeline = useTransactionsControllerGetCategoryTimeline(
    householdId,
    categoryTimelineParams,
    {
      query: {
        enabled,
      },
    },
  )

  const calendarDailySummary = useMonthReportQuery(
    ['reports', 'daily-summary', householdId, months.calendar] as const,
    (signal) =>
      transactionsControllerGetDailySummary(
        householdId,
        { params: { month: months.calendar } },
        signal,
      ),
    enabled,
  )

  const balanceDailySummary = useMonthReportQuery(
    ['reports', 'daily-summary', householdId, balanceChartMonth] as const,
    (signal) =>
      transactionsControllerGetDailySummary(
        householdId,
        { params: { month: balanceChartMonth } },
        signal,
      ),
    enabled && isDailyChart,
  )

  const balanceHistory = useMonthReportQuery(
    [
      'reports',
      'balance-history',
      householdId,
      balanceHistoryParams.endMonth,
      historyRange,
    ] as const,
    (signal) =>
      transactionsControllerGetBalanceHistory(
        householdId,
        balanceHistoryParams,
        undefined,
        signal,
      ),
    enabled && !isDailyChart,
  )

  const isBalanceChartLoading = isDailyChart
    ? balanceDailySummary.isLoading
    : balanceHistory.isLoading

  const isLoading =
    splitFairness.isLoading ||
    topPayees.isLoading ||
    calendarDailySummary.isLoading ||
    isBalanceChartLoading ||
    categoryTimeline.isLoading

  const isError =
    splitFairness.isError ||
    topPayees.isError ||
    calendarDailySummary.isError ||
    balanceHistory.isError ||
    categoryTimeline.isError ||
    (isDailyChart && balanceDailySummary.isError)

  return {
    splitFairness,
    topPayees,
    dailySummary: calendarDailySummary,
    balanceHistory,
    balanceChartDailyData: isDailyChart ? balanceDailySummary : null,
    balanceChartMonth,
    categoryTimeline,
    isBalanceChartLoading,
    isLoading,
    isError,
    refetchAll: async () => {
      await Promise.all([
        splitFairness.refetch(),
        topPayees.refetch(),
        calendarDailySummary.refetch(),
        balanceHistory.refetch(),
        isDailyChart ? balanceDailySummary.refetch() : Promise.resolve(),
        categoryTimeline.refetch(),
      ])
    },
  }
}
