function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function initIosPwaInputFix(): void {
  if (!isIosDevice() || !isStandalonePwa()) return

  document.documentElement.classList.add('ios-pwa')

  document.addEventListener(
    'touchstart',
    (event) => {
      const target = event.target

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        const type = target instanceof HTMLInputElement ? target.type : ''
        if (type === 'checkbox' || type === 'radio' || type === 'file') return

        target.focus({ preventScroll: false })
      }
    },
    { capture: true, passive: true },
  )
}
