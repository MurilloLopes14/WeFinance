import { axiosInstance } from './axios-instance'
import {
  resolveCsvFilename,
  triggerCsvDownload,
  type TransactionExportParams,
} from '@/lib/transaction-export-helpers'

export async function downloadTransactionsCsv(
  householdId: string,
  params: TransactionExportParams,
): Promise<void> {
  const response = await axiosInstance.get<Blob>(
    `/api/v1/households/${householdId}/transactions/report/export`,
    {
      params,
      responseType: 'blob',
    },
  )

  const blob = response.data

  if (blob.type.includes('application/json')) {
    const text = await blob.text()
    const payload = JSON.parse(text) as { message?: string | string[] }
    const message = Array.isArray(payload.message) ? payload.message[0] : payload.message
    throw new Error(message ?? 'Não foi possível exportar as transações.')
  }

  const filename = resolveCsvFilename(
    response.headers['content-disposition'],
    params,
  )

  triggerCsvDownload(blob, filename)
}
