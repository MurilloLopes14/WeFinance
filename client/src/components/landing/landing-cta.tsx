import { FadeIn } from '@/components/landing/fade-in'
import { LandingSection } from '@/components/landing/landing-section'
import { Button } from '@/components/ui/button'
import { ArrowRight, Lock, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingCta() {
  return (
    <LandingSection containerClassName="pb-4 sm:pb-6">
      <FadeIn>
        <div className="glass-strong glow-border relative overflow-hidden rounded-2xl px-4 py-10 text-center sm:rounded-3xl sm:px-8 sm:py-12 lg:px-12 lg:py-16">
          <div className="orb orb-cyan absolute -left-12 top-0 size-36 opacity-50 sm:-left-16 sm:size-48 sm:opacity-60" />
          <div className="orb orb-violet absolute -right-12 bottom-0 size-40 opacity-40 sm:-right-16 sm:size-56 sm:opacity-50" />

          <div className="relative">
            <h2 className="text-balance font-heading text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Prontos para organizar as finanças{' '}
              <span className="text-gradient">do seu jeito</span>?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground sm:mt-4 sm:text-base">
              Crie sua conta solo ou monte um grupo e convide família, parceiro(a),
              amigos — quem fizer sentido na sua rotina financeira.
            </p>

            <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-center">
              <Link to="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="glow-primary h-11 w-full rounded-xl px-6 sm:min-w-[11rem]"
                >
                  Começar agora
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="glass-interactive h-11 w-full rounded-xl px-6 sm:min-w-[11rem]"
                >
                  Já tenho conta
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-[0.7rem] text-muted-foreground sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-6 sm:text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="size-3.5 shrink-0 text-primary" />
                JWT + bcrypt
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="size-3.5 shrink-0 text-primary" />
                Escopo por household
              </span>
              <span>Papéis owner / member</span>
            </div>
          </div>
        </div>
      </FadeIn>
    </LandingSection>
  )
}
