import { Button } from '@/components/ui/button'
import { useScrollLock } from '@/hooks/use-scroll-lock'
import { cn } from '@/lib/utils'
import { Menu, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout/page-container'

const navLinks = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Princípios', href: '#principios' },
  { label: 'Roadmap', href: '#roadmap' },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useScrollLock(mobileOpen)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const closeMobileMenu = () => setMobileOpen(false)

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled || mobileOpen ? 'glass-strong py-2.5 shadow-lg sm:py-3' : 'bg-transparent py-4 sm:py-5',
      )}
    >
      <PageContainer as="nav" className="flex items-center justify-between gap-3">
        <Link
          to="/"
          className="group flex min-w-0 items-center gap-2 sm:gap-2.5"
          onClick={closeMobileMenu}
        >
          <span className="glass flex size-8 shrink-0 items-center justify-center rounded-xl glow-sm sm:size-9">
            <Sparkles className="size-3.5 text-primary sm:size-4" />
          </span>
          <span className="truncate font-heading text-base font-semibold tracking-tight sm:text-lg">
            We<span className="text-gradient">Finance</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Entrar
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="glow-primary rounded-xl px-4 sm:px-5">
              <span className="hidden sm:inline">Começar grátis</span>
              <span className="sm:hidden">Começar</span>
            </Button>
          </Link>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </PageContainer>

      <div
        id="mobile-nav"
        className={cn(
          'overflow-hidden transition-all duration-300 md:hidden',
          mobileOpen ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <PageContainer className="pt-2">
          <div className="glass-strong rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-3 text-sm text-muted-foreground transition-colors active:bg-muted/50 hover:bg-muted/50 hover:text-foreground"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </a>
              ))}
              <div className="divider-glass my-2" />
              <Link to="/login" className="w-full" onClick={closeMobileMenu}>
                <Button variant="ghost" className="h-11 w-full justify-center rounded-xl">
                  Entrar
                </Button>
              </Link>
              <Link to="/register" className="w-full" onClick={closeMobileMenu}>
                <Button className="glow-primary h-11 w-full rounded-xl">
                  Começar grátis
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </div>
    </header>
  )
}
