import {
  getInsightsControllerGetInsightsQueryKey,
  insightsControllerGetInsights,
} from '@/api/generated/insights/insights'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { enrichInsights, type EnrichedInsight } from '@/lib/insight-helpers'
import { getCurrentMonthParam } from '@/lib/transaction-helpers'
import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

type UseMixedHouseholdInsightsOptions = {
  households?: HouseholdResponseDto[]
  month?: string
  limit?: number
  enabled?: boolean
}

export function useMixedHouseholdInsights({
  households = [],
  month,
  limit = 8,
  enabled = true,
}: UseMixedHouseholdInsightsOptions) {
  const monthParam = month?.trim() || getCurrentMonthParam()

  const queries = useQueries({
    queries: households.map((household) => ({
      queryKey: getInsightsControllerGetInsightsQueryKey(household.id, {
        month: monthParam,
      }),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        insightsControllerGetInsights(
          household.id,
          { month: monthParam },
          undefined,
          signal,
        ),
      enabled: enabled && Boolean(household.id),
      staleTime: 60_000,
    })),
  })

  const insights = useMemo<EnrichedInsight[]>(() => {
    const responses = queries.map((query, index) => {
      if (!query.data) return undefined

      return {
        householdId: households[index]?.id ?? '',
        insights: query.data.insights,
        currency: query.data.currency,
      }
    })

    return enrichInsights(households, responses).slice(0, limit)
  }, [households, limit, queries])

  const referenceMonth = queries.find((query) => query.data)?.data?.month ?? monthParam
  const isLoading = enabled && households.length > 0 && queries.some((query) => query.isLoading)
  const isError = queries.some((query) => query.isError)

  const refetch = () => {
    queries.forEach((query) => {
      void query.refetch()
    })
  }

  return {
    insights,
    month: referenceMonth,
    isLoading,
    isError,
    refetch,
  }
}
