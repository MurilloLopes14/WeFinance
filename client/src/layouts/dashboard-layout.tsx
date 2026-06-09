import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TransactionCreateProvider } from '@/contexts/transaction-create-context'
import { Outlet } from 'react-router-dom'

export function DashboardLayout() {
  return (
    <SidebarProvider className="dashboard-shell">
      <TransactionCreateProvider>
        <AppSidebar />
        <SidebarInset className="min-h-0 flex-1">
          <div className="flex h-full min-h-0 flex-1 flex-col p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </TransactionCreateProvider>
    </SidebarProvider>
  )
}
