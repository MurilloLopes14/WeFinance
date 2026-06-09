import { AmbientBackground } from '@/components/landing/ambient-background'
import { AuthCard } from '@/components/auth/auth-card'
import { Loader2 } from 'lucide-react'

export function AuthSessionLoading() {
  return (
    <div className="dark relative flex min-h-dvh items-center justify-center overflow-x-clip px-4 py-6">
      <AmbientBackground />
      <AuthCard className="relative z-10 w-auto px-5 py-4">
        <div
          className="flex items-center gap-3"
          role="status"
          aria-live="polite"
          aria-label="Verificando sessão"
        >
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Verificando sessão...</span>
        </div>
      </AuthCard>
    </div>
  )
}
