import { useInsightsControllerGetInsights } from '@/api/generated/insights/insights'
import { shuffleInsights, type EnrichedInsight } from '@/lib/insight-helpers'
import { getCurrentMonthParam } from '@/lib/transaction-helpers'
import { useMemo } from 'react'

type UseHouseholdInsightsOptions = {
  householdId?: string
  householdName?: string
  month?: string
  enabled?: boolean
}

export function useHouseholdInsights({
  householdId,
  householdName = '',
  month,
  enabled = true,
}: UseHouseholdInsightsOptions) {
  const monthParam = month?.trim() || getCurrentMonthParam()

  const query = useInsightsControllerGetInsights(
    householdId ?? '',
    { month: monthParam },
    {
      query: {
        enabled: enabled && Boolean(householdId),
      },
    },
  )

  const insights = useMemo<EnrichedInsight[]>(() => {
    if (!query.data || !householdId) return []

    return shuffleInsights(
      query.data.insights.map((insight) => ({
        ...insight,
        householdId,
        householdName,
        currency: query.data.currency,
      })),
    )
  }, [householdId, householdName, query.data])

  return {
    insights,
    month: query.data?.month ?? monthParam,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
