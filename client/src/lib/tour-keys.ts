import {
  dashboardGroupsNav,
  dashboardMainNav,
  dashboardSecondaryNav,
} from '@/components/dashboard/dashboard-nav'

export const TOUR_KEYS = [
  'dashboard',
  'transactions',
  'households',
  'categories',
  'budgets',
  'accounts',
  'subscriptions',
  'splits',
  'profile',
  'help',
] as const

export type TourKey = (typeof TOUR_KEYS)[number]

const pathToTourKey: Record<string, TourKey> = {
  '/dashboard': 'dashboard',
  ...Object.fromEntries(
    dashboardMainNav.map((item) => [item.url, pathSegmentToTourKey(item.url)]),
  ),
  ...Object.fromEntries(
    dashboardGroupsNav.items.map((item) => [item.url, pathSegmentToTourKey(item.url)]),
  ),
  ...Object.fromEntries(
    dashboardSecondaryNav.map((item) => [item.url, pathSegmentToTourKey(item.url)]),
  ),
}

function pathSegmentToTourKey(url: string): TourKey {
  const segment = url.replace('/dashboard/', '')
  const map: Record<string, TourKey> = {
    transacoes: 'transactions',
    grupos: 'households',
    categorias: 'categories',
    orcamentos: 'budgets',
    contas: 'accounts',
    fixos: 'subscriptions',
    rateios: 'splits',
    perfil: 'profile',
    ajuda: 'help',
  }
  return map[segment] ?? 'dashboard'
}

export function getTourKeyFromPath(pathname: string): TourKey | null {
  const normalized = pathname.replace(/\/$/, '') || '/dashboard'

  if (normalized === '/dashboard') {
    return 'dashboard'
  }

  const exact = pathToTourKey[normalized]
  if (exact) return exact

  return null
}

export function isTourKey(value: string): value is TourKey {
  return (TOUR_KEYS as readonly string[]).includes(value)
}
