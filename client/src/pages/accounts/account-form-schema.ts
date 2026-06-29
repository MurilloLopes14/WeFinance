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

function validateCreditFields(
  values: {
    type: CreateAccountDtoType
    creditLimit?: string
    invoiceClosingDay?: string
  },
  context: z.RefinementCtx,
) {
  if (values.type !== CreateAccountDtoType.credit) return

  const limitTrimmed = values.creditLimit?.trim() ?? ''
  if (!limitTrimmed) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe o limite de crédito',
      path: ['creditLimit'],
    })
  } else {
    const limit = Number(limitTrimmed.replace(/\./g, '').replace(',', '.'))
    if (Number.isNaN(limit) || limit <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um limite maior que zero',
        path: ['creditLimit'],
      })
    }
  }

  const closingTrimmed = values.invoiceClosingDay?.trim() ?? ''
  if (!closingTrimmed) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe o dia de fechamento',
      path: ['invoiceClosingDay'],
    })
  } else {
    const closingDay = Number(closingTrimmed)
    if (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 28) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O fechamento deve ser entre 1 e 28',
        path: ['invoiceClosingDay'],
      })
    }
  }
}

const creditFieldsSchema = z.object({
  creditLimit: z.string().optional().or(z.literal('')),
  invoiceClosingDay: z.string().optional().or(z.literal('')),
})

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
  .merge(creditFieldsSchema)

function validateAccountFields(
  values: z.infer<typeof accountBaseFormSchema>,
  context: z.RefinementCtx,
) {
  validateInvestmentFields(values, context)
  validateCreditFields(values, context)
}

export const accountFormSchema = accountBaseFormSchema
  .extend({
    balanceManual: z
      .number({ error: 'Informe um saldo válido' })
      .min(0, 'O saldo não pode ser negativo'),
  })
  .superRefine(validateAccountFields)

export const accountEditFormSchema = accountBaseFormSchema.superRefine(
  validateAccountFields,
)

export type AccountFormValues = z.infer<typeof accountFormSchema>
export type AccountEditFormValues = z.infer<typeof accountEditFormSchema>

const investmentDefaultFields = {
  yieldPercent: '',
  yieldGranularity: '' as const,
  maturityDate: '',
}

const creditDefaultFields = {
  creditLimit: '',
  invoiceClosingDay: '',
}

export const defaultAccountFormValues: AccountFormValues = {
  householdId: '',
  name: '',
  type: CreateAccountDtoType.checking,
  institution: '',
  balanceManual: 0,
  color: DEFAULT_PRESET_COLOR,
  ...investmentDefaultFields,
  ...creditDefaultFields,
}

export const defaultAccountEditFormValues: AccountEditFormValues = {
  householdId: '',
  name: '',
  type: CreateAccountDtoType.checking,
  institution: '',
  color: DEFAULT_PRESET_COLOR,
  ...investmentDefaultFields,
  ...creditDefaultFields,
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

export function parseCreditLimitForApi(value: string | undefined): number | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const amount = Number(trimmed.replace(/\./g, '').replace(',', '.'))
  if (Number.isNaN(amount)) return undefined

  return amount
}

export function parseDayForApi(value: string | undefined): number | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const day = Number(trimmed)
  if (!Number.isInteger(day)) return undefined

  return day
}

type InvestmentPayloadInput = {
  type: CreateAccountDtoType
  yieldPercent?: string
  yieldGranularity?: CreateAccountDtoYieldGranularity | ''
  maturityDate?: string
}

type InvestmentPayload = {
  yieldPercent?: number
  yieldGranularity?: CreateAccountDtoYieldGranularity
  maturityDate?: string
}

type InvestmentClearPayload = {
  yieldPercent: null
  yieldGranularity: null
  maturityDate: null
}

export function buildInvestmentAccountPayload(
  values: InvestmentPayloadInput,
  options: { clearWhenNotInvestment: true },
): InvestmentPayload | InvestmentClearPayload
export function buildInvestmentAccountPayload(
  values: InvestmentPayloadInput,
  options?: { clearWhenNotInvestment?: boolean },
): InvestmentPayload
export function buildInvestmentAccountPayload(
  values: InvestmentPayloadInput,
  options?: { clearWhenNotInvestment?: boolean },
): InvestmentPayload | InvestmentClearPayload {
  if (values.type !== CreateAccountDtoType.investment) {
    if (options?.clearWhenNotInvestment) {
      return {
        yieldPercent: null,
        yieldGranularity: null,
        maturityDate: null,
      }
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

type CreditPayloadInput = {
  type: CreateAccountDtoType
  creditLimit?: string
  invoiceClosingDay?: string
}

type CreditPayload = {
  creditLimit?: number
  invoiceClosingDay?: number
}

type CreditClearPayload = {
  creditLimit: null
  invoiceClosingDay: null
  invoiceDueDay: null
}

export function buildCreditAccountPayload(
  values: CreditPayloadInput,
  options: { clearWhenNotCredit: true },
): CreditPayload | CreditClearPayload
export function buildCreditAccountPayload(
  values: CreditPayloadInput,
  options?: { clearWhenNotCredit?: boolean },
): CreditPayload
export function buildCreditAccountPayload(
  values: CreditPayloadInput,
  options?: { clearWhenNotCredit?: boolean },
): CreditPayload | CreditClearPayload {
  if (values.type !== CreateAccountDtoType.credit) {
    if (options?.clearWhenNotCredit) {
      return {
        creditLimit: null,
        invoiceClosingDay: null,
        invoiceDueDay: null,
      }
    }
    return {}
  }

  const creditLimit = parseCreditLimitForApi(values.creditLimit)
  const invoiceClosingDay = parseDayForApi(values.invoiceClosingDay)

  return {
    ...(creditLimit !== undefined && { creditLimit }),
    ...(invoiceClosingDay !== undefined && { invoiceClosingDay }),
  }
}
