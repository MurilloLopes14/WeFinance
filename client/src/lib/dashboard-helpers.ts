import type { BalanceHistoryResponseDto } from '@/api/generated/models/balanceHistoryResponseDto'
import { formatInsightMonthLabel } from '@/lib/insight-helpers'
import { getCurrentMonthParam } from '@/lib/transaction-helpers'

export function formatDashboardMonthLabel(month: string): string {
  const label = formatInsightMonthLabel(month)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function addMonthsToParam(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(year, monthNumber - 1 + delta, 1)
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${nextMonth}`
}

export function compareMonthParams(a: string, b: string): number {
  return a.localeCompare(b)
}

export function isMonthAfterCurrent(month: string): boolean {
  return compareMonthParams(month, getCurrentMonthParam()) > 0
}

export function getDayColorClass(balance: number | undefined): string {
  if (balance === undefined) return 'bg-muted/30'
  if (balance > 0) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  if (balance < 0) return 'bg-red-500/15 text-red-700 dark:text-red-400'
  return 'bg-muted/30'
}

export const CHART_FALLBACK_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const

export type DailyBalancePoint = {
  day: number
  date: string
  runningBalance: number
  dailyBalance: number
  hasActivity: boolean
}

export function buildDailyBalanceSeries(
  month: string,
  days: Array<{
    date: string
    balance: number
    runningBalance: number
  }>,
): DailyBalancePoint[] {
  const byDate = new Map(days.map((day) => [day.date, day]))
  const [year, monthNumber] = month.split('-').map(Number)
  const daysInMonth = new Date(year, monthNumber, 0).getDate()

  let running = 0
  const points: DailyBalancePoint[] = []

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const entry = byDate.get(date)

    if (entry) {
      running = entry.runningBalance
    }

    points.push({
      day,
      date,
      runningBalance: running,
      dailyBalance: entry?.balance ?? 0,
      hasActivity: Boolean(entry),
    })
  }

  return points
}

export function formatDashboardMonthShortLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  if (!year || !monthNumber) return month

  const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(new Date(year, monthNumber - 1, 1))
    .replace(/\.$/, '')

  return `${shortMonth}/${String(year).slice(-2)}`
}

export const BALANCE_HISTORY_RANGE_OPTIONS = [
  { value: 'current', label: 'Mês atual' },
  { value: '1', label: '1 mês' },
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: '24', label: '24 meses' },
] as const

export type BalanceHistoryRange =
  (typeof BALANCE_HISTORY_RANGE_OPTIONS)[number]['value']

/** @deprecated Use BalanceHistoryRange */
export type BalanceHistoryRangeMonths = Extract<
  BalanceHistoryRange,
  '1' | '3' | '6' | '12' | '24'
>

export function resolveBalanceHistoryQuery(
  selectedMonth: string,
  range: BalanceHistoryRange,
): { months: number; endMonth: string } {
  if (range === 'current') {
    return { months: 1, endMonth: getCurrentMonthParam() }
  }

  return { months: Number(range), endMonth: selectedMonth }
}

export function isDailyBalanceHistoryRange(range: BalanceHistoryRange): boolean {
  return range === 'current' || range === '1'
}

export function getBalanceHistoryChartMonth(
  selectedMonth: string,
  range: BalanceHistoryRange,
): string {
  return resolveBalanceHistoryQuery(selectedMonth, range).endMonth
}

export type MonthlyBalancePoint = {
  month: string
  label: string
  runningBalance: number
  netBalance: number
  hasActivity: boolean
}

export function buildMonthlyBalanceSeries(
  data: BalanceHistoryResponseDto | undefined,
): MonthlyBalancePoint[] {
  if (!data?.months?.length) return []

  return data.months.map((entry) => ({
    month: entry.month,
    label: formatDashboardMonthShortLabel(entry.month),
    runningBalance: entry.runningBalance,
    netBalance: entry.netBalance,
    hasActivity: entry.transactionCount > 0,
  }))
}

export function getUpcomingSubscriptions<T extends { active: boolean; nextRunAt: string }>(
  subscriptions: T[],
  limit = 5,
): T[] {
  return subscriptions
    .filter((subscription) => subscription.active)
    .sort((left, right) => left.nextRunAt.localeCompare(right.nextRunAt))
    .slice(0, limit)
}
