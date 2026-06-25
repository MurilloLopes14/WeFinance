import { updateUserOnboarding } from '@/api/auth-api'
import { filterAvailableTourSteps, getTourSteps } from '@/lib/tour-registry'
import {
  resolveOnboarding,
  shouldRunTour,
  withCompletedTour,
} from '@/lib/tour-helpers'
import { getTourKeyFromPath, type TourKey } from '@/lib/tour-keys'
import { AUTH_SESSION_QUERY_KEY, useAuthSession } from '@/hooks/use-auth-session'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Joyride, EVENTS, STATUS, type EventHandler, type Step } from 'react-joyride'

const tourLocale = {
  back: 'Voltar',
  close: 'Fechar',
  last: 'Concluir',
  next: 'Próximo',
  skip: 'Pular tour',
  nextWithProgress: 'Próximo ({current} de {total})',
}

type AppTourProviderProps = {
  children: React.ReactNode
}

export function AppTourProvider({ children }: AppTourProviderProps) {
  const location = useLocation()
  const queryClient = useQueryClient()
  const { data: user } = useAuthSession()
  const [run, setRun] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const activeTourKeyRef = useRef<TourKey | null>(null)

  const completeTourMutation = useMutation({
    mutationFn: updateUserOnboarding,
    onSuccess: (me) => {
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, me)
    },
  })

  const markTourCompleted = useCallback(
    (tourKey: TourKey) => {
      const onboarding = resolveOnboarding(user?.onboarding)
      const nextOnboarding = withCompletedTour(onboarding, tourKey)

      completeTourMutation.mutate({
        completedTours: nextOnboarding.completedTours,
      })
    },
    [completeTourMutation, user?.onboarding],
  )

  useEffect(() => {
    setRun(false)
    activeTourKeyRef.current = null

    const tourKey = getTourKeyFromPath(location.pathname)
    if (!tourKey || !user) return

    const onboarding = resolveOnboarding(user.onboarding)
    if (!shouldRunTour(onboarding, tourKey)) return

    const timer = window.setTimeout(() => {
      const availableSteps = filterAvailableTourSteps(getTourSteps(tourKey))
      if (availableSteps.length === 0) return

      activeTourKeyRef.current = tourKey
      setSteps(availableSteps)
      setRun(true)
    }, 650)

    return () => {
      window.clearTimeout(timer)
    }
  }, [location.pathname, user])

  const handleEvent: EventHandler = (data) => {
    if (data.type !== EVENTS.TOUR_END) return

    setRun(false)

    const tourKey = activeTourKeyRef.current
    activeTourKeyRef.current = null

    if (
      !tourKey ||
      (data.status !== STATUS.FINISHED && data.status !== STATUS.SKIPPED)
    ) {
      return
    }

    markTourCompleted(tourKey)
  }

  return (
    <>
      {children}
      <Joyride
        run={run}
        steps={steps}
        continuous
        scrollToFirstStep
        locale={tourLocale}
        options={{
          skipBeacon: true,
          showProgress: true,
          buttons: ['back', 'skip', 'primary'],
          overlayClickAction: false,
          primaryColor: 'oklch(0.52 0.16 250)',
          backgroundColor: 'oklch(0.18 0.02 265 / 96%)',
          textColor: 'oklch(0.96 0.01 250)',
          overlayColor: 'oklch(0.08 0.02 265 / 72%)',
          arrowColor: 'oklch(0.18 0.02 265 / 96%)',
        }}
        styles={{
          tooltip: {
            borderRadius: 12,
            padding: 16,
          },
          tooltipTitle: {
            fontSize: '0.95rem',
            fontWeight: 600,
          },
          tooltipContent: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
          },
          buttonPrimary: {
            borderRadius: 10,
            fontWeight: 600,
            padding: '8px 16px',
            boxShadow: 'var(--shadow-glow-primary)',
          },
          buttonBack: {
            borderRadius: 10,
          },
          buttonSkip: {
            borderRadius: 10,
          },
        }}
        onEvent={handleEvent}
      />
    </>
  )
}
