import { FadeIn } from '@/components/landing/fade-in'
import { Home, Heart, User, Users } from 'lucide-react'

const audiences = [
  {
    icon: User,
    label: 'Sozinho',
    description: 'Controle pessoal completo, sem precisar de grupo.',
  },
  {
    icon: Heart,
    label: 'Casal',
    description: 'Planejamento a dois com transparência e rateio.',
  },
  {
    icon: Home,
    label: 'Família',
    description: 'Orçamento doméstico com visão compartilhada.',
  },
  {
    icon: Users,
    label: 'Amigos',
    description: 'Divida despesas de viagens, repúblicas e projetos.',
  },
]

export function LandingAudiences() {
  return (
    <FadeIn delay={350}>
      <div className="mt-8 sm:mt-10">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary sm:text-xs sm:tracking-widest">
          Para quem é
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {audiences.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="glass-interactive glow-border rounded-2xl p-3 sm:p-4"
            >
              <span className="glass flex size-8 items-center justify-center rounded-lg sm:size-9">
                <Icon className="size-3.5 text-primary sm:size-4" />
              </span>
              <p className="mt-2 font-heading text-sm font-semibold">{label}</p>
              <p className="mt-1 text-[0.65rem] leading-snug text-muted-foreground sm:text-xs">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  )
}
