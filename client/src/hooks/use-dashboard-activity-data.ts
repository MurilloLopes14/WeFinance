import { useSubscriptionsControllerFindAll } from '@/api/generated/subscriptions/subscriptions'
import { useTransactionsControllerFindAll } from '@/api/generated/transactions/transactions'

const RECENT_TRANSACTIONS_LIMIT = 6

export function useDashboardActivityData(householdId: string, month: string) {
  const enabled = Boolean(householdId)

  const {
    data: transactionsPage,
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
    refetch: refetchTransactions,
  } = useTransactionsControllerFindAll(
    householdId,
    {
      month,
      order: 'desc',
      page: 1,
      limit: RECENT_TRANSACTIONS_LIMIT,
    },
    { query: { enabled } },
  )

  const {
    data: subscriptions,
    isLoading: isLoadingSubscriptions,
    isError: isErrorSubscriptions,
    refetch: refetchSubscriptions,
  } = useSubscriptionsControllerFindAll(householdId, {
    query: { enabled },
  })

  return {
    recentTransactions: transactionsPage?.data ?? [],
    subscriptions: subscriptions ?? [],
    isLoadingTransactions,
    isLoadingSubscriptions,
    isErrorTransactions,
    isErrorSubscriptions,
    refetchTransactions,
    refetchSubscriptions,
  }
}
