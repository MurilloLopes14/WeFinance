import { AppBrandMark } from '@/components/brand/app-brand-mark'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TransactionCreateProvider } from '@/contexts/transaction-create-context'
import { PrivacyModeProvider } from '@/contexts/privacy-mode-context'
import { ReleaseNotesGate } from '@/components/release-notes/release-notes-gate'
import { AppTourProvider } from '@/components/tour/app-tour-provider'
import { DashboardPageTransition } from '@/layouts/dashboard-page-transition'
export function DashboardLayout() {
  return (
    <SidebarProvider className="dashboard-shell">
      <PrivacyModeProvider>
      <TransactionCreateProvider>
        <AppTourProvider>
        <ReleaseNotesGate />
        <AppSidebar />
        <SidebarInset className="min-h-0 flex-1">
          <header className="dashboard-mobile-topbar flex shrink-0 items-center gap-3 px-4 md:hidden">
            <SidebarTrigger className="size-9 rounded-xl" aria-label="Abrir menu" />
            <div className="flex min-w-0 items-center gap-2">
              <AppBrandMark />
              <span className="truncate font-heading text-base font-semibold text-inherit">WeFinance</span>            </div>
          </header>
          <div className="flex h-full min-h-0 flex-1 flex-col p-4 pb-safe-inset md:p-6">
            <DashboardPageTransition />
            <footer className="mt-4 shrink-0 text-center">
              <p className="text-[10px] text-muted-foreground/35 select-none">
                © {new Date().getFullYear()} WeFinance · Todos os direitos reservados
              </p>
            </footer>
          </div>
        </SidebarInset>
        </AppTourProvider>
      </TransactionCreateProvider>
      </PrivacyModeProvider>
    </SidebarProvider>
  )
}
