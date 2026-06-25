import { CategoryResponseDtoKind } from '@/api/generated/models/categoryResponseDtoKind'
import { DEFAULT_PRESET_COLOR } from '@/lib/color-helpers'
import { z } from 'zod'

export const categoryFormSchema = z
  .object({
    householdId: z.string().uuid('Selecione um grupo'),
    name: z
      .string()
      .trim()
      .min(1, 'Informe o nome da categoria')
      .max(100, 'O nome deve ter no máximo 100 caracteres'),
    kind: z.enum([
      CategoryResponseDtoKind.expense,
      CategoryResponseDtoKind.income,
      CategoryResponseDtoKind.transfer,
    ]),
    parentId: z.string().uuid().optional().or(z.literal('')),
    isFixed: z.boolean(),
    color: z
      .string()
      .trim()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Use uma cor no formato #RRGGBB')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((values, context) => {
    if (values.kind !== CategoryResponseDtoKind.expense && values.isFixed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Despesa fixa só se aplica a categorias do tipo despesa',
        path: ['isFixed'],
      })
    }
  })

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const defaultCategoryFormValues: CategoryFormValues = {
  householdId: '',
  name: '',
  kind: CategoryResponseDtoKind.expense,
  parentId: '',
  isFixed: false,
  color: DEFAULT_PRESET_COLOR,
}

export const kindFormOptions = [
  { value: CategoryResponseDtoKind.expense, label: 'Despesa' },
  { value: CategoryResponseDtoKind.income, label: 'Receita' },
  { value: CategoryResponseDtoKind.transfer, label: 'Transferência' },
] as const
