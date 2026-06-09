import { AuthSessionLoading } from '@/components/auth/auth-session-loading'
import { isAuthenticated } from '@/api/auth-storage'
import { useAuthSession } from '@/hooks/use-auth-session'
import { Navigate, Outlet } from 'react-router-dom'

function GuestRouteGuard() {
  const { data, isLoading } = useAuthSession()

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
