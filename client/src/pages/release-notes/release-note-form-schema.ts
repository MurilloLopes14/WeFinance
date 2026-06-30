import { z } from 'zod'

export const releaseNoteFormSchema = z.object({
  version: z
    .string()
    .trim()
    .min(1, 'Informe a versão')
    .max(20, 'Máximo de 20 caracteres'),
  title: z
    .string()
    .trim()
    .min(1, 'Informe o título')
    .max(200, 'Máximo de 200 caracteres'),
  content: z.string().trim().min(1, 'Escreva o conteúdo da nota'),
  publishNow: z.boolean(),
})

export type ReleaseNoteFormValues = z.infer<typeof releaseNoteFormSchema>

export const defaultReleaseNoteFormValues: ReleaseNoteFormValues = {
  version: '',
  title: '',
  content: '',
  publishNow: true,
}
