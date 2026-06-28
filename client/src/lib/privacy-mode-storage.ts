const AMOUNTS_HIDDEN_KEY = 'wefinance.privacy.amountsHidden'

export function readAmountsHiddenPreference(): boolean {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(AMOUNTS_HIDDEN_KEY) === 'true'
  } catch {
    return false
  }
}

export function writeAmountsHiddenPreference(hidden: boolean): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(AMOUNTS_HIDDEN_KEY, hidden ? 'true' : 'false')
  } catch {
    // ignore quota / private mode errors
  }
}
