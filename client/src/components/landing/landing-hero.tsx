import { FadeIn } from '@/components/landing/fade-in'
import { LandingAudiences } from '@/components/landing/landing-audiences'
import { LandingSection } from '@/components/landing/landing-section'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Layers,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const highlights = [
  { icon: UserRound, label: 'Modo individual ou em grupo' },
  { icon: Layers, label: 'Múltiplos households' },
  { icon: ShieldCheck, label: 'Privacidade por padrão' },
]

export function LandingHero() {
  return (
    <LandingSection className="landing-hero-offset relative pb-16 sm:pb-20 lg:pb-24">
      <FadeIn>
        <Badge className="glass-subtle mb-5 max-w-full gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] font-medium sm:mb-6 sm:px-4 sm:text-xs">
          <Sparkles className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">Sozinho ou em grupo — você escolhe</span>
        </Badge>
      </FadeIn>

      <FadeIn delay={100}>
        <h1 className="max-w-4xl text-balance font-heading text-[clamp(1.875rem,5.5vw,3.75rem)] font-semibold leading-[1.1] tracking-tight">
          Suas finanças,{' '}
          <span className="text-gradient-shimmer text-glow">
            do seu jeito
          </span>
          — solo ou em grupo
        </h1>
      </FadeIn>

      <FadeIn delay={200}>
        <p className="mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base lg:text-lg">
          WeFinance é um controle financeiro flexível: use sozinho para organizar
          a vida pessoal ou crie um grupo com família, casal, amigos ou quem
          dividir despesas com você — com rateio, relatórios e transparência.
        </p>
      </FadeIn>

      <LandingAudiences />

      <FadeIn delay={400}>
        <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="glow-primary h-11 w-full rounded-xl px-6 sm:min-w-[13rem]">
              Criar conta gratuita
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="glass-interactive h-11 w-full rounded-xl px-6 sm:min-w-[13rem]"
            >
              Entrar
            </Button>
          </Link>
          <a href="#funcionalidades" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="glass-interactive h-11 w-full rounded-xl px-6 sm:min-w-[13rem]"
            >
              Conhecer funcionalidades
            </Button>
          </a>
        </div>
      </FadeIn>

      <FadeIn delay={500}>
        <div className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4">
          {highlights.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="glass-interactive glow-border flex items-center gap-3 rounded-2xl p-3.5 sm:p-4"
            >
              <span className="glass flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10">
                <Icon className="size-4 text-primary sm:size-5" />
              </span>
              <span className="text-xs font-medium sm:text-sm">{label}</span>
            </div>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={600} className="mt-10 sm:mt-16">
        <div className="glass-strong glow-border relative overflow-hidden rounded-2xl p-5 sm:rounded-3xl sm:p-6 lg:p-8">
          <div className="absolute -right-16 -top-16 size-40 rounded-full bg-[oklch(from_var(--neon-violet)_l_c_h/20%)] blur-3xl sm:-right-20 sm:-top-20 sm:size-56" />
          <div className="relative grid gap-5 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-6">
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary sm:text-xs sm:tracking-widest">
                Missão
              </p>
              <p className="mt-2 text-pretty font-heading text-lg leading-snug sm:mt-3 sm:text-xl lg:text-2xl">
                Dar{' '}
                <span className="text-gradient">clareza financeira</span> para
                quem administra sozinho ou em grupo — com transparência quando
                compartilhado e autonomia quando individual.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {[
                { value: 'Solo', label: 'Finanças pessoais' },
                { value: 'Grupo', label: 'Households' },
                { value: '50/50', label: 'Rateio flexível' },
                { value: 'CSV', label: 'Importação bancária' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="glass-subtle rounded-xl p-3 text-center sm:rounded-2xl sm:p-4"
                >
                  <p className="font-heading text-base font-semibold text-gradient sm:text-lg">
                    {item.value}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] leading-tight text-muted-foreground sm:mt-1 sm:text-xs">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
    </LandingSection>
  )
}
