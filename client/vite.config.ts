import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['logo.png', 'logo_96.png', 'logo_192.png', 'logo_512.png'],
      manifest: {
        name: 'WeFinance',
        short_name: 'WeFinance',
        description:
          'Controle financeiro individual ou em grupo. Organize sozinho ou com família, casal e amigos.',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        display: 'standalone',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'logo_192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo_512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'logo_512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/logo_complete.png'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
