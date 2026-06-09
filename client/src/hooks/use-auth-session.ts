import { fetchCurrentUser } from '@/api/auth-api'
import { isAuthenticated } from '@/api/auth-storage'
import { useQuery } from '@tanstack/react-query'

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const

export function useAuthSession(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? isAuthenticated()

  return useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
