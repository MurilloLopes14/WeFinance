import type { CreateReleaseNoteDtoPublishedAt } from '@/api/generated/models/createReleaseNoteDtoPublishedAt'
import type { ReleaseNoteResponseDto } from '@/api/generated/models/releaseNoteResponseDto'
import type { ReleaseNoteResponseDtoPublishedAt } from '@/api/generated/models/releaseNoteResponseDtoPublishedAt'
import type { UpdateReleaseNoteDtoPublishedAt } from '@/api/generated/models/updateReleaseNoteDtoPublishedAt'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function getReleaseNotePublishedAtIso(
  value: ReleaseNoteResponseDtoPublishedAt | undefined,
): string | null {
  const raw = value as unknown
  if (typeof raw !== 'string' || raw.length === 0) return null
  return raw
}

export function isReleaseNotePublished(note: ReleaseNoteResponseDto): boolean {
  return getReleaseNotePublishedAtIso(note.publishedAt) !== null
}

export function formatReleaseNoteDate(value: string | null | undefined): string {
  if (!value) return 'Rascunho'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data inválida'
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function toCreatePublishedAt(
  publishNow: boolean,
): CreateReleaseNoteDtoPublishedAt | undefined {
  if (!publishNow) return undefined
  return new Date().toISOString() as unknown as CreateReleaseNoteDtoPublishedAt
}

export function toUpdatePublishedAt(
  publishNow: boolean,
  existingPublishedAt: string | null,
): UpdateReleaseNoteDtoPublishedAt {
  if (!publishNow) return null
  if (existingPublishedAt) {
    return existingPublishedAt as unknown as UpdateReleaseNoteDtoPublishedAt
  }
  return new Date().toISOString() as unknown as UpdateReleaseNoteDtoPublishedAt
}

export const releaseNoteCardGridClassName =
  'grid w-full auto-rows-min grid-cols-1 content-start items-start gap-3 sm:grid-cols-2 xl:grid-cols-3'
