import { customInstance } from '@/api/axios-instance'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'

export type JoinHouseholdPayload = {
  householdId: string
}

export function joinHousehold(payload: JoinHouseholdPayload) {
  return customInstance<HouseholdResponseDto>({
    url: '/households/join',
    method: 'POST',
    data: payload,
  })
}
