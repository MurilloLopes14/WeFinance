import { TransactionCreateModal } from '@/pages/transactions/modals/transaction-create-modal'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type TransactionCreateContextValue = {
  openCreate: (householdId?: string) => void
}

const TransactionCreateContext = createContext<TransactionCreateContextValue | null>(null)

export function TransactionCreateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [defaultHouseholdId, setDefaultHouseholdId] = useState<string | undefined>()

  const openCreate = useCallback((householdId?: string) => {
    setDefaultHouseholdId(householdId)
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ openCreate }), [openCreate])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setDefaultHouseholdId(undefined)
    }
  }

  return (
    <TransactionCreateContext.Provider value={value}>
      {children}
      <TransactionCreateModal
        open={open}
        onOpenChange={handleOpenChange}
        defaultHouseholdId={defaultHouseholdId}
      />
    </TransactionCreateContext.Provider>
  )
}

export function useTransactionCreate() {
  const context = useContext(TransactionCreateContext)

  if (!context) {
    throw new Error('useTransactionCreate deve ser usado dentro de TransactionCreateProvider')
  }

  return context
}
