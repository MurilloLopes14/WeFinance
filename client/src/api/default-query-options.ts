import type { UseQueryOptions } from '@tanstack/react-query'

/** Default React Query options injected by Orval code generation. */
export const defaultQueryOptions = <
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
>(
  options: Partial<UseQueryOptions<TQueryFnData, TError, TData>>,
): Partial<UseQueryOptions<TQueryFnData, TError, TData>> => ({
  staleTime: 60_000,
  gcTime: 300_000,
  retry: 1,
  ...options,
})
