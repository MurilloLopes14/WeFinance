import type { HouseholdMemberResponseDto } from '@/api/generated/models/householdMemberResponseDto'
import type { HouseholdResponseDtoDefaultSplitType } from '@/api/generated/models/householdResponseDtoDefaultSplitType'
import type { SplitInputDto } from '@/api/generated/models/splitInputDto'

export type TransactionSplitMode = 'none' | 'custom' | 'default'

export type CustomSplitFormEntry = {
  userId: string
  share: number
}

const SPLIT_TOTAL_TOLERANCE = 1

export function isSplitTotalValid(total: number, amount: number): boolean {
  return Math.abs(total - amount) <= SPLIT_TOTAL_TOLERANCE
}

function roundCurrency(value: number): number {
  return parseFloat(value.toFixed(2))
}

function splitEqually(amount: number, userIds: string[]): SplitInputDto[] {
  const count = userIds.length
  if (count === 0) return []

  const baseShare = roundCurrency(amount / count)

  return userIds.map((userId, index) => ({
    userId,
    share:
      index === count - 1
        ? roundCurrency(amount - baseShare * (count - 1))
        : baseShare,
  }))
}

function splitByPercent(
  amount: number,
  members: HouseholdMemberResponseDto[],
): SplitInputDto[] {
  const totalPercent = members.reduce((acc, member) => acc + member.splitValue, 0)

  if (totalPercent <= 0) {
    return splitEqually(
      amount,
      members.map((member) => member.userId),
    )
  }

  const shares = members.map((member) =>
    roundCurrency((amount * member.splitValue) / totalPercent),
  )
  const diff = roundCurrency(amount - shares.reduce((acc, share) => acc + share, 0))

  return members.map((member, index) => ({
    userId: member.userId,
    share: index === members.length - 1 ? roundCurrency(shares[index] + diff) : shares[index],
  }))
}

export function buildDefaultHouseholdSplits(
  amount: number,
  members: HouseholdMemberResponseDto[],
  defaultSplitType: HouseholdResponseDtoDefaultSplitType,
): SplitInputDto[] {
  if (members.length === 0 || amount <= 0) return []

  switch (defaultSplitType) {
    case 'percent':
      return splitByPercent(amount, members)
    case 'equal':
    default:
      return splitEqually(
        amount,
        members.map((member) => member.userId),
      )
  }
}

export function buildNoSplitShare(
  amount: number,
  currentUserId: string,
): SplitInputDto[] {
  if (!currentUserId || amount <= 0) return []

  return [{ userId: currentUserId, share: roundCurrency(amount) }]
}

export function buildCustomSplits(entries: CustomSplitFormEntry[]): SplitInputDto[] {
  return entries.map((entry) => ({
    userId: entry.userId,
    share: roundCurrency(entry.share),
  }))
}

export function sortMembersForSplit(
  members: HouseholdMemberResponseDto[],
  currentUserId?: string,
): HouseholdMemberResponseDto[] {
  return [...members].sort((left, right) => {
    if (currentUserId) {
      if (left.userId === currentUserId) return -1
      if (right.userId === currentUserId) return 1
    }

    return left.user.name.localeCompare(right.user.name, 'pt-BR')
  })
}

export function getInitialCustomSplitRows(
  members: HouseholdMemberResponseDto[],
  currentUserId?: string,
): CustomSplitFormEntry[] {
  const sorted = sortMembersForSplit(members, currentUserId)

  return sorted.slice(0, Math.min(2, sorted.length)).map((member) => ({
    userId: member.userId,
    share: 0,
  }))
}

export function resolveTransactionSplits(params: {
  splitMode: TransactionSplitMode
  amount: number
  currentUserId: string
  members: HouseholdMemberResponseDto[]
  defaultSplitType: HouseholdResponseDtoDefaultSplitType
  customSplits: CustomSplitFormEntry[]
}): SplitInputDto[] | undefined {
  const { splitMode, amount, currentUserId, members, defaultSplitType, customSplits } = params

  switch (splitMode) {
    case 'none':
      return buildNoSplitShare(amount, currentUserId)
    case 'custom':
      return buildCustomSplits(customSplits)
    case 'default':
      return buildDefaultHouseholdSplits(amount, members, defaultSplitType)
    default:
      return undefined
  }
}
