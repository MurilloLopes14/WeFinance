export const HOUSEHOLD_INVITE_QUERY_PARAM = 'convite'

export function normalizeInviteCode(value: string): string {
  return value.replace(/\s/g, '').toUpperCase().slice(0, 12)
}

export function formatInviteCodeDisplay(code: string): string {
  const normalized = normalizeInviteCode(code)
  if (normalized.length <= 4) return normalized

  const mid = Math.ceil(normalized.length / 2)
  return `${normalized.slice(0, mid)} · ${normalized.slice(mid)}`
}

export function buildHouseholdInviteShareUrl(code: string): string {
  const normalized = normalizeInviteCode(code)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return `${origin}/dashboard/grupos?${HOUSEHOLD_INVITE_QUERY_PARAM}=${encodeURIComponent(normalized)}`
}

export function buildHouseholdInviteSharePayload(householdName: string, code: string) {
  const normalized = normalizeInviteCode(code)
  const url = buildHouseholdInviteShareUrl(normalized)

  const text = [
    `Entre no grupo "${householdName}" no WeFinance.`,
    `Código: ${normalized}`,
    url,
  ].join('\n')

  return {
    code: normalized,
    title: `Convite — ${householdName}`,
    text,
    url,
  }
}

export async function copyInviteCode(code: string): Promise<void> {
  await navigator.clipboard.writeText(normalizeInviteCode(code))
}

export async function shareHouseholdInvite(
  householdName: string,
  code: string,
): Promise<'shared' | 'copied'> {
  const payload = buildHouseholdInviteSharePayload(householdName, code)

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
    }
  }

  await navigator.clipboard.writeText(payload.text)
  return 'copied'
}
