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

export const registerFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Informe seu nome completo'),
    email: z
      .string()
      .trim()
      .email('Informe um e-mail válido'),
    birthDate: z
      .string()
      .min(1, 'Selecione sua data de nascimento')
      .refine((value) => parseBirthDate(value) !== null, {
        message: 'Data inválida',
      })
      .refine((value) => {
        const date = parseBirthDate(value)
        return date ? date <= new Date() : false
      }, {
        message: 'A data não pode ser no futuro',
      })
      .refine((value) => {
        const date = parseBirthDate(value)
        return date ? getAge(date) >= MIN_AGE : false
      }, {
        message: `Você precisa ter pelo menos ${MIN_AGE} anos`,
      }),
    phoneNumber: z
      .string()
      .trim()
      .refine((value) => {
        const digits = value.replace(/\D/g, '')
        return digits.length >= 10 && digits.length <= 15
      }, {
        message: 'Informe um telefone válido com DDD',
      }),
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof registerFormSchema>

export const registerStepFields = [
  ['name'],
  ['email'],
  ['birthDate'],
  ['phoneNumber'],
  ['password', 'confirmPassword'],
] as const

export const registerSteps = [
  {
    id: 'name',
    title: 'Como podemos te chamar?',
    description: 'Seu nome aparecerá no perfil e nas finanças compartilhadas.',
    placeholder: 'Ex.: Maria Silva',
  },
  {
    id: 'email',
    title: 'Qual é o seu e-mail?',
    description: 'Usaremos para login e recuperação de conta.',
    placeholder: 'voce@email.com',
  },
  {
    id: 'birthDate',
    title: 'Quando você nasceu?',
    description: 'Ajuda a personalizar insights e metas financeiras.',
    placeholder: 'Selecione a data',
  },
  {
    id: 'phoneNumber',
    title: 'Seu número de telefone',
    description: 'Usado para alertas e verificação da sua conta.',
    placeholder: '(11) 99999-9999',
  },
  {
    id: 'password',
    title: 'Crie uma senha segura',
    description: 'Use pelo menos 8 caracteres para proteger sua conta.',
    placeholder: '••••••••',
  },
] as const
