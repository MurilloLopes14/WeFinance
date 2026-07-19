import { useAccountsControllerFindAll } from '@/api/generated/accounts/accounts'
import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
import type { AccountResponseDto } from '@/api/generated/models/accountResponseDto'
import type { CategoryResponseDto } from '@/api/generated/models/categoryResponseDto'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import type { TransactionsControllerFindAllType } from '@/api/generated/models/transactionsControllerFindAllType'
import { ObjectHeader, ObjectFilterSelectContent, type ObjectHeaderCreateAction } from '@/components/object/object-header'
import { TransactionExportPopover } from '@/components/transactions/transaction-export-popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getTransactionTypeLabel } from '@/lib/transaction-helpers'
import { useMemo, useState } from 'react'

export type TransactionFilters = {
  householdId: string
  month: string
  type: TransactionsControllerFindAllType | 'all'
  accountId: string | 'all'
  categoryId: string | 'all'
  onlyMine: boolean
}

type TransactionHeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: TransactionFilters
  onFiltersChange: (filters: TransactionFilters) => void
  households: HouseholdResponseDto[]
  accounts: AccountResponseDto[]
  categories: CategoryResponseDto[]
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

function countActiveFilters(filters: TransactionFilters): number {
  return (
    (filters.month ? 1 : 0) +
    (filters.type === 'all' ? 0 : 1) +
    (filters.accountId === 'all' ? 0 : 1) +
    (filters.categoryId === 'all' ? 0 : 1) +
    (filters.onlyMine ? 1 : 0)
  )
}

function clearDialogFilters(filters: TransactionFilters): TransactionFilters {
  return {
    ...filters,
    month: '',
    type: 'all',
    accountId: 'all',
    categoryId: 'all',
    onlyMine: false,
  }
}

export function TransactionHeader({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  households,
  accounts,
  categories,
  createAction,
  showToolbar = true,
}: TransactionHeaderProps) {
  const [draftFilters, setDraftFilters] = useState(filters)
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false)

  const { data: draftAccounts = [] } = useAccountsControllerFindAll(draftFilters.householdId, {
    query: {
      enabled: filtersDialogOpen && Boolean(draftFilters.householdId),
    },
  })

  const { data: draftCategories = [] } = useCategoriesControllerFindAll(
    draftFilters.householdId,
    {
      query: {
        enabled: filtersDialogOpen && Boolean(draftFilters.householdId),
      },
    },
  )

  const accountsForDraft =
    draftFilters.householdId === filters.householdId ? accounts : draftAccounts
  const categoriesForDraft =
    draftFilters.householdId === filters.householdId ? categories : draftCategories

  const categoryOptions = useMemo(() => {
    if (draftFilters.type === 'all') return categoriesForDraft
    return categoriesForDraft.filter((category) => category.kind === draftFilters.type)
  }, [categoriesForDraft, draftFilters.type])

  const handleFiltersOpenChange = (open: boolean) => {
    setFiltersDialogOpen(open)
    if (open) {
      setDraftFilters(filters)
    }
  }

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
      filtersDescription="Refine por grupo, mês, tipo, conta e categoria."
      activeFiltersCount={countActiveFilters(filters)}
      onFiltersOpenChange={handleFiltersOpenChange}
      onApplyFilters={() => onFiltersChange(draftFilters)}
      onClearFilters={() => {
        const cleared = clearDialogFilters(filters)
        setDraftFilters(cleared)
        onFiltersChange(cleared)
      }}
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
                  value={draftFilters.householdId}
                  onValueChange={(value) => {
                    if (!value) return
                    setDraftFilters((current) => ({
                      ...current,
                      householdId: value,
                      accountId: 'all',
                      categoryId: 'all',
                    }))
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
                  <ObjectFilterSelectContent>
                    <SelectGroup>
                      {households.map((household) => (
                        <SelectItem key={household.id} value={household.id}>
                          {household.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </ObjectFilterSelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="transaction-filter-month">Mês</Label>
              <Input
                id="transaction-filter-month"
                type="month"
                value={draftFilters.month}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    month: event.target.value,
                  }))
                }
                className="glass-subtle rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-filter-type">Tipo</Label>
              <Select
                value={draftFilters.type}
                onValueChange={(value) => {
                  if (!value) return
                  setDraftFilters((current) => ({
                    ...current,
                    type: value as TransactionFilters['type'],
                    categoryId: 'all',
                  }))
                }}
                items={transactionTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              >
                <SelectTrigger id="transaction-filter-type" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <ObjectFilterSelectContent>
                  <SelectGroup>
                    {transactionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </ObjectFilterSelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-filter-account">Conta</Label>
              <Select
                value={draftFilters.accountId}
                onValueChange={(value) => {
                  if (!value) return
                  setDraftFilters((current) => ({
                    ...current,
                    accountId: value as TransactionFilters['accountId'],
                  }))
                }}
                items={[
                  { value: 'all', label: 'Todas as contas' },
                  ...accountsForDraft.map((account) => ({
                    value: account.id,
                    label: account.name,
                  })),
                ]}
              >
                <SelectTrigger id="transaction-filter-account" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <ObjectFilterSelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {accountsForDraft.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </ObjectFilterSelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-filter-category">Categoria</Label>
              <Select
                value={draftFilters.categoryId}
                onValueChange={(value) => {
                  if (!value) return
                  setDraftFilters((current) => ({
                    ...current,
                    categoryId: value as TransactionFilters['categoryId'],
                  }))
                }}
                items={[
                  { value: 'all', label: 'Todas as categorias' },
                  ...categoryOptions.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]}
              >
                <SelectTrigger id="transaction-filter-category" className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <ObjectFilterSelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </ObjectFilterSelectContent>
              </Select>
            </div>
          </div>
        ) : undefined
      }
    />
  )
}
