import { TransactionCreateModal } from '@/pages/transactions/modals/transaction-create-modal'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type TransactionCreateContextValue = {
  openCreate: () => void
}

const TransactionCreateContext = createContext<TransactionCreateContextValue | null>(null)

export function TransactionCreateProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const openCreate = useCallback(() => {
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ openCreate }), [openCreate])

  return (
    <TransactionCreateContext.Provider value={value}>
      {children}
      <TransactionCreateModal open={open} onOpenChange={setOpen} />
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
