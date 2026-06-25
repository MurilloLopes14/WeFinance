import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'

export const PAYEES_PAGE_SIZE = 20

export type PayeeHouseholdFilter = 'all' | (string & {})

export type PayeeFilters = {
  householdId: PayeeHouseholdFilter
}

export function filterPayeesForTable(
  payees: PayeeResponseDto[],
  search: string,
  filters: PayeeFilters,
): PayeeResponseDto[] {
  const normalizedSearch = search.trim().toLowerCase()

  return payees
    .filter((payee) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        payee.name.toLowerCase().includes(normalizedSearch)

      const matchesHousehold =
        filters.householdId === 'all' || payee.householdId === filters.householdId

      return matchesSearch && matchesHousehold
    })
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
}

export function paginatePayees<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
  }
}
