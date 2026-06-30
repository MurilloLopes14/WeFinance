import { MeResponseDtoRole } from '@/api/generated/models/meResponseDtoRole'

export function isAdmin(role?: string): boolean {
  return role === MeResponseDtoRole.admin
}
