import { AuthLayout } from '@/components/auth/auth-layout'
import {RegisterWizard} from './register/register-wizard'

export function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterWizard />
    </AuthLayout>
  )
}
