import type { BalanceHistoryResponseDto } from '@/api/generated/models/balanceHistoryResponseDto'
import type { DailySummaryResponseDto } from '@/api/generated/models/dailySummaryResponseDto'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BALANCE_HISTORY_RANGE_OPTIONS,
  buildDailyBalanceSeries,
  buildMonthlyBalanceSeries,
  formatDashboardMonthLabel,
  isDailyBalanceHistoryRange,
  type BalanceHistoryRange,
} from '@/lib/dashboard-helpers'
import { formatAccountBalance } from '@/lib/account-helpers'
import { formatTransactionDate } from '@/lib/transaction-helpers'
import { cn } from '@/lib/utils'
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'

type BalanceEvolutionChartProps = {
  monthlyData: BalanceHistoryResponseDto | undefined
  dailyData: DailySummaryResponseDto | undefined
  dailyMonth: string
  historyRange: BalanceHistoryRange
  onHistoryRangeChange: (range: BalanceHistoryRange) => void
  currency?: string
  isLoading: boolean
  className?: string
}

const chartConfig = {
  runningBalance: {
    label: 'Saldo acumulado',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export function BalanceEvolutionChart({
  monthlyData,
  dailyData,
  dailyMonth,
  historyRange,
  onHistoryRangeChange,
  currency = 'BRL',
  isLoading,
  className,
}: BalanceEvolutionChartProps) {
  const isDaily = isDailyBalanceHistoryRange(historyRange)
  const monthlyPoints = buildMonthlyBalanceSeries(monthlyData)
  const dailyPoints = buildDailyBalanceSeries(dailyMonth, dailyData?.days ?? [])
  const points = isDaily ? dailyPoints : monthlyPoints
  const hasData = points.some((point) => point.hasActivity)

  const periodLabel = isDaily
    ? formatDashboardMonthLabel(dailyMonth)
    : monthlyData?.from && monthlyData?.to
      ? `${formatDashboardMonthLabel(monthlyData.from)} — ${formatDashboardMonthLabel(monthlyData.to)}`
      : null

  return (
    <div
      className={cn(
        'glass-subtle flex h-full min-h-0 flex-col rounded-xl p-4 ring-1 ring-foreground/10',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Evolução do saldo
          </h3>
          <p className="text-xs text-muted-foreground">
            {isDaily
              ? 'Saldo acumulado dia a dia no mês (receitas − despesas do grupo).'
              : 'Saldo acumulado mês a mês no período (receitas − despesas do grupo).'}
          </p>
          {periodLabel && (
            <p className="text-xs font-medium text-muted-foreground">{periodLabel}</p>
          )}
        </div>

        <div className="shrink-0 space-y-1.5 sm:w-36">
          <p className="text-xs font-medium text-muted-foreground">Período</p>
          <Select
            value={historyRange}
            onValueChange={(value) => {
              if (!value) return
              onHistoryRangeChange(value as BalanceHistoryRange)
            }}
            items={BALANCE_HISTORY_RANGE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger className="h-9 w-full rounded-xl" aria-label="Meses do relatório">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectGroup>
                {BALANCE_HISTORY_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 min-h-[220px] w-full flex-1 rounded-xl lg:min-h-[280px]" />
      ) : !hasData ? (
        <p className="mt-6 flex flex-1 items-center text-sm text-muted-foreground">
          Sem movimentações para exibir a evolução no período.
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="mt-4 min-h-[220px] w-full flex-1 lg:min-h-[280px]">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey={isDaily ? 'day' : 'label'}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={isDaily ? 20 : 16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={72}
              tickFormatter={(value: number) =>
                formatAccountBalance(value, currency).replace(/\s/g, '\u00a0')
              }
            />
            <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const point = payload?.[0]?.payload as (typeof points)[number] | undefined
                    if (!point) return ''
                    if (isDaily && 'date' in point) {
                      return formatTransactionDate(point.date)
                    }
                    if ('month' in point) {
                      return formatDashboardMonthLabel(point.month)
                    }
                    return ''
                  }}
                  formatter={(value, _name, item) => {
                    if (isDaily && 'dailyBalance' in item.payload) {
                      const point = item.payload as (typeof dailyPoints)[number]
                      const accumulated = formatAccountBalance(Number(value), currency)
                      const daily = formatAccountBalance(point.dailyBalance, currency)
                      return `Acumulado: ${accumulated} · Dia: ${daily}`
                    }

                    const point = item.payload as (typeof monthlyPoints)[number]
                    const accumulated = formatAccountBalance(Number(value), currency)
                    const monthly = formatAccountBalance(point.netBalance, currency)
                    return `Acumulado: ${accumulated} · Mês: ${monthly}`
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="runningBalance"
              stroke="var(--color-runningBalance)"
              strokeWidth={2}
              dot={isDaily ? false : { r: 3 }}
              activeDot={{ r: isDaily ? 4 : 5 }}
            />
          </LineChart>
        </ChartContainer>
      )}
    </div>
  )
}
