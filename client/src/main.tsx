import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { configureAxiosBaseUrl } from '@/api/axios-instance'
import { AppProviders } from '@/providers/app-providers'
import { registerPwa } from '@/register-pwa'
import './index.css'
import App from './App.tsx'

configureAxiosBaseUrl(import.meta.env.VITE_API_URL)
registerPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
