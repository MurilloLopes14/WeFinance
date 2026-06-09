import { customInstance } from './axios-instance'
import type { UserResponseDto } from './generated/models/userResponseDto'

export function fetchCurrentUser() {
  return customInstance<UserResponseDto>({
    url: '/api/v1/users/me',
    method: 'GET',
  })
}
