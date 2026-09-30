import { useEffect, useRef, useState } from 'react'

/**
 * Reveal an element the first time it scrolls into view.
 *
 * Coming from Vue: `useRef` is a template ref, and this `useEffect` is
 * `onMounted` plus `onUnmounted` in one — the returned function is the cleanup.
 * The empty dependency array is what makes it run once instead of every render.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  // Lazy initialiser rather than a setState inside the effect: where there is no
  // IntersectionObserver the content starts visible instead of flashing hidden
  // for one render before an effect corrects it.
  const [revealed, setRevealed] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, revealed }
}
