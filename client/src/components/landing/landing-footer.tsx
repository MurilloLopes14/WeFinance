import { AppBrandMark } from '@/components/brand/app-brand-mark'
import { PageContainer } from '@/components/layout/page-container'
import { Link } from 'react-router-dom'

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 sm:pt-10">
      <PageContainer className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <Link to="/" className="inline-flex items-center gap-2">
          <AppBrandMark size="sm" />
          <span className="font-heading text-sm font-semibold">
            WeFinance
          </span>
        </Link>

        <p className="max-w-md text-pretty text-[0.7rem] text-muted-foreground sm:text-xs md:text-sm">
          Finanças individuais ou em grupo · família, casal, amigos ou solo
        </p>

        <div className="flex w-full justify-center gap-5 text-xs text-muted-foreground sm:gap-4 md:w-auto md:justify-end">
          <Link to="/login" className="min-h-11 min-w-11 content-center transition-colors hover:text-foreground">
            Entrar
          </Link>
          <Link
            to="/register"
            className="min-h-11 min-w-11 content-center transition-colors hover:text-foreground"
          >
            Registrar
          </Link>
        </div>
      </PageContainer>
    </footer>
  )
}
