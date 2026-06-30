import {
  InsightCard,
  insightCardCompactGridClassName,
  insightCardGridClassName,
} from '@/components/insights/insight-card'
import { InsightsGridSkeleton } from '@/components/insights/insights-grid-skeleton'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { EnrichedInsight } from '@/lib/insight-helpers'
import { formatInsightMonthLabel } from '@/lib/insight-helpers'
import { cn } from '@/lib/utils'
import { Info, Lightbulb, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'

type InsightsSectionProps = {
  insights: EnrichedInsight[]
  month?: string
  isLoading?: boolean
  isError?: boolean
  showHouseholdName?: boolean
  title?: string
  description?: string
  className?: string
  onRetry?: () => void
  variant?: 'all' | 'mobile' | 'desktop'
  layout?: 'grid' | 'compact'
  tourAnchor?: string
}

export function InsightsSection({
  insights,
  month,
  isLoading = false,
  isError = false,
  showHouseholdName = false,
  title = 'Insights',
  description,
  className,
  onRetry,
  variant = 'all',
  layout = 'grid',
  tourAnchor,
}: InsightsSectionProps) {
  const monthLabel = month ? formatInsightMonthLabel(month) : undefined
  const resolvedDescription =
    description ??
    (monthLabel
      ? `Análises de ${monthLabel}, combinando visões pessoais e do grupo.`
      : 'Análises automáticas das suas finanças, combinando visões pessoais e do grupo.')

  if (!isLoading && !isError && insights.length === 0) {
    return null
  }

  const panelProps = {
    insights,
    title,
    description: resolvedDescription,
    showHouseholdName,
    isLoading,
    isError,
    onRetry,
    className,
    tourAnchor,
    layout,
  }

  return (
    <>
      {(variant === 'all' || variant === 'mobile') && <InsightsMobilePanel {...panelProps} />}
      {(variant === 'all' || variant === 'desktop') && <InsightsDesktopPanel {...panelProps} />}
    </>
  )
}

type InsightsPanelContentProps = {
  insights: EnrichedInsight[]
  title: string
  description: string
  showHouseholdName?: boolean
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  className?: string
  tourAnchor?: string
  layout?: 'grid' | 'compact'
}

function InsightsDesktopPanel({
  insights,
  title,
  description,
  showHouseholdName = false,
  isLoading = false,
  isError = false,
  className,
  onRetry,
  tourAnchor,
  layout = 'grid',
}: InsightsPanelContentProps) {
  const [expandedOpen, setExpandedOpen] = useState(false)

  if (isLoading) {
    return (
      <section
        className={cn('hidden min-w-0 space-y-2 md:block', className)}
        {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}
      >
        <InsightsSectionHeader
          title={title}
          description={description}
          compact={layout === 'compact'}
        />
        <InsightsGridSkeleton layout={layout} count={layout === 'compact' ? 6 : 3} />
      </section>
    )
  }

  if (isError) {
    return (
      <section
        className={cn('hidden space-y-3 md:block', className)}
        {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}
      >
        <InsightsSectionHeader title={title} description={description} />
        <InsightsErrorState onRetry={onRetry} />
      </section>
    )
  }

  if (layout === 'compact') {
    const maxInlineInsights = 8
    const inlineInsights = insights.slice(0, maxInlineInsights)
    const hasOverflow = insights.length > maxInlineInsights

    return (
      <section
        className={cn('hidden min-w-0 md:block', className)}
        {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <InsightsSectionHeader title={title} description={description} compact />
          {hasOverflow && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl"
              onClick={() => setExpandedOpen(true)}
            >
              Ver todos ({insights.length})
            </Button>
          )}
        </div>

        <div className={insightCardCompactGridClassName}>
          {inlineInsights.map((insight) => (
            <InsightCard
              key={`${insight.householdId}-${insight.id}`}
              insight={insight}
              showHouseholdName={showHouseholdName}
              size="compact"
            />
          ))}
        </div>

        <Sheet open={expandedOpen} onOpenChange={setExpandedOpen}>
          <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
            <SheetHeader className="border-b border-foreground/10 pb-4">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 p-4">
              <InsightsCardsGrid
                insights={insights}
                showHouseholdName={showHouseholdName}
                layout="stack"
              />
            </div>
          </SheetContent>
        </Sheet>
      </section>
    )
  }

  return (
    <section
      className={cn('hidden space-y-3 md:block', className)}
      {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}
    >
      <InsightsSectionHeader title={title} description={description} />
      <InsightsCardsGrid insights={insights} showHouseholdName={showHouseholdName} />
    </section>
  )
}

function InsightsMobilePanel({
  insights,
  title,
  description,
  showHouseholdName = false,
  isLoading = false,
  isError = false,
  className,
  onRetry,
  tourAnchor,
}: InsightsPanelContentProps) {
  const [open, setOpen] = useState(false)

  if (isLoading) {
    return (
      <div
        className={cn('flex shrink-0 md:hidden', className)}
        {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 rounded-xl"
          disabled
          aria-label="Carregando insights"
        >
          <Loader2 className="size-4 animate-spin" />
        </Button>
      </div>
    )
  }

  const insightCount = insights.length
  const ariaLabel = isError
    ? 'Ver erro ao carregar insights'
    : insightCount === 1
      ? 'Ver 1 insight'
      : `Ver ${insightCount} insights`

  return (
    <div
      className={cn('flex shrink-0 md:hidden', className)}
      {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="relative size-10 rounded-xl"
              aria-label={ariaLabel}
            />
          }
        >
          <Info className="size-4" />
          {!isError && insightCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {insightCount > 9 ? '9+' : insightCount}
            </span>
          )}
        </SheetTrigger>

        <SheetContent side="bottom" className="max-h-[85vh] gap-0 overflow-y-auto">
          <SheetHeader className="border-b border-foreground/10 pb-4">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 p-4">
            {isError ? (
              <InsightsErrorState onRetry={onRetry} />
            ) : (
              <InsightsCardsGrid
                insights={insights}
                showHouseholdName={showHouseholdName}
                layout="stack"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function InsightsCardsGrid({
  insights,
  showHouseholdName = false,
  layout = 'grid',
}: {
  insights: EnrichedInsight[]
  showHouseholdName?: boolean
  layout?: 'grid' | 'stack'
}) {
  return (
    <div className={layout === 'grid' ? insightCardGridClassName : 'flex flex-col gap-3'}>
      {insights.map((insight) => (
        <InsightCard
          key={`${insight.householdId}-${insight.id}`}
          insight={insight}
          showHouseholdName={showHouseholdName}
        />
      ))}
    </div>
  )
}

function InsightsErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="glass-subtle flex flex-col items-start gap-3 rounded-xl px-4 py-4 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar os insights neste momento.
      </p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

function InsightsSectionHeader({
  title,
  description,
  compact = false,
}: {
  title: string
  description: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Lightbulb className="size-3.5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Lightbulb className="size-4" />
      </div>
      <div className="min-w-0 space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
