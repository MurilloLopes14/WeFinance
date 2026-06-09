import { LoginPage } from '@/pages/auth/login-page'
import { RegisterPage } from '@/pages/auth/register-page'
import { AuthPlaceholderPage } from '@/pages/auth/auth-placeholder-page'
import { DashboardHomePage } from '@/pages/dashboard/dashboard-home-page'
import { DashboardPlaceholderPage } from '@/pages/dashboard/dashboard-placeholder-page'
import { AccountPage } from '@/pages/accounts/account-page'
import { CategoryPage } from '@/pages/categories/category-page'
import { HouseholdPage } from '@/pages/households/household-page'
import { TransactionPage } from '@/pages/transactions/transaction-page'
import {
  dashboardGroupsNav,
  dashboardMainNav,
  dashboardSecondaryNav,
} from '@/components/dashboard/dashboard-nav'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { LandingPage } from '@/pages/landing/landing-page'
import { ProtectedRoute } from '@/router/protected-route'
import { GuestRoute } from '@/router/guest-route'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route
          path="/forgot-password"
          element={
            <AuthPlaceholderPage
              title="Recuperar senha"
              description="A recuperação de senha será implementada em breve."
            />
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHomePage />} />

            {dashboardMainNav.map((item) => (
              <Route
                key={item.url}
                path={item.url.replace('/dashboard/', '')}
                element={
                  item.url === '/dashboard/transacoes' ? (
                    <TransactionPage />
                  ) : (
                    <DashboardPlaceholderPage
                      title={item.title}
                      icon={item.icon}
                    />
                  )
                }
              />
            ))}

            {dashboardGroupsNav.items.map((item) => (
              <Route
                key={item.url}
                path={item.url.replace('/dashboard/', '')}
                element={
                  item.url === '/dashboard/grupos' ? (
                    <HouseholdPage />
                  ) : item.url === '/dashboard/categorias' ? (
                    <CategoryPage />
                  ) : item.url === '/dashboard/contas' ? (
                    <AccountPage />
                  ) : (
                    <DashboardPlaceholderPage
                      title={item.title}
                      icon={item.icon}
                    />
                  )
                }
              />
            ))}

            {dashboardSecondaryNav.map((item) => (
              <Route
                key={item.url}
                path={item.url.replace('/dashboard/', '')}
                element={
                  <DashboardPlaceholderPage
                    title={item.title}
                    icon={item.icon}
                  />
                }
              />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
