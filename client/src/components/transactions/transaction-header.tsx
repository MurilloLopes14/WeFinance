import type { AccountResponseDto } from '@/api/generated/models/accountResponseDto'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import type { TransactionsControllerFindAllType } from '@/api/generated/models/transactionsControllerFindAllType'
import { ObjectHeader, type ObjectHeaderCreateAction } from '@/components/object/object-header'
import { TransactionExportPopover } from '@/components/transactions/transaction-export-popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getTransactionTypeLabel } from '@/lib/transaction-helpers'

export type TransactionFilters = {
  householdId: string
  month: string
  type: TransactionsControllerFindAllType | 'all'
  accountId: string | 'all'
}

type TransactionHeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: TransactionFilters
  onFiltersChange: (filters: TransactionFilters) => void
  households: HouseholdResponseDto[]
  accounts: AccountResponseDto[]
  createAction?: ObjectHeaderCreateAction
  showToolbar?: boolean
}

const transactionTypeOptions: Array<{
  value: TransactionFilters['type']
  label: string
}> = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'expense', label: getTransactionTypeLabel('expense') },
  { value: 'income', label: getTransactionTypeLabel('income') },
  { value: 'transfer', label: getTransactionTypeLabel('transfer') },
]

export function TransactionHeader({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  households,
  accounts,
  createAction,
  showToolbar = true,
}: TransactionHeaderProps) {
  const totalActiveFilters =
    (filters.month ? 1 : 0) +
    (filters.type === 'all' ? 0 : 1) +
    (filters.accountId === 'all' ? 0 : 1)

  return (
    <ObjectHeader
      title="Transações"
      description="Registre despesas, receitas e transferências. A listagem exibe as movimentações mais recentes primeiro."
      tourAnchor="transactions-header"
      toolbarTourAnchor="transactions-toolbar"
      searchValue={showToolbar ? searchValue : undefined}
      onSearchChange={showToolbar ? onSearchChange : undefined}
      searchPlaceholder="Buscar por descrição..."
      filtersTitle="Filtrar transações"
      filtersDescription="Refine por grupo, mês, tipo e conta."
      activeFiltersCount={totalActiveFilters}
      onClearFilters={() =>
        onFiltersChange({
          ...filters,
          month: '',
          type: 'all',
          accountId: 'all',
        })
      }
      headerActions={
        showToolbar && filters.householdId ? (
          <TransactionExportPopover householdId={filters.householdId} filters={filters} />
        ) : undefined
      }
      createAction={createAction}
      filtersContent={
        showToolbar ? (
          <div className="space-y-4">
            {households.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="transaction-filter-household">Grupo</Label>
                <Select
                  value={filters.householdId}
                  onValueChange={(value) => {
                    if (!value) return
                    onFiltersChange({
                      ...filters,
                      householdId: value,
                      accountId: 'all',
                    })
                  }}
                  items={households.map((household) => ({
                    value: household.id,
                    label: household.name,
                  }))}
                >
                  <SelectTrigger
                    id="transaction-filter-household"
                    className="w-full rounded-xl"
                  >
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong glow-border">
                    <SelectGroup>
                      {households.map((household) => (
                        <SelectItem key={household.id} value={household.id}>
                          {household.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="transaction-filter-month">Mês</Label>
              <Input
                id="transaction-filter-month"
                type="month"
                value={filters.month}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    month: event.target.value,
                  })
                }
                className="glass-subtle rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-filter-type">Tipo</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => {
                  if (!value) return
                  onFiltersChange({
                    ...filters,
                    type: value as TransactionFilters['type'],
                  })
                }}
                items={transactionTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              >
                <SelectTrigger id="transaction-filter-type" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong glow-border">
                  <SelectGroup>
                    {transactionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-filter-account">Conta</Label>
              <Select
                value={filters.accountId}
                onValueChange={(value) => {
                  if (!value) return
                  onFiltersChange({
                    ...filters,
                    accountId: value as TransactionFilters['accountId'],
                  })
                }}
                items={[
                  { value: 'all', label: 'Todas as contas' },
                  ...accounts.map((account) => ({
                    value: account.id,
                    label: account.name,
                  })),
                ]}
              >
                <SelectTrigger id="transaction-filter-account" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong glow-border">
                  <SelectGroup>
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : undefined
      }
    />
  )
}
