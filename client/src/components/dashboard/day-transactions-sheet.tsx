import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
import { useTransactionsControllerFindAll } from '@/api/generated/transactions/transactions'
import { TransactionOwnerAvatar } from '@/components/transactions/transaction-owner-avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatAccountBalance } from '@/lib/account-helpers'
import {
  formatTransactionAmount,
  formatTransactionDate,
  getTransactionAmountClassName,
  getTransactionTypeLabel,
} from '@/lib/transaction-helpers'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

type DayTransactionsSheetProps = {
  date: string | null
  householdId: string
  currency?: string
  onClose: () => void
}

export function DayTransactionsSheet({
  date,
  householdId,
  currency = 'BRL',
  onClose,
}: DayTransactionsSheetProps) {
  const month = date?.slice(0, 7) ?? ''

  const { data: transactionsPage, isLoading: isLoadingTransactions } =
    useTransactionsControllerFindAll(
      householdId,
      { month, limit: 100, order: 'desc' },
      {
        query: {
          enabled: Boolean(date && householdId),
        },
      },
    )

  const { data: categories, isLoading: isLoadingCategories } =
    useCategoriesControllerFindAll(householdId, {
      query: {
        enabled: Boolean(date && householdId),
      },
    })

  const categoryNameById = useMemo(() => {
    const map: Record<string, string> = {}
    categories?.forEach((category) => {
      map[category.id] = category.name
    })
    return map
  }, [categories])

  const dayTransactions = useMemo(() => {
    if (!date) return []
    return (transactionsPage?.data ?? []).filter((transaction) => transaction.date === date)
  }, [date, transactionsPage?.data])

  const isLoading = isLoadingTransactions || isLoadingCategories
  const open = date !== null

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Transações do dia</SheetTitle>
          <SheetDescription>
            {date ? formatTransactionDate(date) : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3 overflow-y-auto pr-1">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </>
          ) : dayTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma transação neste dia.
            </p>
          ) : (
            dayTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="glass-subtle rounded-xl px-3 py-3 ring-1 ring-foreground/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <TransactionOwnerAvatar owner={transaction.owner} size="default" />
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">
                        {transaction.description?.trim() || 'Sem descrição'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-md">
                          {getTransactionTypeLabel(transaction.type)}
                        </Badge>
                        {transaction.categoryId && (
                          <span className="text-xs text-muted-foreground">
                            {categoryNameById[transaction.categoryId] ?? 'Categoria'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 font-medium tabular-nums',
                      getTransactionAmountClassName(transaction.type),
                    )}
                  >
                    {formatTransactionAmount(transaction.amount, transaction.type, currency)}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        {!isLoading && dayTransactions.length > 0 && (
          <div className="mt-4 border-t border-border/60 pt-3 text-sm text-muted-foreground">
            Total líquido:{' '}
            <span className="font-medium text-foreground">
              {formatAccountBalance(
                dayTransactions.reduce((sum, transaction) => {
                  if (transaction.type === 'income') return sum + transaction.amount
                  if (transaction.type === 'expense') return sum - transaction.amount
                  return sum
                }, 0),
                currency,
              )}
            </span>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
