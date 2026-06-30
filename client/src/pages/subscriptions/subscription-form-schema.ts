import { CreateSubscriptionDtoCadenceUnit } from '@/api/generated/models/createSubscriptionDtoCadenceUnit'
import { CreateSubscriptionDtoType } from '@/api/generated/models/createSubscriptionDtoType'
import { z } from 'zod'

export const subscriptionFormSchema = z.object({
  householdId: z.string().uuid('Selecione um grupo'),
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome do fixo')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  type: z.enum([CreateSubscriptionDtoType.expense, CreateSubscriptionDtoType.income]),
  amount: z
    .number({ error: 'Informe um valor válido' })
    .min(0.01, 'O valor deve ser maior que zero'),
  accountId: z.string().uuid('Selecione uma conta'),
  categoryId: z.string().optional().or(z.literal('')),
  hasPayee: z.boolean(),
  payeeId: z.string().optional().or(z.literal('')),
  cadenceUnit: z.enum([
    CreateSubscriptionDtoCadenceUnit.day,
    CreateSubscriptionDtoCadenceUnit.week,
    CreateSubscriptionDtoCadenceUnit.month,
    CreateSubscriptionDtoCadenceUnit.year,
  ]),
  cadenceEvery: z
    .number({ error: 'Informe um intervalo válido' })
    .int('O intervalo deve ser um número inteiro')
    .min(1, 'O intervalo deve ser no mínimo 1'),
  nextRunAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida'),
  active: z.boolean(),
  isInstallment: z.boolean(),
  installmentTotal: z
    .number({ error: 'Informe um número válido' })
    .int('O total deve ser um número inteiro')
    .min(1, 'Informe ao menos 1 parcela')
    .optional(),
}).superRefine((values, context) => {
  if (values.hasPayee && !values.payeeId) {
    context.addIssue({
      code: 'custom',
      path: ['payeeId'],
      message: 'Selecione um beneficiário',
    })
  }

  if (values.isInstallment && (!values.installmentTotal || values.installmentTotal < 1)) {
    context.addIssue({
      code: 'custom',
      path: ['installmentTotal'],
      message: 'Informe o total de parcelas',
    })
  }
})

export type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>

function getDefaultNextRunAt(): string {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

export const defaultSubscriptionFormValues: SubscriptionFormValues = {
  householdId: '',
  name: '',
  type: CreateSubscriptionDtoType.expense,
  amount: 0,
  accountId: '',
  categoryId: '',
  hasPayee: false,
  payeeId: '',
  cadenceUnit: CreateSubscriptionDtoCadenceUnit.month,
  cadenceEvery: 1,
  nextRunAt: getDefaultNextRunAt(),
  active: true,
  isInstallment: false,
  installmentTotal: undefined,
}

export const subscriptionTypeFormOptions = [
  { value: CreateSubscriptionDtoType.expense, label: 'Despesa' },
  { value: CreateSubscriptionDtoType.income, label: 'Receita' },
] as const

export const subscriptionCadenceUnitFormOptions = [
  { value: CreateSubscriptionDtoCadenceUnit.day, label: 'Dia' },
  { value: CreateSubscriptionDtoCadenceUnit.week, label: 'Semana' },
  { value: CreateSubscriptionDtoCadenceUnit.month, label: 'Mês' },
  { value: CreateSubscriptionDtoCadenceUnit.year, label: 'Ano' },
] as const
