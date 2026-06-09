import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'

export function DashboardHomePage() {
  return (
    <ObjectPageLayout>
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Visão geral das suas finanças em breve.
        </p>
      </header>

      <ObjectPageContent />
    </ObjectPageLayout>
  )
}
