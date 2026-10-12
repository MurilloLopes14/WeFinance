import { customInstance } from '@/api/axios-instance'

export type AccessTokenSummary = {
  id: string
  tokenType: 'mcp' | 'app'
  createdAt: string
  expiresAt: string
}

export type CreatedAccessToken = AccessTokenSummary & {
  token: string
}

export const accessTokensQueryKey = ['profile', 'access-tokens', 'mcp'] as const

export function listMyMcpTokens(signal?: AbortSignal) {
  return customInstance<AccessTokenSummary[]>({
    url: '/api/v1/users/me/access-tokens',
    method: 'GET',
    signal,
  })
}

export function createMyMcpToken() {
  return customInstance<CreatedAccessToken>({
    url: '/api/v1/users/me/access-tokens',
    method: 'POST',
  })
}

export function revokeMyMcpToken(tokenId: string) {
  return customInstance<void>({
    url: `/api/v1/users/me/access-tokens/${tokenId}`,
    method: 'DELETE',
  })
}
