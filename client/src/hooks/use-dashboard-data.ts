import {
  transactionsControllerGetBalanceHistory,
  transactionsControllerGetCategoryBreakdown,
  transactionsControllerGetDailySummary,
  transactionsControllerGetPersonalSummary,
  transactionsControllerGetSummary,
} from '@/api/generated/transactions/transactions'
import { defaultQueryOptions } from '@/api/default-query-options'
import type { BalanceHistoryRange } from '@/lib/dashboard-helpers'
import {
  getBalanceHistoryChartMonth,
  isDailyBalanceHistoryRange,
  resolveBalanceHistoryQuery,
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

export function useDashboardData(
  householdId: string,
  month: string,
  historyRange: BalanceHistoryRange = 'current',
) {
  const enabled = Boolean(householdId)
  const isDailyChart = isDailyBalanceHistoryRange(historyRange)
  const chartMonth = getBalanceHistoryChartMonth(month, historyRange)
  const balanceHistoryParams = resolveBalanceHistoryQuery(month, historyRange)
  const needsSeparateChartDaily = isDailyChart && chartMonth !== month

  const summary = useMonthReportQuery(
    ['dashboard', 'summary', householdId, month] as const,
    (signal) =>
      transactionsControllerGetSummary(householdId, { month }, undefined, signal),
    enabled,
  )

  const personalSummary = useMonthReportQuery(
    ['dashboard', 'personal-summary', householdId, month] as const,
    (signal) =>
      transactionsControllerGetPersonalSummary(householdId, { month }, undefined, signal),
    enabled,
  )

  const householdBreakdown = useMonthReportQuery(
    ['dashboard', 'category-breakdown', householdId, month, 'household'] as const,
    (signal) =>
      transactionsControllerGetCategoryBreakdown(
        householdId,
        { month, scope: 'household' },
        undefined,
        signal,
      ),
    enabled,
  )

  const personalBreakdown = useMonthReportQuery(
    ['dashboard', 'category-breakdown', householdId, month, 'personal'] as const,
    (signal) =>
      transactionsControllerGetCategoryBreakdown(
        householdId,
        { month, scope: 'personal' },
        undefined,
        signal,
      ),
    enabled,
  )

  const dailySummary = useMonthReportQuery(
    ['dashboard', 'daily-summary', householdId, month] as const,
    (signal) =>
      transactionsControllerGetDailySummary(householdId, { params: { month } }, signal),
    enabled,
  )

  const balanceChartDailySummary = useMonthReportQuery(
    ['dashboard', 'daily-summary', householdId, chartMonth] as const,
    (signal) =>
      transactionsControllerGetDailySummary(
        householdId,
        { params: { month: chartMonth } },
        signal,
      ),
    enabled && needsSeparateChartDaily,
  )

  const balanceHistory = useMonthReportQuery(
    ['dashboard', 'balance-history', householdId, balanceHistoryParams.endMonth, historyRange] as const,
    (signal) =>
      transactionsControllerGetBalanceHistory(
        householdId,
        balanceHistoryParams,
        undefined,
        signal,
      ),
    enabled && !isDailyChart,
  )

  const balanceChartDailyData = isDailyChart
    ? chartMonth === month
      ? dailySummary
      : balanceChartDailySummary
    : null

  const isBalanceChartLoading = isDailyChart
    ? chartMonth === month
      ? dailySummary.isLoading
      : balanceChartDailySummary.isLoading
    : balanceHistory.isLoading

  const queries = [
    summary,
    personalSummary,
    householdBreakdown,
    personalBreakdown,
    dailySummary,
    ...(needsSeparateChartDaily ? [balanceChartDailySummary] : []),
    ...(isDailyChart ? [] : [balanceHistory]),
  ]

  return {
    summary,
    personalSummary,
    householdBreakdown,
    personalBreakdown,
    dailySummary,
    balanceHistory,
    balanceChartDailyData,
    balanceChartMonth: chartMonth,
    isBalanceChartLoading,
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
    refetch: () => {
      queries.forEach((query) => {
        void query.refetch()
      })
    },
  }
}
