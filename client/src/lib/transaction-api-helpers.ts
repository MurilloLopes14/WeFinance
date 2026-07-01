import type { TransactionsControllerFindAllParams } from '@/api/generated/models/transactionsControllerFindAllParams'
import type { TransactionFilters } from '@/components/transactions/transaction-header'
import type { QueryClient } from '@tanstack/react-query'
import { getSubscriptionsControllerFindAllQueryKey } from '@/api/generated/subscriptions/subscriptions'
import { getTransactionsControllerFindAllQueryKey } from '@/api/generated/transactions/transactions'

export const TRANSACTIONS_PAGE_SIZE = 20

function getHouseholdAccountsQueryPrefix(householdId: string) {
  return `/api/v1/households/${householdId}/accounts`
}

/** Invalida listagens, saldos de contas e agregados do dashboard após mutações de transação. */
export async function invalidateTransactionDependentQueries(
  queryClient: QueryClient,
  householdId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: getTransactionsControllerFindAllQueryKey(householdId),
    }),
    queryClient.invalidateQueries({
      queryKey: getSubscriptionsControllerFindAllQueryKey(householdId),
    }),
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        typeof query.queryKey[0] === 'string' &&
        query.queryKey[0].startsWith(getHouseholdAccountsQueryPrefix(householdId)),
    }),
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey[0] === 'dashboard' &&
        query.queryKey.includes(householdId),
    }),
  ])
}

export function buildTransactionListParams(
  filters: TransactionFilters,
  page: number,
  currentUserId?: string,
): TransactionsControllerFindAllParams {
  return {
    month: filters.month || undefined,
    type: filters.type === 'all' ? undefined : filters.type,
    accountId: filters.accountId === 'all' ? undefined : filters.accountId,
    ownerId:
      filters.onlyMine && currentUserId ? currentUserId : undefined,
    order: 'desc',
    page,
    limit: TRANSACTIONS_PAGE_SIZE,
  }
}
