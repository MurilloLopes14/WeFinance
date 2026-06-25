import type { InsightDtoScope } from '@/api/generated/models/insightDtoScope'
import type { InsightDtoTone } from '@/api/generated/models/insightDtoTone'
import type { InsightDto } from '@/api/generated/models/insightDto'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { formatAccountBalance } from '@/lib/account-helpers'
import {
  AlertTriangle,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export const BUDGET_INSIGHT_RULE = 'budget_overview'

export type EnrichedInsight = InsightDto & {
  householdId: string
  householdName: string
  currency: string
}

export function isBudgetInsight(insight: Pick<InsightDto, 'rule'>): boolean {
  return insight.rule === BUDGET_INSIGHT_RULE
}

export function shuffleInsights<T>(items: T[]): T[] {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

export function getInsightScopeLabel(scope: InsightDtoScope): string {
  return scope === 'personal' ? 'Pessoal' : 'Grupo'
}

export function formatInsightMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)

  if (!year || !monthNumber) return month

  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthNumber - 1, 1))
}

export function getInsightToneIcon(tone: InsightDtoTone): LucideIcon {
  switch (tone) {
    case 'success':
      return TrendingUp
    case 'warning':
      return AlertTriangle
    case 'info':
      return Lightbulb
    default:
      return Sparkles
  }
}

export function getInsightIcon(insight: Pick<InsightDto, 'rule' | 'tone'>): LucideIcon {
  if (isBudgetInsight(insight)) return Wallet
  return getInsightToneIcon(insight.tone)
}

export function formatBudgetInsightSummary(insight: EnrichedInsight): string | null {
  const { metadata } = insight

  if (metadata.budgetUsed == null || metadata.amount == null) return null

  const used = formatAccountBalance(metadata.budgetUsed, insight.currency)
  const total = formatAccountBalance(metadata.amount, insight.currency)

  if (metadata.budgetPercent != null) {
    return `${used} de ${total} (${metadata.budgetPercent}%)`
  }

  return `${used} de ${total}`
}

export function getBudgetInsightProgress(insight: EnrichedInsight): number | null {
  if (!isBudgetInsight(insight) || insight.metadata.budgetPercent == null) return null
  return Math.max(0, insight.metadata.budgetPercent)
}

export function getInsightToneStyles(tone: InsightDtoTone): {
  iconClassName: string
  cardClassName: string
} {
  switch (tone) {
    case 'success':
      return {
        iconClassName: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        cardClassName: 'insight-card-glow-success',
      }
    case 'warning':
      return {
        iconClassName: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
        cardClassName: 'insight-card-glow-warning',
      }
    case 'info':
      return {
        iconClassName: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
        cardClassName: 'insight-card-glow-info',
      }
    default:
      return {
        iconClassName: 'bg-primary/15 text-primary',
        cardClassName: 'insight-card-glow-neutral',
      }
  }
}

export function enrichInsights(
  households: HouseholdResponseDto[],
  responses: Array<{ householdId: string; insights: InsightDto[]; currency: string } | undefined>,
): EnrichedInsight[] {
  const householdById = Object.fromEntries(households.map((household) => [household.id, household]))

  const enriched = responses
    .flatMap((response) => {
      if (!response) return []

      const household = householdById[response.householdId]
      if (!household) return []

      return response.insights.map((insight) => ({
        ...insight,
        householdId: household.id,
        householdName: household.name,
        currency: response.currency,
      }))
    })

  return shuffleInsights(enriched)
}
