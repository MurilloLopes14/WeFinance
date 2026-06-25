import { FadeIn } from '@/components/landing/fade-in'
import { LandingSection } from '@/components/landing/landing-section'
import { SectionHeader } from '@/components/layout/section-header'
import {
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  Repeat,
  Split,
  Users,
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Grupos flexíveis',
    description:
      'Crie um household para família, casal, amigos ou use só você. Cada pessoa com login próprio e permissões claras.',
  },
  {
    icon: CreditCard,
    title: 'Contas financeiras',
    description:
      'Banco, cartão, poupança e investimento — organizados no seu espaço pessoal ou no do grupo.',
  },
  {
    icon: Layers,
    title: 'Transações e categorias',
    description:
      'Despesas, receitas e transferências com categorias hierárquicas e filtros claros por pessoa.',
  },
  {
    icon: Split,
    title: 'Rateio inteligente',
    description:
      'Divida valores entre membros do grupo (50/50, percentual ou fixo). Sozinho, o rateio nem entra em cena.',
  },
  {
    icon: Repeat,
    title: 'Despesas e receitas fixas',
    description:
      'Netflix, Spotify, salário e outras movimentações fixas com controle de renovação e execução manual.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Importação CSV',
    description:
      'Importe extratos bancários em lote com categorização automática — sempre com confirmação sua.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios resumidos',
    description:
      'Receitas, despesas, top categorias e saldo mensal em visões intuitivas para decisões rápidas.',
  },
  {
    icon: RefreshCw,
    title: 'Auditoria completa',
    description:
      'Trilha de eventos registra cada alteração relevante — confiabilidade e rastreabilidade garantidas.',
  },
]

export function LandingFeatures() {
  return (
    <LandingSection id="funcionalidades">
      <SectionHeader
        eyebrow="MVP"
        title={
          <>
            Tudo para começar{' '}
            <span className="text-gradient">solo ou em grupo</span>
          </>
        }
        description="Funcionalidades que funcionam para finanças pessoais e compartilhadas — do orçamento individual ao rateio entre amigos."
      />

      <div className="mt-10 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {features.map((feature, index) => (
          <FadeIn key={feature.title} delay={index * 60}>
            <article className="glass-interactive group h-full rounded-2xl p-4 sm:p-5">
              <span className="glass flex size-10 items-center justify-center rounded-xl transition-shadow group-hover:glow-sm sm:size-11">
                <feature.icon className="size-4 text-primary sm:size-5" />
              </span>
              <h3 className="mt-3 font-heading text-sm font-semibold sm:mt-4 sm:text-base">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm">
                {feature.description}
              </p>
            </article>
          </FadeIn>
        ))}
      </div>
    </LandingSection>
  )
}
