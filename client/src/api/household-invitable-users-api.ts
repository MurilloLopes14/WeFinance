import { customInstance } from '@/api/axios-instance'
import type { MemberUserDto } from '@/api/generated/models/memberUserDto'

export const invitableUsersQueryKey = (householdId: string, query: string) =>
  ['households', householdId, 'invitable-users', query] as const

export function searchHouseholdInvitableUsers(householdId: string, query: string) {
  return customInstance<MemberUserDto[]>({
    url: `/api/v1/households/${householdId}/invitable-users`,
    method: 'GET',
    params: { q: query },
  })
}
