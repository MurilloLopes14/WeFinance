import { CreateAccountDtoType } from '@/api/generated/models/createAccountDtoType'
import { DEFAULT_PRESET_COLOR } from '@/lib/color-helpers'
import { z } from 'zod'

export const accountFormSchema = z.object({
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
  balanceManual: z
    .number({ error: 'Informe um saldo válido' })
    .min(0, 'O saldo não pode ser negativo'),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Use uma cor no formato #RRGGBB')
    .optional()
    .or(z.literal('')),
})

export type AccountFormValues = z.infer<typeof accountFormSchema>

export const defaultAccountFormValues: AccountFormValues = {
  householdId: '',
  name: '',
  type: CreateAccountDtoType.checking,
  institution: '',
  balanceManual: 0,
  color: DEFAULT_PRESET_COLOR,
}

export const accountTypeFormOptions = [
  { value: CreateAccountDtoType.checking, label: 'Corrente' },
  { value: CreateAccountDtoType.savings, label: 'Poupança' },
  { value: CreateAccountDtoType.credit, label: 'Crédito' },
  { value: CreateAccountDtoType.cash, label: 'Dinheiro' },
  { value: CreateAccountDtoType.investment, label: 'Investimento' },
] as const
