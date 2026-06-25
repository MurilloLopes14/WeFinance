import type { UserResponseDto } from '@/api/generated/models/userResponseDto'

export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : ''
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function toBirthDateInputValue(birthDate?: string | null): string {
  if (!birthDate) return ''
  return birthDate.slice(0, 10)
}

export function toProfileBasicInfoValues(user: UserResponseDto) {
  return {
    name: user.name,
    email: user.email,
    birthDate: toBirthDateInputValue(user.birthDate),
    phoneNumber: user.phoneNumber ? formatPhoneInput(user.phoneNumber) : '',
  }
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp'
