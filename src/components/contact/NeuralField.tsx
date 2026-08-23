import { useEffect, useRef } from 'react'
import { useInViewport, useReducedMotion } from '@/components/about/hooks'

interface FieldNode {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

/**
 * Sparse ambient neural field behind the Contact transmission panel —
 * a dimmed (40%) mini version of the D1 hero swarm: ~80 teal nodes, one
 * amber spark, edges within a 100px radius, cursor gently attracts nodes.
 * Pauses off-screen, static frame under reduced motion, DPR-capped at 2.
 */
export default function NeuralField({ className }: { className?: string }) {
  const [wrapRef, inView] = useInViewport<HTMLDivElement>('160px')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const EDGE_R = 100
    const EDGE_R2 = EDGE_R * EDGE_R
    let w = 0
    let h = 0
    let raf = 0
    let last = performance.now()
    const pointer = { x: -9999, y: -9999 }

    const nodes: FieldNode[] = []
    const seed = () => {
      nodes.length = 0
      const count = Math.min(80, Math.max(36, Math.round((w * h) / 22000)))
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14,
          r: 1 + Math.random() * 1.4,
        })
      }
    }

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!nodes.length) seed()
    }

    const step = (t: number, advance: boolean) => {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      ctx.clearRect(0, 0, w, h)
      ctx.globalAlpha = 0.4 // dimmed so the transmission panel reads clearly

      // edges
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < EDGE_R2) {
            const k = 1 - Math.sqrt(d2) / EDGE_R
            ctx.strokeStyle = `rgba(62,158,150,${0.32 * k})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // nodes
      const sparkIndex = 0
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        if (advance) {
          // cursor attraction
          const dx = pointer.x - n.x
          const dy = pointer.y - n.y
          const d2 = dx * dx + dy * dy
          if (d2 < 160 * 160 && d2 > 1) {
            const d = Math.sqrt(d2)
            const f = (1 - d / 160) * 26
            n.vx += (dx / d) * f * dt
            n.vy += (dy / d) * f * dt
          }
          // gentle damping + drift
          n.vx *= 0.995
          n.vy *= 0.995
          const sp2 = n.vx * n.vx + n.vy * n.vy
          if (sp2 < 9) {
            n.vx += (Math.random() - 0.5) * 4 * dt
            n.vy += (Math.random() - 0.5) * 4 * dt
          }
          n.x += n.vx * dt
          n.y += n.vy * dt
          // wrap edges
          if (n.x < -10) n.x = w + 10
          else if (n.x > w + 10) n.x = -10
          if (n.y < -10) n.y = h + 10
          else if (n.y > h + 10) n.y = -10
        }

        if (i === sparkIndex) {
          const pulse = 0.65 + 0.35 * Math.sin(t / 600)
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 14)
          g.addColorStop(0, `rgba(224,155,74,${0.8 * pulse})`)
          g.addColorStop(1, 'rgba(224,155,74,0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(n.x, n.y, 14, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = `rgba(224,155,74,${pulse})`
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r + 0.6, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillStyle = 'rgba(62,158,150,0.85)'
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
    }
    const onPointerLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    if (reduced) {
      step(performance.now(), false)
    } else if (inView) {
      last = performance.now()
      const loop = (t: number) => {
        step(t, true)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      wrap.addEventListener('pointerleave', onPointerLeave)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      wrap.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [inView, reduced, wrapRef])

  return (
    <div ref={wrapRef} className={className} aria-hidden>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
    </div>
  )
}
