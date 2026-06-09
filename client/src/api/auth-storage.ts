import Cookies from 'js-cookie'

const ACCESS_TOKEN_KEY = 'wefinance_access_token'
const TOKEN_COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7,
  sameSite: 'lax',
  secure: import.meta.env.PROD,
  path: '/',
}

export function getAccessToken(): string | null {
  const token = Cookies.get(ACCESS_TOKEN_KEY)

  if (token) {
    return token
  }

  const legacyToken = localStorage.getItem(ACCESS_TOKEN_KEY)

  if (legacyToken) {
    setAccessToken(legacyToken)
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    return legacyToken
  }

  return null
}

export function setAccessToken(token: string): void {
  Cookies.set(ACCESS_TOKEN_KEY, token, TOKEN_COOKIE_OPTIONS)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function clearAccessToken(): void {
  Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' })
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken())
}
