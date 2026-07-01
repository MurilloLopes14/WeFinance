import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  CalendarClock,
  Contact,
  FolderKanban,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  PieChart,
  PiggyBank,
  ScrollText,
  Tags,
  UserCircle,
  Users,
} from 'lucide-react'

export type DashboardNavItem = {
  title: string
  url: string
  icon: LucideIcon
  adminOnly?: boolean
}

export type DashboardNavGroup = {
  title: string
  icon: LucideIcon
  items: DashboardNavItem[]
}

export const dashboardMainNav: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Transações',
    url: '/dashboard/transacoes',
    icon: ArrowLeftRight,
  },
]

export const dashboardGroupsNav: DashboardNavGroup = {
  title: 'Gestão de grupos',
  icon: FolderKanban,
  items: [
    {
      title: 'Grupos',
      url: '/dashboard/grupos',
      icon: Users,
    },
    {
      title: 'Categorias',
      url: '/dashboard/categorias',
      icon: Tags,
    },
    {
      title: 'Orçamentos',
      url: '/dashboard/orcamentos',
      icon: PiggyBank,
    },
    {
      title: 'Contas',
      url: '/dashboard/contas',
      icon: Landmark,
    },
    {
      title: 'Fixos',
      url: '/dashboard/fixos',
      icon: CalendarClock,
    },
    {
      title: 'Pagadores',
      url: '/dashboard/pagadores',
      icon: Contact,
    },
    {
      title: 'Rateios',
      url: '/dashboard/rateios',
      icon: PieChart,
    },
  ],
}

export const dashboardSecondaryNav: DashboardNavItem[] = [
  {
    title: 'Perfil',
    url: '/dashboard/perfil',
    icon: UserCircle,
  },
  {
    title: 'Central de Ajuda',
    url: '/dashboard/ajuda',
    icon: HelpCircle,
  },
  {
    title: 'Notas de versão',
    url: '/dashboard/notas-de-versao',
    icon: ScrollText,
  },
]

export const dashboardGroupPaths = dashboardGroupsNav.items.map((item) => item.url)

export function isDashboardGroupPath(pathname: string): boolean {
  return dashboardGroupPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}
