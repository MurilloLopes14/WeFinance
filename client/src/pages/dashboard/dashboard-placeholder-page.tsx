import { ObjectPageContent, ObjectPageLayout } from '@/components/object/object-page-layout'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import type { LucideIcon } from 'lucide-react'
import { Construction } from 'lucide-react'

type DashboardPlaceholderPageProps = {
  title: string
  description?: string
  icon?: LucideIcon
}

export function DashboardPlaceholderPage({
  title,
  description = 'Esta tela será implementada em breve.',
  icon: Icon = Construction,
}: DashboardPlaceholderPageProps) {
  return (
    <ObjectPageLayout>
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </header>

      <ObjectPageContent>
        <Empty className="flex h-full min-h-0 w-full flex-1 flex-col justify-center border border-dashed border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>Em breve</EmptyTitle>
            <EmptyDescription>Estamos preparando esta funcionalidade.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </ObjectPageContent>
    </ObjectPageLayout>
  )
}
