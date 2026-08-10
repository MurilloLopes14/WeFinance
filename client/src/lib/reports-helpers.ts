import type { CategoryTimelineResponseDto } from '@/api/generated/models/categoryTimelineResponseDto'
import type { CategoryTimelineSeriesDto } from '@/api/generated/models/categoryTimelineSeriesDto'
import type { MemberFairnessDto } from '@/api/generated/models/memberFairnessDto'
import type { SplitFairnessResponseDto } from '@/api/generated/models/splitFairnessResponseDto'
import {
  addMonthsToParam,
  CHART_FALLBACK_COLORS,
  formatDashboardMonthLabel,
} from '@/lib/dashboard-helpers'
import { monthParamToDateRange } from '@/lib/transaction-export-helpers'

export type ReportsFilters = {
  householdId: string
  month: string
}

export type ReportChartId =
  | 'splitFairness'
  | 'topPayees'
  | 'categoryTimeline'
  | 'calendar'

export type ReportChartMonthOverrides = Partial<Record<ReportChartId, string>>

/** Balance always follows the global month; period range is its own control. */
export type ReportsChartMonths = {
  balance: string
} & Record<ReportChartId, string>

export type SplitFairnessChartPoint = {
  userId: string
  memberName: string
  expectedAmount: number
  actualPaid: number
  netBalance: number
}

export type CategoryTimelineChartSeries = {
  key: string
  name: string
  color: string
}

export type CategoryTimelineChartPoint = {
  periodKey: string
  label: string
} & Record<string, string | number>

export type CategoryTimelineChartModel = {
  series: CategoryTimelineChartSeries[]
  points: CategoryTimelineChartPoint[]
}

export type CategoryTimelineScope = 'household' | 'personal'

export const CATEGORY_TIMELINE_GRANULARITY_OPTIONS = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
] as const

export type CategoryTimelineGranularity =
  (typeof CATEGORY_TIMELINE_GRANULARITY_OPTIONS)[number]['value']

/** How far back from the selected month to fetch, by bucket size. */
const CATEGORY_TIMELINE_LOOKBACK_MONTHS: Record<CategoryTimelineGranularity, number> = {
  weekly: 3,
  monthly: 5,
  quarterly: 23,
  semiannual: 35,
  annual: 59,
}

export function resolveCategoryTimelineQuery(
  month: string,
  scope: CategoryTimelineScope = 'household',
  granularity: CategoryTimelineGranularity = 'monthly',
): {
  from: string
  to: string
  granularity: CategoryTimelineGranularity
  scope: CategoryTimelineScope
} {
  const end = monthParamToDateRange(month)
  const start = monthParamToDateRange(
    addMonthsToParam(month, -CATEGORY_TIMELINE_LOOKBACK_MONTHS[granularity]),
  )

  return {
    from: start.from,
    to: end.to,
    granularity,
    scope,
  }
}

function categoryTimelineSeriesKey(series: CategoryTimelineSeriesDto): string {
  // Prefix keeps CSS custom properties valid even when categoryId starts with a digit.
  return series.categoryId ? `c_${series.categoryId}` : 'c_none'
}

function formatCategoryTimelinePeriodLabel(
  periodKey: string,
  granularity: string,
): string {
  if (granularity === 'weekly') {
    const match = periodKey.match(/^(\d{4})-W(\d{2})$/)
    if (match) return `Sem ${Number(match[2])}/${match[1].slice(-2)}`
  }

  if (granularity === 'monthly' && /^\d{4}-\d{2}$/.test(periodKey)) {
    return formatDashboardMonthLabel(periodKey)
  }

  if (granularity === 'quarterly') {
    const match = periodKey.match(/^(\d{4})-Q([1-4])$/)
    if (match) return `${match[2]}º tri/${match[1].slice(-2)}`
  }

  if (granularity === 'semiannual') {
    const match = periodKey.match(/^(\d{4})-H([12])$/)
    if (match) return `${match[2]}º sem/${match[1].slice(-2)}`
  }

  if (granularity === 'annual' && /^\d{4}$/.test(periodKey)) {
    return periodKey
  }

  return periodKey
}

