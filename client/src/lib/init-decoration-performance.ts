function syncTabHiddenState(): void {
  document.documentElement.toggleAttribute('data-tab-hidden', document.hidden)
}

/** Pausa animações decorativas quando a aba está em segundo plano. */
export function initDecorationPerformance(): void {
  syncTabHiddenState()
  document.addEventListener('visibilitychange', syncTabHiddenState)
}
