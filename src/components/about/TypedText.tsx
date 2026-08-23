import { useEffect, useState } from 'react'
import { useReducedMotion } from './hooks'

interface TypedTextProps {
  text: string
  /** when true, typing begins */
  active: boolean
  /** characters per second (default 30) */
  charsPerSecond?: number
  /** ms to wait after `active` before typing (default 0) */
  delay?: number
  /** trailing blinking caret while typing (default true) */
  caret?: boolean
  className?: string
}

/**
 * Mono character-by-character type-on effect. With reduced motion the full
 * string renders immediately.
 */
export default function TypedText({
  text,
  active,
  charsPerSecond = 30,
  delay = 0,
  caret = true,
  className,
}: TypedTextProps) {
  const reduced = useReducedMotion()
  const [count, setCount] = useState(0)
  const shown = reduced && active ? text.length : count
  const done = shown >= text.length

  useEffect(() => {
    if (!active || reduced) return
    let interval: number | undefined
    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            if (interval !== undefined) window.clearInterval(interval)
            return c
          }
          return c + 1
        })
      }, 1000 / charsPerSecond)
    }, delay)
    return () => {
      window.clearTimeout(timeout)
      if (interval !== undefined) window.clearInterval(interval)
    }
  }, [active, reduced, text.length, charsPerSecond, delay])

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{text.slice(0, shown)}</span>
      {caret && !done && active && (
        <span aria-hidden className="animate-pulse-dot text-amber">
          ▍
        </span>
      )}
    </span>
  )
}
