import { customInstance } from '@/api/axios-instance'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'

export type UpsertBudgetDto = {
  month: string
  amount: number
}

export type GroupBudgetDto = {
  id: string
  householdId: string
  month: string
  amount: number
  createdAt: string
  updatedAt: string
}

export type CategoryBudgetDto = {
  id: string
  householdId: string
  categoryId: string
  categoryName: string | null
  month: string
  amount: number
  createdAt: string
  updatedAt: string
}

export type BudgetsMonthDto = {
  month: string
  group: GroupBudgetDto | null
  categories: CategoryBudgetDto[]
}

const budgetsBase = (householdId: string) =>
  `/api/v1/households/${householdId}/budgets`

export function getBudgetsMonthQueryKey(householdId: string, month: string) {
  return ['budgets', householdId, month] as const
}

export async function fetchBudgetsMonth(
  householdId: string,
  month: string,
): Promise<BudgetsMonthDto> {
  return customInstance<BudgetsMonthDto>({
    url: budgetsBase(householdId),
    method: 'GET',
    params: { month },
  })
}

export async function copyBudgetsFromPrevious(
  householdId: string,
): Promise<BudgetsMonthDto> {
  return customInstance<BudgetsMonthDto>({
    url: `${budgetsBase(householdId)}/copy-from-previous`,
    method: 'POST',
  })
}

export async function upsertGroupBudget(
  householdId: string,
  data: UpsertBudgetDto,
): Promise<GroupBudgetDto> {
  return customInstance<GroupBudgetDto>({
    url: `${budgetsBase(householdId)}/group`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  })
}

export async function upsertCategoryBudget(
  householdId: string,
  categoryId: string,
  data: UpsertBudgetDto,
): Promise<CategoryBudgetDto> {
  return customInstance<CategoryBudgetDto>({
    url: `${budgetsBase(householdId)}/categories/${categoryId}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  })
}

export async function deleteGroupBudget(
  householdId: string,
  month: string,
): Promise<void> {
  await customInstance<void>({
    url: `${budgetsBase(householdId)}/group/${month}`,
    method: 'DELETE',
  })
}

export async function deleteCategoryBudget(
  householdId: string,
  categoryId: string,
  month: string,
): Promise<void> {
  await customInstance<void>({
    url: `${budgetsBase(householdId)}/categories/${categoryId}/${month}`,
    method: 'DELETE',
  })
}

export function useBudgetsMonth(
  householdId: string,
  month: string,
  options?: Omit<
    UseQueryOptions<BudgetsMonthDto, Error, BudgetsMonthDto, ReturnType<typeof getBudgetsMonthQueryKey>>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: getBudgetsMonthQueryKey(householdId, month),
    queryFn: () => fetchBudgetsMonth(householdId, month),
    enabled: Boolean(householdId && month),
    ...options,
  })
}

export function useCopyBudgetsFromPrevious(
  options?: UseMutationOptions<
    BudgetsMonthDto,
    Error,
    { householdId: string; month: string }
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: ({ householdId }) => copyBudgetsFromPrevious(householdId),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: getBudgetsMonthQueryKey(variables.householdId, variables.month),
      })
      await options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

export function useUpsertGroupBudget(
  options?: UseMutationOptions<
    GroupBudgetDto,
    Error,
    { householdId: string; month: string; amount: number }
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: ({ householdId, month, amount }) =>
      upsertGroupBudget(householdId, { month, amount }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: getBudgetsMonthQueryKey(variables.householdId, variables.month),
      })
      await options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

export function useUpsertCategoryBudget(
  options?: UseMutationOptions<
    CategoryBudgetDto,
    Error,
    { householdId: string; categoryId: string; month: string; amount: number }
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: ({ householdId, categoryId, month, amount }) =>
      upsertCategoryBudget(householdId, categoryId, { month, amount }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: getBudgetsMonthQueryKey(variables.householdId, variables.month),
      })
      await options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

export function useDeleteGroupBudget(
  options?: UseMutationOptions<
    void,
    Error,
    { householdId: string; month: string }
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: ({ householdId, month }) => deleteGroupBudget(householdId, month),
    onSuccess: async (_data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: getBudgetsMonthQueryKey(variables.householdId, variables.month),
      })
      await options?.onSuccess?.(_data, variables, onMutateResult, context)
    },
  })
}

export function useDeleteCategoryBudget(
  options?: UseMutationOptions<
    void,
    Error,
    { householdId: string; categoryId: string; month: string }
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: ({ householdId, categoryId, month }) =>
      deleteCategoryBudget(householdId, categoryId, month),
    onSuccess: async (_data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: getBudgetsMonthQueryKey(variables.householdId, variables.month),
      })
      await options?.onSuccess?.(_data, variables, onMutateResult, context)
    },
  })
}
