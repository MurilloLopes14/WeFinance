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
import { SensitiveValue } from '@/components/privacy/sensitive-value'
import { cn } from '@/lib/utils'
import { User, Users } from 'lucide-react'

export const insightCardGridClassName =
  'grid w-full auto-rows-min grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'

export const insightCardCompactGridClassName =
  'grid w-full min-w-0 auto-rows-min grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'

type InsightCardProps = {
  insight: EnrichedInsight
  showHouseholdName?: boolean
  className?: string
  size?: 'default' | 'compact'
}

export function InsightCard({
  insight,
  showHouseholdName = false,
  className,
  size = 'default',
}: InsightCardProps) {
  const isCompact = size === 'compact'
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
        'glass-subtle h-fit w-full min-w-0 gap-0 self-start',
        isCompact ? 'py-2.5' : 'py-4',
        toneStyles.cardClassName,
        className,
      )}
    >
      <div
        className={cn(
          'flex min-w-0 items-start',
          isCompact ? 'gap-2 px-2.5' : 'gap-3.5 px-4',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl',
            isCompact ? 'size-8' : 'size-11 rounded-2xl',
            toneStyles.iconClassName,
          )}
        >
          <InsightIcon className={isCompact ? 'size-3.5' : 'size-5'} />
        </div>

        <div className={cn('min-w-0 flex-1', isCompact ? 'space-y-1' : 'space-y-2')}>
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <Badge
              variant="outline"
              className={cn(
                'h-4 shrink-0 rounded-md px-1 py-0 leading-none',
                isCompact ? 'text-[9px]' : 'text-[10px]',
              )}
            >
              <ScopeIcon className={cn('mr-0.5', isCompact ? 'size-2.5' : 'size-3')} />
              {getInsightScopeLabel(insight.scope)}
            </Badge>

            {isBudgetInsight(insight) && (
              <Badge
                variant="secondary"
                className={cn(
                  'h-4 shrink-0 rounded-md px-1 py-0 leading-none',
                  isCompact ? 'text-[9px]' : 'text-[10px]',
                )}
              >
                Budget
              </Badge>
            )}

            {showHouseholdName && (
              <Badge
                variant="secondary"
                className={cn(
                  'h-4 max-w-24 shrink-0 truncate rounded-md px-1 py-0 leading-none',
                  isCompact ? 'text-[9px]' : 'text-[10px]',
                )}
              >
                {insight.householdName}
              </Badge>
            )}
          </div>

          <CardTitle
            className={cn(
              'font-medium leading-snug',
              isCompact ? 'line-clamp-1 text-xs' : 'line-clamp-2 text-sm',
            )}
          >
            {insight.title}
          </CardTitle>

          <CardDescription
            className={cn(
              'leading-relaxed',
              isCompact ? 'line-clamp-2 text-xs' : 'line-clamp-3 text-sm',
            )}
          >
            {insight.message}
          </CardDescription>

          {budgetSummary && (
            <div className="space-y-1">
              {budgetProgress != null && (
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-[width] duration-300',
                      isBudgetOverflow ? 'bg-destructive' : 'bg-primary',
                    )}
                    style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  />
                </div>
              )}
              <SensitiveValue
                className={cn('text-muted-foreground', isCompact ? 'text-[10px]' : 'text-xs')}
                size="sm"
              >
                {budgetSummary}
              </SensitiveValue>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
