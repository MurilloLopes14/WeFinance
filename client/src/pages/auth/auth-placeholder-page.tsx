import { AmbientBackground } from '@/components/landing/ambient-background'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

type AuthPlaceholderPageProps = {
  title: string
  description: string
}

export function AuthPlaceholderPage({ title, description }: AuthPlaceholderPageProps) {
  return (
    <div className="dark relative flex min-h-dvh flex-col overflow-x-clip px-4 py-6 sm:px-6">
      <AmbientBackground />
      <div className="flex flex-1 items-center justify-center pb-[env(safe-area-inset-bottom)]">
        <div className="glass-strong glow-border w-full max-w-md rounded-2xl p-6 text-center sm:rounded-3xl sm:p-8">
          <h1 className="font-heading text-xl font-semibold sm:text-2xl">{title}</h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <Link to="/" className="mt-6 block w-full sm:inline-block sm:w-auto">
            <Button
              variant="outline"
              className="glass-interactive h-11 w-full rounded-xl sm:min-w-[12rem]"
            >
              <ArrowLeft className="size-4" />
              Voltar para a landing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
