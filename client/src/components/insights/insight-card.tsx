import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import type { EnrichedInsight } from '@/lib/insight-helpers'
import {
  formatBudgetInsightSummary,
  getBudgetInsightProgress,
  getInsightIcon,
  getInsightScopeLabel,
  getInsightToneStyles,
  isBudgetInsight,
} from '@/lib/insight-helpers'
import { cn } from '@/lib/utils'
import { User, Users } from 'lucide-react'

export const insightCardGridClassName =
  'grid w-full auto-rows-min grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'

type InsightCardProps = {
  insight: EnrichedInsight
  showHouseholdName?: boolean
  className?: string
}

export function InsightCard({
  insight,
  showHouseholdName = false,
  className,
}: InsightCardProps) {
  const InsightIcon = getInsightIcon(insight)
  const toneStyles = getInsightToneStyles(insight.tone)
  const ScopeIcon = insight.scope === 'personal' ? User : Users
  const budgetSummary = isBudgetInsight(insight) ? formatBudgetInsightSummary(insight) : null
  const budgetProgress = getBudgetInsightProgress(insight)
  const isBudgetOverflow = (budgetProgress ?? 0) > 100

  return (
    <Card
      size="sm"
      className={cn(
        'glass-subtle h-fit w-full gap-0 self-start py-4',
        toneStyles.cardClassName,
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3.5 px-4">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-2xl',
            toneStyles.iconClassName,
          )}
        >
          <InsightIcon className="size-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[10px] leading-none"
            >
              <ScopeIcon className="mr-1 size-3" />
              {getInsightScopeLabel(insight.scope)}
            </Badge>

            {isBudgetInsight(insight) && (
              <Badge
                variant="secondary"
                className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[10px] leading-none"
              >
                Budget
              </Badge>
            )}

            {showHouseholdName && (
              <Badge
                variant="secondary"
                className="h-5 max-w-36 shrink-0 truncate rounded-md px-1.5 py-0 text-[10px] leading-none"
              >
                {insight.householdName}
              </Badge>
            )}
          </div>

          <CardTitle className="line-clamp-2 text-sm leading-snug font-medium">
            {insight.title}
          </CardTitle>

          <CardDescription className="line-clamp-3 text-sm leading-relaxed">
            {insight.message}
          </CardDescription>

          {budgetSummary && (
            <div className="space-y-1.5">
              {budgetProgress != null && (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isBudgetOverflow ? 'bg-destructive' : 'bg-primary',
                    )}
                    style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">{budgetSummary}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
