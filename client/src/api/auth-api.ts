import { customInstance } from './axios-instance'
import type { MeResponseDto } from './generated/models/meResponseDto'
import type { UpdateOnboardingDto } from './generated/models/updateOnboardingDto'

export function fetchCurrentUser() {
  return customInstance<MeResponseDto>({
    url: '/api/v1/users/me',
    method: 'GET',
  })
}

export function updateUserOnboarding(payload: UpdateOnboardingDto) {
  return customInstance<MeResponseDto>({
    url: '/api/v1/users/me/onboarding',
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  })
}
