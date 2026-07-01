import {
  dashboardGroupsNav,
  dashboardMainNav,
  dashboardSecondaryNav,
  isDashboardGroupPath,
} from '@/components/dashboard/dashboard-nav'
import { AppBrandMark } from '@/components/brand/app-brand-mark'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { clearAccessToken } from '@/api/auth-storage'
import { AUTH_SESSION_QUERY_KEY } from '@/hooks/use-auth-session'
import { useAuthSession } from '@/hooks/use-auth-session'
import { isAdmin } from '@/lib/user-helpers'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronRight, LogOut, PanelLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

function AppLogo() {
  return <AppBrandMark />
}

const GROUPS_SUB_ITEM_STAGGER_S = 0.045
const GROUPS_SUB_ITEM_DURATION_S = 0.2

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const { data: user } = useAuthSession()
  const shouldReduceMotion = useReducedMotion()
  const secondaryNavItems = dashboardSecondaryNav.filter(
    (item) => !item.adminOnly || isAdmin(user?.role),
  )

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }

  const [groupsOpen, setGroupsOpen] = useState(() =>
    isDashboardGroupPath(location.pathname),
  )

  useEffect(() => {
    if (isDashboardGroupPath(location.pathname)) {
      setGroupsOpen(true)
    }
  }, [location.pathname])

  const handleLogout = () => {
    clearAccessToken()
    queryClient.removeQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
    navigate('/login', { replace: true })
  }

  const showCollapsedHeader = isCollapsed && !isMobile

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {showCollapsedHeader ? (
              <SidebarMenuButton
                size="lg"
                onClick={toggleSidebar}
                tooltip="Expandir menu"
              >
                <AppLogo />
              </SidebarMenuButton>
            ) : (
              <div className="flex w-full items-center gap-0.5">
                <SidebarMenuButton
                  size="lg"
                  render={<NavLink to="/dashboard" onClick={closeMobileSidebar} />}
                  className="min-w-0 flex-1"
                >
                  <AppLogo />
                  <span className="font-heading font-semibold group-data-[collapsible=icon]:hidden">
                    WeFinance
                  </span>
                </SidebarMenuButton>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={isMobile ? closeMobileSidebar : toggleSidebar}
                  aria-label={isMobile ? 'Fechar menu' : 'Recolher menu'}
                  className="size-8 shrink-0 cursor-pointer text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <PanelLeft className="size-4" />
                </Button>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent data-tour="tour-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardMainNav.map((item) => (
                <SidebarMenuItem key={item.url} data-tour="tour-nav-transactions">
                  <SidebarMenuButton
                    render={<NavLink to={item.url} onClick={closeMobileSidebar} />}
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                    className="text-base [&_svg]:size-4.5"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem data-tour="tour-nav-groups">
                <SidebarMenuButton
                  onClick={() => setGroupsOpen((open) => !open)}
                  isActive={isDashboardGroupPath(location.pathname)}
                  tooltip={dashboardGroupsNav.title}
                  data-open={groupsOpen}
                  className="text-base [&_svg]:size-4.5"
                >
                  <dashboardGroupsNav.icon />
                  <span>{dashboardGroupsNav.title}</span>
                  <ChevronRight
                    className={cn(
                      'ml-auto transition-transform duration-200',
                      groupsOpen && 'rotate-90',
                    )}
                  />
                </SidebarMenuButton>

                <AnimatePresence initial={false}>
                  {groupsOpen ? (
                    <motion.div
                      key="groups-sub-menu"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.18,
                        ease: 'easeOut',
                      }}
                      className="overflow-hidden"
                    >
                      <SidebarMenuSub>
                        {dashboardGroupsNav.items.map((item, index) => (
                          <SidebarMenuSubItem key={item.url}>
                            <motion.div
                              className="min-w-0"
                              initial={
                                shouldReduceMotion
                                  ? false
                                  : { opacity: 0, x: -8 }
                              }
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: shouldReduceMotion ? 0 : GROUPS_SUB_ITEM_DURATION_S,
                                delay: shouldReduceMotion ? 0 : index * GROUPS_SUB_ITEM_STAGGER_S,
                                ease: [0.25, 0.1, 0.25, 1],
                              }}
                            >
                              <SidebarMenuSubButton
                                render={<NavLink to={item.url} onClick={closeMobileSidebar} />}
                                isActive={location.pathname === item.url}
                                className="text-base [&_svg]:size-4.5"
                              >
                                <item.icon />
                                <span>{item.title}</span>
                              </SidebarMenuSubButton>
                            </motion.div>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem
                  key={item.url}
                  {...(item.url === '/dashboard/ajuda' ? { 'data-tour': 'tour-nav-help' } : {})}
                >
                  <SidebarMenuButton
                    render={<NavLink to={item.url} onClick={closeMobileSidebar} />}
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                    className="text-base [&_svg]:size-4.5"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sair"
              className="text-base text-destructive hover:text-destructive [&_svg]:size-4.5"
            >
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
