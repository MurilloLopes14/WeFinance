import { AuthLayout } from '@/components/auth/auth-layout'
import { LoginForm } from './login/login-form'

export function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
