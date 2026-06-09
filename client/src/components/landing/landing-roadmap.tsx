import { FadeIn } from '@/components/landing/fade-in'
import { LandingSection } from '@/components/landing/landing-section'
import { SectionHeader } from '@/components/layout/section-header'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Bot, LineChart, Smartphone, Zap } from 'lucide-react'

const phases = [
  {
    phase: 'M1',
    title: 'Fundamentos',
    status: 'current',
    icon: Zap,
    items: [
      'Auth & Households',
      'Accounts & Transactions',
      'Categories & Subscriptions',
    ],
  },
  {
    phase: 'M2',
    title: 'Planejamento',
    status: 'upcoming',
    icon: LineChart,
    items: ['Budgets', 'Relatórios avançados', 'Exportações'],
  },
  {
    phase: 'M3',
    title: 'Mobile',
    status: 'upcoming',
    icon: Smartphone,
    items: ['App React Native', 'Sync offline', 'Experiência nativa'],
  },
  {
    phase: 'M4',
    title: 'Automação',
    status: 'upcoming',
    icon: Bot,
    items: ['Importador OFX/CSV com IA', 'OCR para notas fiscais'],
  },
]

export function LandingRoadmap() {
  return (
    <LandingSection id="roadmap">
      <SectionHeader
        eyebrow="Roadmap"
        title={
          <>
            Evolução pensada para{' '}
            <span className="text-gradient">crescer com vocês</span>
          </>
        }
        description="Do MVP sólido à automação inteligente — cada fase entrega valor real antes de expandir o escopo."
      />

      <div className="relative mt-10 sm:mt-14">
        {/* Mobile / tablet timeline */}
        <div className="absolute bottom-0 left-[1.125rem] top-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent md:hidden" />

        {/* Desktop timeline */}
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent lg:block" />

        <div className="space-y-6 sm:space-y-8">
          {phases.map((phase, index) => (
            <FadeIn key={phase.phase} delay={index * 90}>
              <div
                className={cn(
                  'relative grid gap-4 md:grid-cols-2 md:items-center md:gap-6',
                  index % 2 === 1 && 'md:[&>div:first-child]:order-2',
                )}
              >
                {/* Mobile timeline dot */}
                <span
                  aria-hidden
                  className="absolute left-3 top-5 z-10 size-2.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_oklch(from_var(--glow-primary)_l_c_h/60%)] md:hidden"
                />

                <div
                  className={cn(
                    'pl-8 md:pl-0',
                    index % 2 === 0 ? 'md:text-right' : 'md:text-left',
                  )}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'glass-subtle max-w-full rounded-full text-[0.7rem] sm:text-xs',
                      phase.status === 'current' && 'border-primary/40 text-primary',
                    )}
                  >
                    <span className="truncate">
                      {phase.phase} · {phase.title}
                    </span>
                  </Badge>
                </div>

                <article className="glass-strong glow-border ml-8 rounded-2xl p-4 sm:p-5 md:ml-0 md:p-6">
                  <div className="flex items-start gap-3 sm:items-center">
                    <span className="glass flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10">
                      <phase.icon className="size-4 text-primary sm:size-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-heading text-sm font-semibold sm:text-base">
                        {phase.title}
                      </h3>
                      {phase.status === 'current' && (
                        <p className="text-[0.7rem] text-primary sm:text-xs">
                          Em desenvolvimento
                        </p>
                      )}
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
                    {phase.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-muted-foreground sm:text-sm"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary sm:mt-2" />
                        <span className="text-pretty">{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </LandingSection>
  )
}
