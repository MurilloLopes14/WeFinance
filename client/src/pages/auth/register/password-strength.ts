export const passwordCriteria = [
  {
    id: 'length',
    label: '8 caracteres',
    test: (password: string) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Letra maiúscula',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'Letra minúscula',
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'Número',
    test: (password: string) => /\d/.test(password),
  },
  {
    id: 'symbol',
    label: 'Símbolo',
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const

export type PasswordStrengthTone =
  | 'empty'
  | 'weak'
  | 'fair'
  | 'good'
  | 'strong'

export function getPasswordStrength(password: string) {
  const results = passwordCriteria.map((criterion) => ({
    ...criterion,
    met: criterion.test(password),
  }))

  const metCount = results.filter((result) => result.met).length
  const score = (metCount / passwordCriteria.length) * 100

  let label = 'Digite uma senha'
  let tone: PasswordStrengthTone = 'empty'

  if (password.length > 0) {
    if (metCount <= 2) {
      label = 'Muito fraca'
      tone = 'weak'
    } else if (metCount === 3) {
      label = 'Razoável'
      tone = 'fair'
    } else if (metCount === 4) {
      label = 'Boa'
      tone = 'good'
    } else {
      label = 'Forte'
      tone = 'strong'
    }
  }

  return { score, results, label, tone, metCount }
}
