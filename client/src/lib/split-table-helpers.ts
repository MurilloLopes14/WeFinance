import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import type { TransactionResponseDtoType } from '@/api/generated/models/transactionResponseDtoType'
import type { SplitPreviewDto } from '@/api/generated/models/splitPreviewDto'

export type SplitTableRow = {
  rowKey: string
  transactionId: string
  isFirstInGroup: boolean
  date: string
  description: string
  type: TransactionResponseDtoType
  transactionAmount: number
  memberUserId: string
  memberName: string
  share: number
  splitCategoryId?: string | null
  sharePercent: number
  splitPreview?: SplitPreviewDto | null
}

export function transactionHasSharedSplit(transaction: TransactionResponseDto): boolean {
  if (transaction.type === 'transfer') return false
  return (transaction.splits?.length ?? 0) > 1
}

export function buildMemberNameByUserId(
  transactions: TransactionResponseDto[],
  householdMemberNames: Record<string, string | undefined> = {},
): Record<string, string> {
  const map: Record<string, string> = {}

  for (const [userId, name] of Object.entries(householdMemberNames)) {
    if (name) map[userId] = name
  }

  for (const transaction of transactions) {
    for (const member of transaction.splitPreview?.members ?? []) {
      if (!map[member.id]) map[member.id] = member.name
    }
  }

  return map
}

export function flattenTransactionsToSplitRows(
  transactions: TransactionResponseDto[],
  memberNameByUserId: Record<string, string | undefined> | Record<string, string>,
): SplitTableRow[] {
  const rows: SplitTableRow[] = []

  for (const transaction of transactions) {
    if (!transactionHasSharedSplit(transaction)) continue

    const splits = transaction.splits ?? []
    const amount = Math.abs(transaction.amount)

    splits.forEach((split, index) => {
      rows.push({
        rowKey: `${transaction.id}-${split.id}`,
        transactionId: transaction.id,
        isFirstInGroup: index === 0,
        date: transaction.date,
        description: transaction.description?.trim() ?? '',
        type: transaction.type,
        transactionAmount: transaction.amount,
        memberUserId: split.userId,
        memberName: memberNameByUserId[split.userId] ?? 'Membro',
        share: split.share,
        splitCategoryId: split.categoryId,
        sharePercent: amount > 0 ? (split.share / amount) * 100 : 0,
        splitPreview: transaction.splitPreview ?? null,
      })
    })
  }

  return rows
}

export function filterSplitTableRows(
  rows: SplitTableRow[],
  search: string,
): SplitTableRow[] {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) return rows

  return rows.filter(
    (row) =>
      row.description.toLowerCase().includes(normalizedSearch) ||
      row.memberName.toLowerCase().includes(normalizedSearch),
  )
}
