import {
  dashboardGroupsNav,
  dashboardMainNav,
  dashboardSecondaryNav,
  isDashboardGroupPath,
} from '@/components/dashboard/dashboard-nav'
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
import { cn } from '@/lib/utils'
import { ChevronRight, LogOut, PanelLeft, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

function AppLogo() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
      <Wallet className="size-4" />
    </span>
  )
}

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'

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

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {isCollapsed ? (
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
                  render={<NavLink to="/dashboard" />}
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
                  onClick={toggleSidebar}
                  aria-label="Recolher menu"
                  className="size-8 shrink-0 cursor-pointer text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <PanelLeft className="size-4" />
                </Button>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardMainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={<NavLink to={item.url} />}
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
              <SidebarMenuItem>
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

                {groupsOpen && (
                  <SidebarMenuSub>
                    {dashboardGroupsNav.items.map((item) => (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton
                          render={<NavLink to={item.url} />}
                          isActive={location.pathname === item.url}
                          className="text-base [&_svg]:size-4.5"
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardSecondaryNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={<NavLink to={item.url} />}
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
