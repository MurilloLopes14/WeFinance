import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BarChart3,
  CalendarClock,
  FolderKanban,
  Landmark,
  PieChart,
  Tags,
  UserCircle,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react'

export type DashboardNavItem = {
  title: string
  url: string
  icon: LucideIcon
}

export type DashboardNavGroup = {
  title: string
  icon: LucideIcon
  items: DashboardNavItem[]
}

export const dashboardMainNav: DashboardNavItem[] = [
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
      title: 'Contas',
      url: '/dashboard/contas',
      icon: Landmark,
    },
    {
      title: 'Assinaturas',
      url: '/dashboard/assinaturas',
      icon: CalendarClock,
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
    title: 'Relatórios',
    url: '/dashboard/relatorios',
    icon: BarChart3,
  },
  {
    title: 'Usuários',
    url: '/dashboard/usuarios',
    icon: UsersRound,
  },
  {
    title: 'Perfil',
    url: '/dashboard/perfil',
    icon: UserCircle,
  },
]

export const dashboardGroupPaths = dashboardGroupsNav.items.map((item) => item.url)

export function isDashboardGroupPath(pathname: string): boolean {
  return dashboardGroupPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}
