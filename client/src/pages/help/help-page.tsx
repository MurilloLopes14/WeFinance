import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type HelpModule, HELP } from '@/lib/help-content'
import { ObjectPageLayout } from '@/components/object/object-page-layout'
import {
  ArrowLeftRight,
  BookOpen,
  CalendarClock,
  Compass,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  Menu,
  PieChart,
  PiggyBank,
  Tags,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  Compass,
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Tags,
  PiggyBank,
  Landmark,
  CalendarClock,
  PieChart,
  UserCircle,
}

const MODULE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  HELP.map((m) => [m.key, m.label]),
)

type FlowNode = { label: string; key: string; accent?: boolean }

const FLOW_ROWS: FlowNode[][] = [
  [
    { label: 'Grupos', key: 'households' },
    { label: 'Contas', key: 'accounts' },
    { label: 'Categorias', key: 'categories' },
  ],
  [{ label: 'Transações', key: 'transactions', accent: true }],
  [
    { label: 'Orçamentos', key: 'budgets' },
    { label: 'Rateios', key: 'splits' },
    { label: 'Fixos', key: 'subscriptions' },
  ],
  [{ label: 'Dashboard', key: 'dashboard', accent: true }],
]

function FlowArrow() {
  return (
    <div className="flex justify-center py-0.5" aria-hidden="true">
      <div className="flex flex-col items-center gap-0.5">
        <div className="h-3 w-px bg-foreground/20" />
        <span className="text-[10px] leading-none text-foreground/30">▼</span>
      </div>
    </div>
  )
}

function EcosystemFlow({ onNavigate }: { onNavigate: (key: string) => void }) {
  return (
    <div className="glass-subtle rounded-xl p-4 ring-1 ring-foreground/10">
      <p className="mb-3 text-xs font-medium text-muted-foreground">
        Como os módulos se conectam
      </p>

      <div className="flex flex-col gap-0" aria-label="Diagrama do ecossistema WeFinance">
        {FLOW_ROWS.map((row, rowIndex) => (
          <div key={rowIndex}>
            {rowIndex > 0 && <FlowArrow />}
            <div className={cn('flex gap-2', row.length === 1 && 'justify-center')}>
              {row.map((node) => (
                <button
                  key={node.key}
                  type="button"
                  onClick={() => onNavigate(node.key)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    node.accent
                      ? [
                          'border-primary/40 bg-primary/10 font-semibold text-primary',
                          'hover:bg-primary/20 hover:border-primary/60',
                          'min-w-40',
                        ]
                      : [
                          'flex-1 border-foreground/15 bg-card/50 text-foreground',
                          'hover:bg-primary/10 hover:border-primary/40',
                        ],
                  )}
                >
                  {node.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Clique em um módulo para ir ao guia correspondente
      </p>
    </div>
  )
}

function TipsPanel({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 ring-1 ring-primary/10">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="size-4 text-primary" aria-hidden="true" />
        <span className="text-sm font-semibold text-primary">Dicas</span>
      </div>
      <ul className="space-y-2" role="list">
        {tips.map((tip, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary/50 self-start translate-y-1.5" aria-hidden="true" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RelatedModules({
  keys,
  onNavigate,
}: {
  keys: string[]
  onNavigate: (key: string) => void
}) {
  if (keys.length === 0) return null

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Conecta com</p>
      <div className="flex flex-wrap gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
          >
            <Badge
              variant="secondary"
              className="cursor-pointer transition-colors hover:bg-primary/20 hover:text-primary"
            >
              {MODULE_LABEL_MAP[key] ?? key}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  )
}

function ModuleContent({
  module,
  onNavigate,
}: {
  module: HelpModule
  onNavigate: (key: string) => void
}) {
  const Icon = ICON_MAP[module.iconName] ?? BookOpen

  return (
    <div className="flex flex-col gap-6">
      {/* Module intro */}
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Icon className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-pretty">{module.label}</h2>
          <p className="text-sm text-primary font-medium">{module.tagline}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{module.description}</p>
        </div>
      </div>

      {/* Ecosystem diagram for overview */}
      {module.key === 'overview' && (
        <EcosystemFlow onNavigate={onNavigate} />
      )}

      {/* Sections */}
      {module.sections.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {module.sections.map((section, i) => (
            <div
              key={i}
              className="glass-subtle rounded-xl p-4 ring-1 ring-foreground/10"
            >
              <h3 className="mb-2 font-heading text-sm font-semibold">{section.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-3 space-y-1.5" role="list">
                  {section.bullets.map((bullet, j) => (
                    <li key={j} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
                      <span
                        className="mt-2 size-1 shrink-0 rounded-full bg-primary/60"
                        aria-hidden="true"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tips + Related */}
      {(module.tips.length > 0 || module.relatedKeys.length > 0) && (
        <div className="flex flex-col gap-4">
          <TipsPanel tips={module.tips} />

          {module.relatedKeys.length > 0 && (
            <>
              <Separator />
              <RelatedModules keys={module.relatedKeys} onNavigate={onNavigate} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function MobileModuleSelector({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (key: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-xl"
            aria-label="Navegar entre módulos"
          />
        }
      >
        <Menu className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="glass-strong w-[--anchor-width] p-1"
        align="start"
        sideOffset={6}
      >
        {HELP.map((module) => {
          const Icon = ICON_MAP[module.iconName] ?? BookOpen
          const isActive = module.key === activeTab
          return (
            <DropdownMenuItem
              key={module.key}
              onClick={() => onTabChange(module.key)}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm',
                isActive && 'bg-primary/10 text-primary',
              )}
            >
              <Icon
                className={cn('size-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}
                aria-hidden="true"
              />
              <span>{module.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function HelpPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'overview'

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value })
  }

  return (
    <ObjectPageLayout>
      <header className="space-y-1.5" data-tour="help-header">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Central de Ajuda
            </h1>
          </div>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Guia completo do WeFinance — entenda cada módulo, como tudo se conecta e dicas para tirar
          o máximo do app.
        </p>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col gap-4"
        data-tour="help-tabs"
      >
        {/* Mobile: dropdown */}
        <div className="md:hidden">
          <MobileModuleSelector
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Desktop: tab list */}
        <div className="hidden overflow-x-auto pb-1 md:block">
          <TabsList
            className="h-auto w-max min-w-full flex-nowrap gap-0.5 rounded-xl bg-muted/50 p-1"
            aria-label="Módulos do WeFinance"
          >
            {HELP.map((module) => {
              const Icon = ICON_MAP[module.iconName] ?? BookOpen
              return (
                <TabsTrigger
                  key={module.key}
                  value={module.key}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{module.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1">
          {HELP.map((module) => (
            <TabsContent
              key={module.key}
              value={module.key}
              className="mt-0 h-full overflow-y-auto"
            >
              <ModuleContent module={module} onNavigate={handleTabChange} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </ObjectPageLayout>
  )
}
