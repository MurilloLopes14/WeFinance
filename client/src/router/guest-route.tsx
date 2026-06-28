import { AuthSessionLoading } from '@/components/auth/auth-session-loading'
import { clearAccessToken, isAuthenticated } from '@/api/auth-storage'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

function GuestRouteGuard() {
  const { data, isLoading, isError } = useAuthSession()

  useEffect(() => {
    if (isError) {
      clearAccessToken()
    }
  }, [isError])

  if (isLoading) {
    return <AuthSessionLoading />
  }

  if (data) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export function GuestRoute() {
  if (!isAuthenticated()) {
    return <Outlet />
  }

  return <GuestRouteGuard />
}
