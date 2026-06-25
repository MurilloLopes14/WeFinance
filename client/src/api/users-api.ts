import { axiosInstance, customInstance } from './axios-instance'
import type { UserResponseDto } from './generated/models/userResponseDto'

export type UpdateUserPayload = {
  email?: string
  name?: string
  password?: string
  birthDate?: string
  phoneNumber?: string
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return customInstance<UserResponseDto>({
    url: `/api/v1/users/${id}`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  })
}

export function uploadUserAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return axiosInstance
    .post<UserResponseDto>('/api/v1/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(({ data }) => data)
}
