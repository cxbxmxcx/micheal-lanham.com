import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * Custom cursor — 8px amber dot + 32px trailing teal ring (120ms lag,
 * mix-blend screen). Ring expands to 56px with an optional label over
 * interactive elements (`a`, `button`, or `[data-cursor]`; label text via
 * `data-cursor-label`, e.g. "OPEN" / "LAUNCH" / "READ").
 *
 * Only enabled for a mouse-class pointer that can hover AND when the user
 * has not asked for reduced motion — the native cursor is hidden in
 * index.css under the exact same media query. Hides itself for touch/pen
 * input on hybrid devices, when the pointer leaves the window, and over
 * iframes (pointer events do not cross the frame boundary, so the ring
 * would otherwise freeze at the edge while the frame shows its own cursor).
 */
const QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

export default function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [label, setLabel] = useState('')

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 900, damping: 60, mass: 0.4 }) // ~120ms lag
  const ringY = useSpring(y, { stiffness: 900, damping: 60, mass: 0.4 })

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const apply = () => setEnabled(mq.matches)
    apply()
    if ('addEventListener' in mq) mq.addEventListener('change', apply)
    else (mq as MediaQueryList).addListener(apply)
    return () => {
      if ('removeEventListener' in mq) mq.removeEventListener('change', apply)
      else (mq as MediaQueryList).removeListener(apply)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        setVisible(false)
        return
      }
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
    }
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IFRAME') {
        setVisible(false)
        return
      }
      const t = target.closest('a, button, [role=button], [data-cursor]') as HTMLElement | null
      setHovering(!!t)
      setLabel(t?.dataset.cursorLabel ?? '')
    }
    const onOut = (e: MouseEvent) => {
      // relatedTarget is null when the pointer leaves the window entirely
      if (!e.relatedTarget) setVisible(false)
    }
    const onBlur = () => setVisible(false)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mouseout', onOut, { passive: true })
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mouseout', onOut)
      window.removeEventListener('blur', onBlur)
    }
  }, [enabled, x, y])

  if (!enabled) return null

  return (
    <>
      {/* 8px amber dot — follows immediately */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] h-2 w-2 rounded-full bg-amber"
        style={{ x, y, translateX: '-50%', translateY: '-50%', mixBlendMode: 'screen', opacity: visible ? 1 : 0 }}
      />
      {/* trailing teal ring */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] flex items-center justify-center rounded-full border border-teal"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%', mixBlendMode: 'screen' }}
        animate={{
          opacity: visible ? 1 : 0,
          width: hovering ? 56 : 32,
          height: hovering ? 56 : 32,
          borderColor: hovering ? 'rgba(224,155,74,0.9)' : 'rgba(62,158,150,0.8)',
        }}
        transition={{ duration: 0.2 }}
      >
        {label && (
          <span className="font-mono text-[0.5rem] font-medium tracking-[0.2em] text-amber">
            {label}
          </span>
        )}
      </motion.div>
    </>
  )
}
