import type { SplitFairnessResponseDto } from '@/api/generated/models/splitFairnessResponseDto'
import { ReportChartShell } from '@/components/reports/report-chart-shell'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrivacyMode } from '@/contexts/privacy-mode-context'
import { SENSITIVE_MASK_LABEL } from '@/components/privacy/sensitive-value'
import { useSensitiveCurrencyText } from '@/hooks/use-sensitive-currency-formatter'
import {
  buildSplitFairnessChartPoints,
  getSplitFairnessSummary,
} from '@/lib/reports-helpers'
import { useMemo, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

type SplitFairnessChartProps = {
  data: SplitFairnessResponseDto | undefined
  currency?: string
  isLoading: boolean
  className?: string
  headerActions?: ReactNode
}

const chartConfig = {
  expectedAmount: {
    label: 'Deveria pagar',
    color: 'var(--chart-2)',
  },
  actualPaid: {
    label: 'Pagou',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export function SplitFairnessChart({
  data,
  currency = 'BRL',
  isLoading,
  className,
  headerActions,
}: SplitFairnessChartProps) {
  const formatCurrencyText = useSensitiveCurrencyText(currency)
  const { amountsHidden } = usePrivacyMode()
  const points = useMemo(
    () => buildSplitFairnessChartPoints(data?.members),
    [data?.members],
  )
  const summary = getSplitFairnessSummary(data)
  const hasData = points.length > 0 && summary.totalExpenses > 0
  const totalActualPaid = useMemo(
    () => points.reduce((acc, point) => acc + point.actualPaid, 0),
    [points],
  )
  const missingPaidAttribution = hasData && totalActualPaid <= 0

  return (
    <ReportChartShell
      className={className}
      title="Comparativo de pagamentos"
      description={
        <>
          <p>O que cada membro pagou versus o que deveria pagar no período.</p>
          {hasData ? (
            <p className="tabular-nums">
              Total despesas:{' '}
              <span className="font-medium text-foreground">
                {amountsHidden
                  ? SENSITIVE_MASK_LABEL
                  : formatCurrencyText(summary.totalExpenses)}
              </span>
            </p>
          ) : null}
        </>
      }
      headerActions={headerActions}
      contentClassName="flex flex-col"
    >
      {isLoading ? (
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : !hasData ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma despesa do grupo neste período para comparar.
        </p>
      ) : (
        <>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-56 w-full overflow-hidden sm:h-64"
          >
            <BarChart
              data={points}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="18%"
              barGap={4}
              accessibilityLayer
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="memberName"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="number"
                tickLine={false}
                axisLine={false}
                width={56}
                domain={[0, 'auto']}
                tickFormatter={(value: number) =>
                  amountsHidden ? '•••' : formatCurrencyText(value)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      amountsHidden
                        ? SENSITIVE_MASK_LABEL
                        : formatCurrencyText(Number(value))
                    }
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="expectedAmount"
                name="Deveria pagar"
                fill="var(--color-expectedAmount)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                isAnimationActive={false}
              />
              <Bar
                dataKey="actualPaid"
                name="Pagou"
                fill="var(--color-actualPaid)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>

          {missingPaidAttribution ? (
            <p className="mt-3 text-xs text-muted-foreground">
              As despesas do período não foram atribuídas a nenhum membro. Vincule um titular
              às contas ou confira se as despesas têm criador no grupo.
            </p>
          ) : null}

          {summary.settlementCount > 0 || summary.unsplitCount > 0 ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {summary.settlementCount > 0 ? (
                <span>
                  {summary.settlementCount}{' '}
                  {summary.settlementCount === 1
                    ? 'acerto sugerido'
                    : 'acertos sugeridos'}
                </span>
              ) : null}
              {summary.unsplitCount > 0 ? (
                <span>
                  {summary.unsplitCount}{' '}
                  {summary.unsplitCount === 1
                    ? 'despesa sem rateio'
                    : 'despesas sem rateio'}
                </span>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </ReportChartShell>
  )
}
