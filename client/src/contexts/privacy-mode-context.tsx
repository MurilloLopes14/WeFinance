import {
  readAmountsHiddenPreference,
  writeAmountsHiddenPreference,
} from '@/lib/privacy-mode-storage'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type PrivacyModeContextValue = {
  amountsHidden: boolean
  toggleAmountsHidden: () => void
  setAmountsHidden: (hidden: boolean) => void
}

const PrivacyModeContext = createContext<PrivacyModeContextValue | null>(null)

export function PrivacyModeProvider({ children }: { children: ReactNode }) {
  const [amountsHidden, setAmountsHiddenState] = useState(readAmountsHiddenPreference)

  const setAmountsHidden = useCallback((hidden: boolean) => {
    setAmountsHiddenState(hidden)
    writeAmountsHiddenPreference(hidden)
  }, [])

  const toggleAmountsHidden = useCallback(() => {
    setAmountsHiddenState((current) => {
      const next = !current
      writeAmountsHiddenPreference(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ amountsHidden, toggleAmountsHidden, setAmountsHidden }),
    [amountsHidden, setAmountsHidden, toggleAmountsHidden],
  )

  return (
    <PrivacyModeContext.Provider value={value}>{children}</PrivacyModeContext.Provider>
  )
}

export function usePrivacyMode(): PrivacyModeContextValue {
  const context = useContext(PrivacyModeContext)

  if (!context) {
    throw new Error('usePrivacyMode must be used within PrivacyModeProvider')
  }

  return context
}
