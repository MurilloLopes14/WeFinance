import { useEffect, useRef, useState } from 'react'

type UseFadeInOptions = {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useFadeIn({
  threshold = 0.15,
  rootMargin = '0px 0px -8% 0px',
  triggerOnce = true,
}: UseFadeInOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) observer.disconnect()
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isVisible }
}
