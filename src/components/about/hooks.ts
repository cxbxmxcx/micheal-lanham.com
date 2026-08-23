import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/** Live `prefers-reduced-motion` media query flag. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    if ('addEventListener' in mq) mq.addEventListener('change', onChange)
    else (mq as MediaQueryList).addListener(onChange)
    return () => {
      if ('removeEventListener' in mq) mq.removeEventListener('change', onChange)
      else (mq as MediaQueryList).removeListener(onChange)
    }
  }, [])
  return reduced
}

/**
 * IntersectionObserver visibility flag — used to pause canvas render loops
 * when their element is off-screen.
 */
export function useInViewport<T extends HTMLElement>(
  rootMargin = '120px',
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])
  return [ref, inView]
}
