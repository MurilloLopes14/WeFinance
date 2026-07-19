import type { HouseholdMemberResponseDto } from '@/api/generated/models/householdMemberResponseDto'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'

export function isHouseholdOwner(
  members: HouseholdMemberResponseDto[] | undefined,
  userId: string | undefined,
): boolean {
  if (!members?.length || !userId) return false

  return members.some(
    (member) => member.userId === userId && member.role === 'owner',
  )
}

/** Owner or moderator — mirrors `assertAtLeastModerator` on the API. */
export function isHouseholdAtLeastModerator(
  members: HouseholdMemberResponseDto[] | undefined,
  userId: string | undefined,
): boolean {
  if (!members?.length || !userId) return false

  return members.some(
    (member) =>
      member.userId === userId &&
      (member.role === 'owner' || member.role === 'moderator'),
  )
}

export function getHouseholdOwnerFromList(
  members: HouseholdMemberResponseDto[] | undefined,
  userId: string | undefined,
): HouseholdMemberResponseDto | undefined {
  if (!members?.length || !userId) return undefined

  return members.find((member) => member.userId === userId)
}

const HOUSEHOLD_MEMBER_ROLE_LABELS: Record<
  HouseholdMemberResponseDto['role'],
  string
> = {
  owner: 'Proprietário',
  moderator: 'Moderador',
  member: 'Membro',
}

export function getHouseholdMemberRoleLabel(
  role: HouseholdMemberResponseDto['role'],
): string {
  return HOUSEHOLD_MEMBER_ROLE_LABELS[role]
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

export function findHouseholdInList(
  households: HouseholdResponseDto[] | undefined,
  householdId: string,
): HouseholdResponseDto | undefined {
  return households?.find((household) => household.id === householdId)
}

export function isOwnerOfAnyHousehold(
  households: HouseholdResponseDto[] | undefined,
  userId: string | undefined,
): boolean {
  if (!households?.length || !userId) return false

  return households.some((household) =>
    isHouseholdOwner(household.members, userId),
  )
}

export function canManageAnyHousehold(
  households: HouseholdResponseDto[] | undefined,
  userId: string | undefined,
): boolean {
  if (!households?.length || !userId) return false

  return households.some((household) =>
    isHouseholdAtLeastModerator(household.members, userId),
  )
}

/** True if the user belongs to the household with any role. */
export function isHouseholdMember(
  members: HouseholdMemberResponseDto[] | undefined,
  userId: string | undefined,
): boolean {
  if (!members?.length || !userId) return false

  return members.some((member) => member.userId === userId)
}

export function isMemberOfAnyHousehold(
  households: HouseholdResponseDto[] | undefined,
  userId: string | undefined,
): boolean {
  if (!households?.length || !userId) return false

  return households.some((household) =>
    isHouseholdMember(household.members, userId),
  )
}

export function getHouseholdNameMap(
  households: HouseholdResponseDto[] | undefined,
): Record<string, string> {
  return Object.fromEntries(
    (households ?? []).map((household) => [household.id, household.name]),
  )
}

export function filterMembersByQuery(
  members: HouseholdMemberResponseDto[],
  query: string,
): HouseholdMemberResponseDto[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return members

  return members.filter(
    (member) =>
      member.user.name.toLowerCase().includes(normalized) ||
      member.user.email.toLowerCase().includes(normalized),
  )
}

export function getMemberDisplayName(
  members: HouseholdMemberResponseDto[],
  userId: string,
): string | undefined {
  return members.find((member) => member.userId === userId)?.user.name
}
