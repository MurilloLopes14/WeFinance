import { CreateTransactionDtoType } from '@/api/generated/models/createTransactionDtoType'
import { isSplitTotalValid } from '@/lib/transaction-split-helpers'
import { z } from 'zod'

export const transactionSplitModeValues = ['none', 'custom', 'default'] as const

export const customSplitEntrySchema = z.object({
  userId: z.string().uuid('Selecione um membro'),
  share: z
    .number({ error: 'Informe um valor válido' })
    .min(0, 'O valor não pode ser negativo'),
})

export const transactionFormSchema = z
  .object({
    householdId: z.string().uuid('Selecione um grupo'),
    accountId: z.string().uuid('Selecione uma conta'),
    type: z.enum([
      CreateTransactionDtoType.expense,
      CreateTransactionDtoType.income,
      CreateTransactionDtoType.transfer,
    ]),
    amount: z
      .number({ error: 'Informe um valor válido' })
      .min(0.01, 'O valor deve ser maior que zero'),
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida'),
    categoryId: z.string().optional().or(z.literal('')),
    description: z
      .string()
      .trim()
      .max(500, 'A descrição deve ter no máximo 500 caracteres')
      .optional()
      .or(z.literal('')),
    toAccountId: z.string().optional().or(z.literal('')),
    hasPayee: z.boolean(),
    payeeId: z.string().optional().or(z.literal('')),
    payeeName: z
      .string()
      .trim()
      .max(120, 'O nome deve ter no máximo 120 caracteres')
      .optional()
      .or(z.literal('')),
    splitMode: z.enum(transactionSplitModeValues),
    customSplits: z.array(customSplitEntrySchema),
  })
  .superRefine((values, context) => {
    if (values.type === 'transfer') {
      if (!values.toAccountId) {
        context.addIssue({
          code: 'custom',
          path: ['toAccountId'],
          message: 'Selecione a conta de destino',
        })
      } else if (values.toAccountId === values.accountId) {
        context.addIssue({
          code: 'custom',
          path: ['toAccountId'],
          message: 'A conta de destino deve ser diferente da origem',
        })
      }
      return
    }

    if (values.hasPayee) {
      const hasSelectedPayee = Boolean(values.payeeId)
      const hasQuickCreateName = Boolean(values.payeeName?.trim())

      if (!hasSelectedPayee && !hasQuickCreateName) {
        context.addIssue({
          code: 'custom',
          path: ['payeeName'],
          message: 'Selecione um beneficiário ou informe um nome para cadastrar',
        })
      }
    }

    if (values.splitMode !== 'custom') return

    if (values.customSplits.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['customSplits'],
        message: 'Adicione ao menos um membro ao rateio',
      })
      return
    }

    const userIds = values.customSplits.map((entry) => entry.userId)
    if (new Set(userIds).size !== userIds.length) {
      context.addIssue({
        code: 'custom',
        path: ['customSplits'],
        message: 'Cada membro só pode aparecer uma vez no rateio',
      })
    }

    const total = values.customSplits.reduce((acc, entry) => acc + entry.share, 0)
    if (!isSplitTotalValid(total, values.amount)) {
      context.addIssue({
        code: 'custom',
        path: ['customSplits'],
        message: `A soma do rateio (${total.toFixed(2)}) deve ser igual ao valor da transação (${values.amount.toFixed(2)})`,
      })
    }
  })

export type TransactionFormValues = z.infer<typeof transactionFormSchema>

export function createDefaultTransactionFormValues(
  householdId = '',
): TransactionFormValues {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return {
    householdId,
    accountId: '',
    type: CreateTransactionDtoType.expense,
    amount: 0,
    date: `${today.getFullYear()}-${month}-${day}`,
    categoryId: '',
    description: '',
    toAccountId: '',
    hasPayee: false,
    payeeId: '',
    payeeName: '',
    splitMode: 'none',
    customSplits: [],
  }
}

export const transactionTypeFormOptions = [
  { value: CreateTransactionDtoType.expense, label: 'Despesa' },
  { value: CreateTransactionDtoType.income, label: 'Receita' },
  { value: CreateTransactionDtoType.transfer, label: 'Transferência' },
] as const

export const transactionSplitModeOptions = [
  { value: 'none' as const, label: 'Sem rateio' },
  { value: 'custom' as const, label: 'Com rateio' },
  { value: 'default' as const, label: 'Rateio padrão' },
] as const
