import { AppBrandMark } from '@/components/brand/app-brand-mark'
import { AmbientBackground } from '@/components/landing/ambient-background'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthLayoutProps = {
  children: ReactNode
  className?: string
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="dark relative flex min-h-dvh flex-col overflow-x-clip px-4 pb-6 pt-safe sm:px-6">
      <AmbientBackground />

      <header className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between">
        <Link
          to="/"
          className="glass-interactive flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
        >
          <AppBrandMark />
          <span className="font-heading">WeFinance</span>
        </Link>
      </header>

      <main
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center pb-safe',
          className,
        )}
      >
        {children}
      </main>
    </div>
  )
}
