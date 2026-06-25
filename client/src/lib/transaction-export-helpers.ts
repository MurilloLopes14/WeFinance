import { getCurrentMonthParam } from '@/lib/transaction-helpers'

export type TransactionExportParams = {
  from?: string
  to?: string
  type?: 'income' | 'expense' | 'transfer'
  accountId?: string
  status?: 'draft' | 'cleared' | 'reconciled'
}

export function monthParamToDateRange(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split('-').map(Number)
  if (!year || !monthNumber) {
    return getDefaultExportDateRange()
  }

  const lastDay = new Date(year, monthNumber, 0).getDate()
  const monthPart = String(monthNumber).padStart(2, '0')

  return {
    from: `${year}-${monthPart}-01`,
    to: `${year}-${monthPart}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function getDefaultExportDateRange(month = getCurrentMonthParam()): {
  from: string
  to: string
} {
  return monthParamToDateRange(month)
}

export function buildTransactionExportParams(
  range: { from: string; to: string },
  filters?: {
    type?: 'income' | 'expense' | 'transfer' | 'all'
    accountId?: string | 'all'
  },
): TransactionExportParams {
  const params: TransactionExportParams = {}

  if (range.from.trim()) params.from = range.from.trim()
  if (range.to.trim()) params.to = range.to.trim()
  if (filters?.type && filters.type !== 'all') params.type = filters.type
  if (filters?.accountId && filters.accountId !== 'all') {
    params.accountId = filters.accountId
  }

  return params
}

export function validateExportDateRange(from: string, to: string): string | null {
  if (!from && !to) return null

  if (from && to && from > to) {
    return 'A data inicial não pode ser posterior à data final.'
  }

  return null
}

function parseContentDispositionFilename(header?: string): string | null {
  if (!header) return null

  const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i.exec(header)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function triggerCsvDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function resolveCsvFilename(
  contentDisposition: string | undefined,
  params: TransactionExportParams,
): string {
  const fromHeader = parseContentDispositionFilename(contentDisposition)
  if (fromHeader) return fromHeader

  if (params.from && params.to) {
    return `transacoes-${params.from}-a-${params.to}.csv`
  }

  return `transacoes-${new Date().toISOString().slice(0, 10)}.csv`
}