export function getCategoryTimelineGranularityDescription(
  granularity: CategoryTimelineGranularity,
): string {
  switch (granularity) {
    case 'weekly':
      return 'Evolução semanal das despesas por categoria nos últimos 3 meses.'
    case 'monthly':
      return 'Evolução mensal das despesas por categoria nos últimos 6 meses.'
    case 'quarterly':
      return 'Evolução trimestral das despesas por categoria nos últimos 2 anos.'
    case 'semiannual':
      return 'Evolução semestral das despesas por categoria nos últimos 3 anos.'
    case 'annual':
      return 'Evolução anual das despesas por categoria nos últimos 5 anos.'
  }
}

export function buildCategoryTimelineChartModel(
  response: CategoryTimelineResponseDto | undefined,
): CategoryTimelineChartModel {
  if (!response?.series.length) {
    return { series: [], points: [] }
  }

  const series = response.series.map((item, index) => ({
    key: categoryTimelineSeriesKey(item),
    name: item.name,
    color:
      item.color?.trim() ||
      CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length],
  }))

  const amountsBySeries = new Map(
    response.series.map((item) => [
      categoryTimelineSeriesKey(item),
      new Map(item.data.map((entry) => [entry.key, Number(entry.amount) || 0])),
    ]),
  )

  const buckets = response.series[0]?.data ?? []
  const points = buckets.map((bucket) => {
    const point: CategoryTimelineChartPoint = {
      periodKey: bucket.key,
      label: formatCategoryTimelinePeriodLabel(bucket.key, response.granularity),
    }

    for (const item of series) {
      point[item.key] = amountsBySeries.get(item.key)?.get(bucket.key) ?? 0
    }

    return point
  })

  const hasActivity = points.some((point) =>
    series.some((item) => Number(point[item.key]) > 0),
  )

  if (!hasActivity) {
    return { series: [], points: [] }
  }

  return { series, points }
}

export function createDefaultReportsFilters(householdId = ''): ReportsFilters {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return {
    householdId,
    month: `${now.getFullYear()}-${month}`,
  }
}

export function resolveReportChartMonth(
  globalMonth: string,
  override: string | undefined,
): string {
  return override ?? globalMonth
}

export function resolveReportsChartMonths(
  globalMonth: string,
  overrides: ReportChartMonthOverrides,
): ReportsChartMonths {
  return {
    balance: globalMonth,
    splitFairness: resolveReportChartMonth(globalMonth, overrides.splitFairness),
    topPayees: resolveReportChartMonth(globalMonth, overrides.topPayees),
    categoryTimeline: resolveReportChartMonth(globalMonth, overrides.categoryTimeline),
    calendar: resolveReportChartMonth(globalMonth, overrides.calendar),
  }
}

export function setReportChartMonthOverride(
  overrides: ReportChartMonthOverrides,
  chartId: ReportChartId,
  month: string,
  globalMonth: string,
): ReportChartMonthOverrides {
  if (month === globalMonth) {
    const next = { ...overrides }
    delete next[chartId]
    return next
  }

  return {
    ...overrides,
    [chartId]: month,
  }
}

export function clearReportChartMonthOverride(
  overrides: ReportChartMonthOverrides,
  chartId: ReportChartId,
): ReportChartMonthOverrides {
  if (!(chartId in overrides)) return overrides

  const next = { ...overrides }
  delete next[chartId]
  return next
}

export function countReportChartMonthOverrides(
  overrides: ReportChartMonthOverrides,
): number {
  return Object.keys(overrides).length
}

export function buildSplitFairnessChartPoints(
  members: MemberFairnessDto[] | undefined,
): SplitFairnessChartPoint[] {
  if (!members?.length) return []

  return [...members]
    .sort((left, right) => right.actualPaid - left.actualPaid)
    .map((member) => ({
      userId: member.userId,
      // Avoid Recharts reserved `name` on payload (conflicts with series name).
      memberName: member.name,
      expectedAmount: Number(member.expectedAmount) || 0,
      actualPaid: Number(member.actualPaid) || 0,
      netBalance: Number(member.netBalance) || 0,
    }))
}

export function getSplitFairnessSummary(data: SplitFairnessResponseDto | undefined): {
  totalExpenses: number
  unsplitCount: number
  settlementCount: number
} {
  return {
    totalExpenses: data?.totalHouseholdExpenses ?? 0,
    unsplitCount: data?.unsplitTransactionCount ?? 0,
    settlementCount: data?.suggestedSettlements?.length ?? 0,
  }
}
