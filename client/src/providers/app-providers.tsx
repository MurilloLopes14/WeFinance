import { TooltipProvider } from '@/components/ui/tooltip'
import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { QueryProvider } from './query-provider'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryProvider>
        <TooltipProvider delay={300}>
          {children}
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              classNames: {
                toast: 'glass-strong glow-border border-border/60',
              },
            }}
          />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
