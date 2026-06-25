import { CreateAccountDtoType } from '@/api/generated/models/createAccountDtoType'
import { CreateAccountDtoYieldGranularity } from '@/api/generated/models/createAccountDtoYieldGranularity'
import { DEFAULT_PRESET_COLOR } from '@/lib/color-helpers'
import { z } from 'zod'

const yieldGranularitySchema = z.enum([
  CreateAccountDtoYieldGranularity.daily,
  CreateAccountDtoYieldGranularity.monthly,
  CreateAccountDtoYieldGranularity.annual,
])

const investmentFieldsSchema = z.object({
  yieldPercent: z.string().optional().or(z.literal('')),
  yieldGranularity: yieldGranularitySchema.optional().or(z.literal('')),
  maturityDate: z.string().optional().or(z.literal('')),
})

function validateInvestmentFields(
  values: {
    type: CreateAccountDtoType
    yieldPercent?: string
    yieldGranularity?: string
    maturityDate?: string
  },
  context: z.RefinementCtx,
) {
  if (values.type !== CreateAccountDtoType.investment) return

  const percentTrimmed = values.yieldPercent?.trim() ?? ''
  if (!percentTrimmed) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe o percentual de rendimento',
      path: ['yieldPercent'],
    })
  } else {
    const percent = Number(percentTrimmed.replace(',', '.'))
    if (Number.isNaN(percent) || percent <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um percentual maior que zero',
        path: ['yieldPercent'],
      })
    }
  }

  if (!values.yieldGranularity) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione a granularidade',
      path: ['yieldGranularity'],
    })
  }

  const maturityTrimmed = values.maturityDate?.trim() ?? ''
  if (!maturityTrimmed) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe a data de vencimento',
      path: ['maturityDate'],
    })
  }
}

const accountBaseFormSchema = z
  .object({
    householdId: z.string().uuid('Selecione um grupo'),
    name: z
      .string()
      .trim()
      .min(1, 'Informe o nome da conta')
      .max(100, 'O nome deve ter no máximo 100 caracteres'),
    type: z.enum([
      CreateAccountDtoType.checking,
      CreateAccountDtoType.savings,
      CreateAccountDtoType.credit,
      CreateAccountDtoType.cash,
      CreateAccountDtoType.investment,
    ]),
    institution: z
      .string()
      .trim()
      .max(100, 'A instituição deve ter no máximo 100 caracteres')
      .optional()
      .or(z.literal('')),
    color: z
      .string()
      .trim()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Use uma cor no formato #RRGGBB')
      .optional()
      .or(z.literal('')),
  })
  .merge(investmentFieldsSchema)

export const accountFormSchema = accountBaseFormSchema
  .extend({
    balanceManual: z
      .number({ error: 'Informe um saldo válido' })
      .min(0, 'O saldo não pode ser negativo'),
  })
  .superRefine(validateInvestmentFields)

export const accountEditFormSchema = accountBaseFormSchema.superRefine(
  validateInvestmentFields,
)

export type AccountFormValues = z.infer<typeof accountFormSchema>
export type AccountEditFormValues = z.infer<typeof accountEditFormSchema>

const investmentDefaultFields = {
  yieldPercent: '',
  yieldGranularity: '' as const,
  maturityDate: '',
}

export const defaultAccountFormValues: AccountFormValues = {
  householdId: '',
  name: '',
  type: CreateAccountDtoType.checking,
  institution: '',
  balanceManual: 0,
  color: DEFAULT_PRESET_COLOR,
  ...investmentDefaultFields,
}

export const defaultAccountEditFormValues: AccountEditFormValues = {
  householdId: '',
  name: '',
  type: CreateAccountDtoType.checking,
  institution: '',
  color: DEFAULT_PRESET_COLOR,
  ...investmentDefaultFields,
}

export const accountTypeFormOptions = [
  { value: CreateAccountDtoType.checking, label: 'Corrente' },
  { value: CreateAccountDtoType.savings, label: 'Poupança' },
  { value: CreateAccountDtoType.credit, label: 'Crédito' },
  { value: CreateAccountDtoType.cash, label: 'Dinheiro' },
  { value: CreateAccountDtoType.investment, label: 'Investimento' },
] as const

export function parseYieldPercentForApi(value: string | undefined): number | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const amount = Number(trimmed.replace(',', '.'))
  if (Number.isNaN(amount)) return undefined

  return amount
}

export function buildInvestmentAccountPayload(
  values: {
    type: CreateAccountDtoType
    yieldPercent?: string
    yieldGranularity?: string
    maturityDate?: string
  },
  options?: { clearWhenNotInvestment?: boolean },
) {
  if (values.type !== CreateAccountDtoType.investment) {
    if (options?.clearWhenNotInvestment) {
      return {
        yieldPercent: null,
        yieldGranularity: null,
        maturityDate: null,
      } as const
    }
    return {}
  }

  const yieldPercent = parseYieldPercentForApi(values.yieldPercent)
  const maturityDate = values.maturityDate?.trim() || undefined

  return {
    ...(yieldPercent !== undefined && { yieldPercent }),
    ...(values.yieldGranularity && { yieldGranularity: values.yieldGranularity }),
    ...(maturityDate && { maturityDate }),
  }
}
