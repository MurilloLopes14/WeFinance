import { DEFAULT_PRESET_COLOR } from '@/lib/color-helpers'
import { HouseholdResponseDtoDefaultSplitType } from '@/api/generated/models/householdResponseDtoDefaultSplitType'
import { z } from 'zod'

export const householdFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 caracteres')
    .max(80, 'O nome deve ter no máximo 80 caracteres'),
  currency: z.enum(['BRL', 'EUR', 'USD']),
  defaultSplitType: z.enum([
    HouseholdResponseDtoDefaultSplitType.equal,
    HouseholdResponseDtoDefaultSplitType.percent,
  ]),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Use uma cor no formato #RRGGBB')
    .optional()
    .or(z.literal('')),
  keepBudgets: z.boolean(),
})

export type HouseholdFormValues = z.infer<typeof householdFormSchema>

export const defaultHouseholdFormValues: HouseholdFormValues = {
  name: '',
  currency: 'BRL',
  defaultSplitType: HouseholdResponseDtoDefaultSplitType.equal,
  color: DEFAULT_PRESET_COLOR,
  keepBudgets: false,
}

export const currencyFormOptions = [
  { value: 'BRL', label: 'BRL — Real brasileiro' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — Dólar americano' },
] as const

export const splitTypeFormOptions = [
  { value: HouseholdResponseDtoDefaultSplitType.equal, label: 'Igualitário' },
  { value: HouseholdResponseDtoDefaultSplitType.percent, label: 'Percentual' },
] as const
