import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import { DashboardPanel } from '@/components/dashboard/dashboard-panel'
import { TransactionOwnerAvatar } from '@/components/transactions/transaction-owner-avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatTransactionAmount,
  formatTransactionDate,
  getTransactionAmountClassName,
  getTransactionTypeLabel,
} from '@/lib/transaction-helpers'
import { SensitiveValue } from '@/components/privacy/sensitive-value'
import { cn } from '@/lib/utils'
import { ArrowLeftRight, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type RecentTransactionsPanelProps = {
  transactions: TransactionResponseDto[]
  currency?: string
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  className?: string
}

export function RecentTransactionsPanel({
  transactions,
  currency = 'BRL',
  isLoading,
  isError,
  onRetry,
  className,
}: RecentTransactionsPanelProps) {
  return (
    <DashboardPanel
      title="Últimas transações"
      description="Movimentações mais recentes do grupo neste mês."
      className={className}
      action={
        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 rounded-lg px-2 text-xs"
          render={<Link to="/dashboard/transacoes" />}
        >
          Ver todas
          <ArrowRight className="size-3.5" />
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar as transações.
          </p>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onRetry}>
              Tentar novamente
            </Button>
          )}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <ArrowLeftRight className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma transação neste mês.</p>
        </div>
      ) : (
        <ul className="divide-y divide-foreground/8">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="flex min-w-0 items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <TransactionOwnerAvatar owner={transaction.owner} size="default" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">                  {transaction.description?.trim() || getTransactionTypeLabel(transaction.type)}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {formatTransactionDate(transaction.date)} · {getTransactionTypeLabel(transaction.type)}
                </p>
              </div>
              <SensitiveValue
                size="md"
                className={cn(
                  'shrink-0 text-sm font-semibold tabular-nums',
                  getTransactionAmountClassName(transaction.type),
                )}
              >
                {formatTransactionAmount(transaction.amount, transaction.type, currency)}
              </SensitiveValue>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  )
}
