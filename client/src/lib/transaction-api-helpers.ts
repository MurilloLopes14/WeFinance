import type { TransactionsControllerFindAllParams } from '@/api/generated/models/transactionsControllerFindAllParams'
import type { TransactionFilters } from '@/components/transactions/transaction-header'

export const TRANSACTIONS_PAGE_SIZE = 20

export function buildTransactionListParams(
  filters: TransactionFilters,
  page: number,
): TransactionsControllerFindAllParams {
  return {
    month: filters.month || undefined,
    type: filters.type === 'all' ? undefined : filters.type,
    accountId: filters.accountId === 'all' ? undefined : filters.accountId,
    order: 'desc',
    page,
    limit: TRANSACTIONS_PAGE_SIZE,
  }
}
