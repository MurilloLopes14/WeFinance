import type { CategoryBreakdownResponseDto } from '@/api/generated/models/categoryBreakdownResponseDto'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { CHART_FALLBACK_COLORS } from '@/lib/dashboard-helpers'
import { formatAccountBalance } from '@/lib/account-helpers'
import { cn } from '@/lib/utils'
import { Cell, Pie, PieChart } from 'recharts'

type CategoryDonutChartProps = {
  data: CategoryBreakdownResponseDto | undefined
  currency?: string
  isLoading: boolean
  title: string
  className?: string
}

type ChartSlice = {
  key: string
  name: string
  value: number
  percentage: number
  fill: string
}

export function CategoryDonutChart({
  data,
  currency = 'BRL',
  isLoading,
  title,
  className,
}: CategoryDonutChartProps) {
  const slices: ChartSlice[] =
    data?.categories.map((category, index) => ({
      key: category.categoryId ?? `uncategorized-${index}`,
      name: category.categoryName,
      value: category.amount,
      percentage: category.percentage,
      fill: category.color ?? CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length],
    })) ?? []

  const chartConfig = slices.reduce<ChartConfig>((config, slice) => {
    config[slice.key] = { label: slice.name, color: slice.fill }
    return config
  }, {})

  const hasData = slices.length > 0 && (data?.totalExpenses ?? 0) > 0

  return (
    <div
      className={cn(
        'glass-subtle flex h-full min-h-0 flex-col rounded-xl p-4 ring-1 ring-foreground/10',
        className,
      )}
    >
      <h3 className="font-heading text-sm font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">Distribuição das despesas por categoria.</p>

      {isLoading ? (
        <div className="mt-4 flex flex-1 flex-col items-center gap-4">
          <Skeleton className="size-44 rounded-full" />
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      ) : !hasData ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhuma despesa registrada neste período.
        </p>
      ) : (
        <>
          <ChartContainer config={chartConfig} className="mx-auto mt-2 aspect-square max-h-[220px] w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => {
                      const slice = item.payload as ChartSlice
                      return (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span>{slice.name}</span>
                          <span className="font-mono tabular-nums">
                            {formatAccountBalance(Number(value), currency)} ({slice.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {slices.map((slice) => (
                  <Cell key={slice.key} fill={slice.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <ul className="mt-3 space-y-1.5">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.fill }}
                  />
                  <span className="truncate text-muted-foreground">{slice.name}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {slice.percentage.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
