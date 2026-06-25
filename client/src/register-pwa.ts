import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'

export function registerPwa() {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast('Atualização disponível', {
        description: 'Uma nova versão do WeFinance está pronta para instalar.',
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: 'Atualizar',
          onClick: () => {
            void updateSW(true)
          },
        },
      })
    },
  })
}
