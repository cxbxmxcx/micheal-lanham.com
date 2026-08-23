import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion'
import TypedText from './TypedText'
import { useInViewport, useReducedMotion } from './hooks'

/* ------------------------------------------------------------------ */
/* Living overlay canvas — 20–30 amber/teal particles slowly orbiting  */
/* the head region (8–14s loops, 1.5px, 0.5 alpha). Pauses off-screen, */
/* static frame under reduced motion, DPR-capped at 2.                 */
/* ------------------------------------------------------------------ */

interface Orbiter {
  angle: number
  speed: number // rad/s
  rx: number // ellipse radii, fraction of canvas size
  ry: number
  cx: number // ellipse center, fractions
  cy: number
  r: number
  amber: boolean
  alpha: number
  wobble: number
}

function makeOrbiters(): Orbiter[] {
  const rand = (a: number, b: number) => a + Math.random() * (b - a)
  return Array.from({ length: 26 }, () => {
    const period = rand(8, 14) // seconds per loop
    return {
      angle: rand(0, Math.PI * 2),
      speed: ((Math.PI * 2) / period) * (Math.random() > 0.5 ? 1 : -1),
      rx: rand(0.16, 0.34),
      ry: rand(0.1, 0.22),
      cx: 0.5 + rand(-0.06, 0.06),
      cy: 0.3 + rand(-0.05, 0.05), // head region — upper third
      r: rand(1, 1.8),
      amber: Math.random() < 0.6,
      alpha: rand(0.25, 0.5),
      wobble: rand(0, Math.PI * 2),
    }
  })
}

function OrbitCanvas() {
  const [wrapRef, inView] = useInViewport<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const orbiters = makeOrbiters()
    let w = 0
    let h = 0
    let raf = 0
    let last = performance.now()

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (t: number, advance: boolean) => {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      ctx.clearRect(0, 0, w, h)
      for (const o of orbiters) {
        if (advance) o.angle += o.speed * dt
        const wob = Math.sin(t / 1200 + o.wobble) * 0.02
        const x = (o.cx + wob) * w + Math.cos(o.angle) * o.rx * w
        const y = (o.cy + wob) * h + Math.sin(o.angle) * o.ry * h
        ctx.beginPath()
        ctx.arc(x, y, o.r, 0, Math.PI * 2)
        ctx.fillStyle = o.amber
          ? `rgba(224,155,74,${o.alpha})`
          : `rgba(62,158,150,${o.alpha})`
        ctx.fill()
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    if (reduced) {
      draw(performance.now(), false)
    } else if (inView) {
      last = performance.now()
      const loop = (t: number) => {
        draw(t, true)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [inView, reduced, wrapRef])

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0" aria-hidden>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Portrait panel — holographic frame, clip-reveal entrance, subtle    */
/* mouse parallax (±10px, 0.06 lerp), pulsing amber glow, caption bar. */
/* ------------------------------------------------------------------ */

export default function PortraitPanel() {
  const reduced = useReducedMotion()
  const tx = useRef(0)
  const ty = useRef(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // manual 0.06 lerp toward the pointer target (spec: ±10px, 0.06 lerp)
  useAnimationFrame(() => {
    if (reduced) return
    const dx = tx.current - x.get()
    const dy = ty.current - y.get()
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return
    x.set(x.get() + dx * 0.06)
    y.set(y.get() + dy * 0.06)
  })

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    tx.current = nx * 20 // ±10px
    ty.current = ny * 20
  }
  const onPointerLeave = () => {
    tx.current = 0
    ty.current = 0
  }

  return (
    <motion.figure
      className="holo-panel holo-ticks group relative overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      initial={
        reduced
          ? { opacity: 0 }
          : { opacity: 0, clipPath: 'inset(12% 12% 12% 12%)' }
      }
      whileInView={
        reduced
          ? { opacity: 1 }
          : { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }
      }
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative aspect-[900/1100] overflow-hidden">
        <motion.img
          src="/about-portrait.webp"
          alt="Abstract portrait of Micheal Lanham formed from amber dendrite filaments and drifting golden particles, with a faint teal network constellation inside the silhouette"
          className="h-full w-full scale-110 object-cover"
          style={reduced ? undefined : { x, y }}
          loading="lazy"
          decoding="async"
        />

        {/* soft radial amber glow, pulsing 5s at 15% opacity */}
        <div
          aria-hidden
          className="animate-glow-pulse pointer-events-none absolute left-1/2 top-[30%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
          style={{
            background:
              'radial-gradient(circle, rgba(224,155,74,0.55) 0%, rgba(194,112,60,0.25) 45%, transparent 70%)',
            animationDuration: '5s',
          }}
        />

        <OrbitCanvas />

        {/* caption bar */}
        <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-panel-line bg-void/70 px-4 py-3 backdrop-blur-[6px]">
          <TypedText
            text="MICHEAL LANHAM — CALGARY, ALBERTA, CANADA"
            active
            delay={1000}
            charsPerSecond={34}
            caret={false}
            className="font-mono text-[0.7rem] tracking-[0.04em] text-faint"
          />
        </figcaption>
      </div>
    </motion.figure>
  )
}
