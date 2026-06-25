import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ObjectPageLayout } from '@/components/object/object-page-layout'
import { useAuthSession } from '@/hooks/use-auth-session'
import { ProfileAvatarSection } from '@/pages/profile/profile-avatar-section'
import { ProfileBasicInfoForm } from '@/pages/profile/profile-basic-info-form'
import { ProfilePasswordForm } from '@/pages/profile/profile-password-form'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

function roleLabel(role: string) {
  return role === 'admin' ? 'Administrador' : 'Membro'
}

type ProfileSectionProps = {
  title: string
  description: ReactNode
  badge?: ReactNode
  tourAnchor?: string
  children: ReactNode
}

function ProfileSection({ title, description, badge, tourAnchor, children }: ProfileSectionProps) {
  return (
    <section className="w-full space-y-6" {...(tourAnchor ? { 'data-tour': tourAnchor } : {})}>
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg font-medium text-pretty">{title}</h2>
          {badge}
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function ProfilePage() {
  const { data: user, isLoading, isError } = useAuthSession()

  return (
    <ObjectPageLayout className="min-h-0 w-full">
      <header className="w-full space-y-1.5" data-tour="profile-header">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-pretty">
          Perfil
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Gerencie sua foto, dados pessoais e senha de acesso.
        </p>
      </header>

      {isLoading ? (
        <div className="flex w-full flex-1 items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Carregando perfil…</span>
        </div>
      ) : isError || !user ? (
        <p className="w-full text-sm text-destructive" role="alert">
          Não foi possível carregar seu perfil. Tente sair e entrar novamente.
        </p>
      ) : (
        <div className="flex w-full min-w-0 flex-1 flex-col gap-10">
          <ProfileSection
            title="Foto de perfil"
            description="Sua foto aparece no app e nas finanças compartilhadas do grupo."
            tourAnchor="profile-avatar"
          >
            <ProfileAvatarSection
              name={user.name}
              email={user.email}
              avatarUrl={user.avatarUrl as string | null | undefined}
            />
          </ProfileSection>

          <Separator />

          <ProfileSection
            title="Informações básicas"
            tourAnchor="profile-basic-info"
            description={
              <>
                Atualize nome, e-mail, telefone e data de nascimento.
                {user.updatedAt ? (
                  <>
                    {' '}
                    Última atualização em{' '}
                    {format(new Date(user.updatedAt), "d 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                    .
                  </>
                ) : null}
              </>
            }
            badge={<Badge variant="secondary">{roleLabel(user.role)}</Badge>}
          >
            <ProfileBasicInfoForm user={user} />
          </ProfileSection>

          <Separator />

          <ProfileSection
            title="Segurança"
            tourAnchor="profile-password"
            description="Informe e confirme a nova senha para substituir a atual. Por enquanto não há recuperação por e-mail — a troca é feita aqui no perfil."
          >
            <ProfilePasswordForm userId={user.id} />
          </ProfileSection>
        </div>
      )}
    </ObjectPageLayout>
  )
}
