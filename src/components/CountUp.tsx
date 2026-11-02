import { useEffect, useRef } from 'react'
import { motionAllowed } from '@/lib/motion'

// A number that counts up, like an odometer, when it scrolls into view. The
// final value is always in the markup; screen readers read only that copy.
export default function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element || !motionAllowed() || !('IntersectionObserver' in window)) return
    const show = (n: number) => { element.textContent = `${n}${suffix}` }
    let frame = 0
    let observer: IntersectionObserver | undefined
    // Set up after hydration, in a task of its own (src/lib/motion.ts does the same).
    const timer = window.setTimeout(() => {
      show(0)
      const watch = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return
        watch.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1300)
          show(Math.round(value * (1 - Math.pow(1 - t, 3))))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      }, { rootMargin: '0px 0px -12% 0px' })
      watch.observe(element)
      observer = watch
    })
    return () => { window.clearTimeout(timer); observer?.disconnect(); cancelAnimationFrame(frame); show(value) }
  }, [value, suffix])
  return <><span ref={ref} aria-hidden="true">{`${value}${suffix}`}</span><span className="sr-only">{`${value}${suffix}`}</span></>
}
