import { z } from 'zod'

export const payeeFormSchema = z.object({
  householdId: z.string().min(1, 'Selecione um grupo'),
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome')
    .max(120, 'O nome deve ter no máximo 120 caracteres'),
  defaultCategoryId: z.string(),
  regexRule: z.string().max(200, 'A regra deve ter no máximo 200 caracteres'),
})

export type PayeeFormValues = z.infer<typeof payeeFormSchema>

export const defaultPayeeFormValues: PayeeFormValues = {
  householdId: '',
  name: '',
  defaultCategoryId: '',
  regexRule: '',
}
