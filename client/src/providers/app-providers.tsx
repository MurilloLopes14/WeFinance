import { TooltipProvider } from '@/components/ui/tooltip'
import type { ReactNode } from 'react'
import { QueryProvider } from './query-provider'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <TooltipProvider delay={300}>{children}</TooltipProvider>
    </QueryProvider>
  )
}
