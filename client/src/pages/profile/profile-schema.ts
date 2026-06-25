import { z } from 'zod'

const MIN_AGE = 13

function parseBirthDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function getAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age
}

export const profileBasicInfoSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo'),
  email: z.string().trim().email('Informe um e-mail válido'),
  birthDate: z
    .string()
    .refine((value) => value.length === 0 || parseBirthDate(value) !== null, {
      message: 'Data inválida',
    })
    .refine((value) => {
      if (!value) return true
      const date = parseBirthDate(value)
      return date ? date <= new Date() : false
    }, {
      message: 'A data não pode ser no futuro',
    })
    .refine((value) => {
      if (!value) return true
      const date = parseBirthDate(value)
      return date ? getAge(date) >= MIN_AGE : false
    }, {
      message: `Você precisa ter pelo menos ${MIN_AGE} anos`,
    }),
  phoneNumber: z
    .string()
    .refine((value) => {
      if (!value.trim()) return true
      const digits = value.replace(/\D/g, '')
      return digits.length >= 10 && digits.length <= 15
    }, {
      message: 'Informe um telefone válido com DDD',
    }),
})

export type ProfileBasicInfoValues = z.infer<typeof profileBasicInfoSchema>

export const profilePasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type ProfilePasswordValues = z.infer<typeof profilePasswordSchema>
