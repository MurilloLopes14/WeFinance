import { z } from 'zod'

export const joinHouseholdSchema = z.object({
  householdId: z
    .string()
    .trim()
    .min(1, 'Informe o código do grupo')
    .uuid('Código do grupo inválido'),
})

export type JoinHouseholdFormValues = z.infer<typeof joinHouseholdSchema>

export const defaultJoinHouseholdFormValues: JoinHouseholdFormValues = {
  householdId: '',
}
