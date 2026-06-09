import { FadeIn } from '@/components/landing/fade-in'
import { LandingSection } from '@/components/landing/landing-section'
import { SectionHeader } from '@/components/layout/section-header'
import {
  Eye,
  Handshake,
  Layers3,
  MousePointerClick,
  Scale,
} from 'lucide-react'

const principles = [
  {
    icon: MousePointerClick,
    title: 'Simplicidade de uso',
    description:
      'Foco em poucos cliques e interface limpa — zen, centrada nos dados, não nos elementos.',
  },
  {
    icon: Eye,
    title: 'Transparência',
    description:
      'Cada pessoa visualiza seus dados e os compartilhados de forma clara, conforme o combinado.',
  },
  {
    icon: Scale,
    title: 'Confiabilidade',
    description:
      'Toda alteração é rastreável via event sourcing — decisões financeiras com histórico completo.',
  },
  {
    icon: Layers3,
    title: 'Escalabilidade',
    description:
      'Código modular e banco preparado para budgets, metas, mobile e automações futuras.',
  },
  {
    icon: Handshake,
    title: 'Controle manual e automático',
    description:
      'Importação de dados facilitada, mas nunca impõe regras sem a confirmação do usuário.',
  },
]

export function LandingPrinciples() {
  return (
    <LandingSection id="principios">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12">
        <SectionHeader
          align="left"
          eyebrow="Princípios"
          title={
            <>
              Clareza financeira em{' '}
              <span className="text-gradient">qualquer contexto</span>
            </>
          }
          description="Sozinho ou acompanhado — o WeFinance se adapta ao seu momento: controle pessoal, família, casal, república ou viagem entre amigos."
        />

        <div className="space-y-3 sm:space-y-4">
          {principles.map((principle, index) => (
            <FadeIn key={principle.title} delay={index * 70}>
              <div className="glass-interactive flex gap-3 rounded-2xl p-4 sm:gap-4 sm:p-5">
                <span className="glass flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11">
                  <principle.icon className="size-4 text-primary sm:size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-semibold sm:text-base">
                    {principle.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:mt-1.5 sm:text-sm">
                    {principle.description}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </LandingSection>
  )
}
