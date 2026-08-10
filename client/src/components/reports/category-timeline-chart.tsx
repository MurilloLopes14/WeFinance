import type { CategoryTimelineResponseDto } from '@/api/generated/models/categoryTimelineResponseDto'
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrivacyMode } from '@/contexts/privacy-mode-context'
import { SENSITIVE_MASK_LABEL } from '@/components/privacy/sensitive-value'
import { useSensitiveCurrencyText } from '@/hooks/use-sensitive-currency-formatter'
import {
  buildCategoryTimelineChartModel,
  CATEGORY_TIMELINE_GRANULARITY_OPTIONS,
  getCategoryTimelineGranularityDescription,
  type CategoryTimelineGranularity,
  type CategoryTimelineScope,
} from '@/lib/reports-helpers'
import { cn } from '@/lib/utils'
import { CalendarDays, Info } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

const DEFAULT_GRANULARITY: CategoryTimelineGranularity = 'monthly'

const SCOPE_OPTIONS = [
  { value: 'personal' as const, label: 'Pessoal' },
  { value: 'household' as const, label: 'Grupo' },
]

type CategoryTimelineChartProps = {
  data: CategoryTimelineResponseDto | undefined
  currency?: string
  isLoading: boolean
  className?: string
  headerActions?: ReactNode
  scope: CategoryTimelineScope
  onScopeChange: (scope: CategoryTimelineScope) => void
  granularity: CategoryTimelineGranularity
  onGranularityChange: (granularity: CategoryTimelineGranularity) => void
}

export function CategoryTimelineChart({
  data,
  currency = 'BRL',
  isLoading,
  className,
  headerActions,
  scope,
  onScopeChange,
  granularity,
  onGranularityChange,
}: CategoryTimelineChartProps) {
  const formatCurrencyText = useSensitiveCurrencyText(currency)
  const { amountsHidden } = usePrivacyMode()

  const { series, points } = useMemo(
    () => buildCategoryTimelineChartModel(data),
    [data],
  )
  const hasData = series.length > 0 && points.length > 0

  const chartConfig = useMemo(() => {
    return series.reduce<ChartConfig>((config, item) => {
      config[item.key] = {
        label: item.name,
        color: item.color,
      }
      return config
    }, {})
  }, [series])

  return (
    <div
      className={cn(
        'glass-subtle flex h-full min-h-0 flex-col overflow-hidden rounded-xl p-4 ring-1 ring-foreground/10',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1">
            <h3 className="font-heading text-pretty text-sm font-semibold tracking-tight">
              Timeline de categorias
            </h3>
            {hasData ? (
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-lg touch-manipulation"
                    />
                  }
                >
                  <Info className="size-4" aria-hidden="true" />
                  <span className="sr-only">Abrir legenda das categorias</span>
                </PopoverTrigger>
                <PopoverContent
                  className="glass-strong w-[min(16rem,calc(100vw-2rem))]"
                  align="start"
                  sideOffset={8}
                >
                  <PopoverHeader>
                    <PopoverTitle>Legenda</PopoverTitle>
                    <PopoverDescription>
                      Cores de cada categoria no gráfico.
                    </PopoverDescription>
                  </PopoverHeader>
                  <ul className="max-h-64 space-y-2 overflow-y-auto overscroll-contain px-0.5">
                    {series.map((item) => (
                      <li key={item.key} className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-xs"
                          style={{ backgroundColor: item.color }}
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm text-foreground">
                          {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground sm:text-xs">
            {getCategoryTimelineGranularityDescription(granularity)}
          </p>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,9rem)_minmax(0,9rem)_auto] lg:items-end lg:justify-end">
          <div className="min-w-0 space-y-1.5">
            <div className="flex min-h-5 items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                Granularidade
              </p>
              {granularity !== DEFAULT_GRANULARITY ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg touch-manipulation"
                  onClick={() => onGranularityChange(DEFAULT_GRANULARITY)}
                  aria-label="Voltar ao filtro mensal padrão"
                  title="Voltar ao mensal"
                >
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
            <Select
              value={granularity}
              onValueChange={(value) => {
                const option = CATEGORY_TIMELINE_GRANULARITY_OPTIONS.find(
                  (item) => item.value === value,
                )
                if (option) onGranularityChange(option.value)
              }}
              items={CATEGORY_TIMELINE_GRANULARITY_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            >
              <SelectTrigger
                className="h-11 w-full rounded-xl touch-manipulation sm:h-9"
                aria-label="Granularidade da timeline"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                <SelectGroup>
                  {CATEGORY_TIMELINE_GRANULARITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-1.5">
            <p className="flex min-h-5 items-center text-xs font-medium text-muted-foreground">
              Escopo
            </p>
            <Select
              value={scope}
              onValueChange={(value) => {
                if (value === 'personal' || value === 'household') {
                  onScopeChange(value)
                }
              }}
              items={SCOPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            >
              <SelectTrigger
                className="h-11 w-full rounded-xl touch-manipulation sm:h-9"
                aria-label="Escopo da timeline"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                <SelectGroup>
                  {SCOPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {headerActions ? (
            <div className="min-w-0 sm:col-span-2 lg:col-span-1 lg:justify-self-end">
              {headerActions}
            </div>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 flex flex-1 flex-col gap-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-3 w-14 rounded-full" />
          </div>
        </div>
      ) : !hasData ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhuma despesa por categoria neste período para montar a timeline.
        </p>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="mt-4 aspect-auto h-56 w-full overflow-hidden sm:h-64"
        >
          <LineChart
            data={points}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              interval="preserveStartEnd"
            />
            <YAxis
              type="number"
              tickLine={false}
              axisLine={false}
              width={52}
              domain={[0, 'auto']}
              tickFormatter={(value: number) =>
                amountsHidden ? '•••' : formatCurrencyText(value)
              }
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null

                const items = [...payload]
                  .filter((item) => Number(item.value) > 0)
                  .sort((left, right) => Number(right.value) - Number(left.value))

                if (!items.length) return null

                return (
                  <div className="grid min-w-40 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                    <p className="font-medium text-foreground">{label}</p>
                    <div className="grid gap-1.5">
                      {items.map((item) => {
                        const seriesKey = String(item.dataKey ?? item.name ?? '')
                        const seriesMeta = series.find(
                          (entry) => entry.key === seriesKey,
                        )
                        const categoryName =
                          seriesMeta?.name ?? String(item.name ?? seriesKey)
                        const amount = Number(item.value)

                        return (
                          <div
                            key={seriesKey}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="size-2.5 shrink-0 rounded-xs"
                                style={{
                                  backgroundColor:
                                    seriesMeta?.color ?? item.color ?? 'var(--chart-1)',
                                }}
                                aria-hidden="true"
                              />
                              <span className="truncate text-muted-foreground">
                                {categoryName}
                              </span>
                            </div>
                            <span className="shrink-0 font-medium tabular-nums text-foreground">
                              {amountsHidden
                                ? SENSITIVE_MASK_LABEL
                                : formatCurrencyText(amount)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }}
            />
            {series.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.name}
                stroke={`var(--color-${item.key})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      )}
    </div>
  )
}
