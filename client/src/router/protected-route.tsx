import { AuthSessionLoading } from '@/components/auth/auth-session-loading'
import { isAuthenticated } from '@/api/auth-storage'
import { useAuthSession } from '@/hooks/use-auth-session'
import { Navigate, Outlet } from 'react-router-dom'

function ProtectedRouteGuard() {
  const { isLoading, isError, data } = useAuthSession()

  if (isLoading) {
    return <AuthSessionLoading />
  }

  if (isError || !data) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <ProtectedRouteGuard />
}
