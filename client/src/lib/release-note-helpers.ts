import type { ReleaseNoteResponseDto } from '@/api/generated/models/releaseNoteResponseDto'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function isReleaseNotePublished(note: ReleaseNoteResponseDto): boolean {
  return note.publishedAt != null && note.publishedAt !== ''
}

export function formatReleaseNoteDate(value: string | null | undefined): string {
  if (!value) return 'Rascunho'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data inválida'
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function toPublishedAtIso(publishNow: boolean): string | null {
  return publishNow ? new Date().toISOString() : null
}

export const releaseNoteCardGridClassName =
  'grid w-full auto-rows-min grid-cols-1 content-start items-start gap-3 sm:grid-cols-2 xl:grid-cols-3'
