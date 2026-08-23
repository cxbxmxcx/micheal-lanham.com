import { useEffect, useRef } from 'react'

/* ------------------------------------------------------------------ */
/* D5 — Dendrite Growth Canvas (Books header backdrop)                 */
/* Golden dendrite filaments (branching random-walk trees, ≤3 systems) */
/* grow slowly upward from the baseline. Growth is scroll-scrubbed:    */
/* the trees complete as the header scrolls from 90%→30% viewport,     */
/* then idle — tips shimmer (4s loops) and shed drifting sparks (2px,  */
/* 3s fade). Paused off-screen, DPR-capped at 2, static frame under    */
/* prefers-reduced-motion.                                             */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

interface Pt {
  x: number
  y: number
}

interface Branch {
  pts: Pt[]
  cum: number[] // cumulative length along pts
  len: number
  depth: number
  g0: number // global growth-ordering offset
}

interface Tree {
  branches: Branch[]
  tips: Pt[]
  total: number
}

function buildTree(w: number, h: number, seed: number): Tree {
  const rand = mulberry32(seed)
  const branches: Branch[] = []
  const tips: Pt[] = []
  const xs = [0.2, 0.52, 0.82] // ≤3 simultaneous dendrite systems

  function grow(x0: number, y0: number, angle0: number, budget: number, depth: number, g0: number) {
    const pts: Pt[] = [{ x: x0, y: y0 }]
    const cum: number[] = [0]
    const step = 3
    let x = x0
    let y = y0
    let a = angle0
    let len = 0
    while (len < budget) {
      a += (rand() - 0.5) * 0.35
      a += (-Math.PI / 2 - a) * 0.02 // gentle upward bias
      x += Math.cos(a) * step
      y += Math.sin(a) * step
      if (y < 8) break
      if (x < 4 || x > w - 4) break
      pts.push({ x, y })
      len += step
      cum.push(len)
      // branch 2–3 levels deep
      if (depth < 3 && len > 24 && rand() < 0.045) {
        const dir = rand() < 0.5 ? -1 : 1
        grow(x, y, a + dir * (0.5 + rand() * 0.6), (budget - len) * (0.35 + rand() * 0.3), depth + 1, g0 + len)
      }
    }
    branches.push({ pts, cum, len, depth, g0 })
    tips.push(pts[pts.length - 1])
  }

  for (let s = 0; s < xs.length; s++) {
    const x0 = w * xs[s] + (rand() - 0.5) * w * 0.06
    grow(x0, h - 6, -Math.PI / 2 + (rand() - 0.5) * 0.4, h * 0.72 * (0.85 + rand() * 0.3), 0, 0)
  }

  const total = branches.reduce((m, b) => Math.max(m, b.g0 + b.len), 0)
  return { branches, tips, total }
}

function strokePartial(ctx: CanvasRenderingContext2D, b: Branch, upto: number, width: number, strokeStyle: string) {
  if (upto <= 0) return
  ctx.beginPath()
  ctx.lineWidth = width
  ctx.strokeStyle = strokeStyle
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.moveTo(b.pts[0].x, b.pts[0].y)
  for (let i = 1; i < b.pts.length; i++) {
    if (b.cum[i] <= upto) {
      ctx.lineTo(b.pts[i].x, b.pts[i].y)
    } else {
      // interpolate the final partial segment
      const t = (upto - b.cum[i - 1]) / (b.cum[i] - b.cum[i - 1])
      ctx.lineTo(
        b.pts[i - 1].x + (b.pts[i].x - b.pts[i - 1].x) * t,
        b.pts[i - 1].y + (b.pts[i].y - b.pts[i - 1].y) * t,
      )
      break
    }
  }
  ctx.stroke()
}

function drawTree(ctx: CanvasRenderingContext2D, tree: Tree, progress: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const target = progress * tree.total
  for (const b of tree.branches) {
    const f = clamp01((target - b.g0) / b.len)
    if (f <= 0) continue
    const upto = f * b.len
    const base = b.depth === 0 ? 'rgba(194,112,60,' : 'rgba(224,155,74,' // copper trunks → amber filaments
    strokePartial(ctx, b, upto, 4, `${base}0.13)`) // ~8px soft glow halo
    strokePartial(ctx, b, upto, b.depth === 0 ? 1.5 : 1, `${base}0.92)`)
  }
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
}

export default function DendriteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const off = document.createElement('canvas')
    const octx = off.getContext('2d')!
    const rand = mulberry32(97)

    let W = 0
    let H = 0
    let tree: Tree | null = null
    let raf = 0
    let visible = false
    let displayed = reduced ? 1 : 0
    let lastDrawn = -1
    let sparks: Spark[] = []
    let last = performance.now()
    let spawnAcc = 0

    const rebuild = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      W = Math.max(1, rect.width)
      H = Math.max(1, rect.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      off.width = canvas.width
      off.height = canvas.height
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      octx.setTransform(dpr, 0, 0, dpr, 0, 0)
      tree = buildTree(W, H, 4242)
      sparks = []
      lastDrawn = -1
      if (reduced) {
        // static fallback: fully grown frame, no loop
        drawTree(octx, tree, 1)
        ctx.clearRect(0, 0, W, H)
        ctx.drawImage(off, 0, 0, W, H)
        for (const tip of tree.tips) {
          ctx.beginPath()
          ctx.fillStyle = 'rgba(224,155,74,0.5)'
          ctx.arc(tip.x, tip.y, 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!tree) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      // scroll-scrubbed growth: header 90%→30% viewport
      const r = canvas.getBoundingClientRect()
      const vh = window.innerHeight
      const target = clamp01((vh * 0.9 - r.top) / (vh * 0.6))
      displayed += (target - displayed) * 0.12
      if (Math.abs(displayed - target) < 0.0005) displayed = target

      if (Math.abs(displayed - lastDrawn) > 0.0004) {
        drawTree(octx, tree, displayed)
        lastDrawn = displayed
      }

      ctx.clearRect(0, 0, W, H)
      ctx.drawImage(off, 0, 0, W, H)

      const grown = displayed > 0.985

      // idle: tips shimmer on 4s loops
      if (grown) {
        const t = now / 1000
        for (let i = 0; i < tree.tips.length; i++) {
          const tip = tree.tips[i]
          const a = 0.3 + 0.25 * Math.sin((t * Math.PI * 2) / 4 + i * 1.7)
          ctx.beginPath()
          ctx.fillStyle = `rgba(224,155,74,${a.toFixed(3)})`
          ctx.arc(tip.x, tip.y, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }

        // idle: tips shed drifting sparks (2px, 3s fade)
        spawnAcc += dt
        if (spawnAcc > 0.14 && sparks.length < 26) {
          spawnAcc = 0
          const tip = tree.tips[Math.floor(rand() * tree.tips.length)]
          sparks.push({
            x: tip.x,
            y: tip.y,
            vx: (rand() - 0.5) * 12,
            vy: -8 - rand() * 14,
            age: 0,
            life: 3,
          })
        }
      }

      if (sparks.length) {
        sparks = sparks.filter((s) => (s.age += dt) < s.life)
        for (const s of sparks) {
          s.x += s.vx * dt
          s.y += s.vy * dt
          s.vx *= 0.995
          const a = 0.85 * (1 - s.age / s.life)
          ctx.beginPath()
          ctx.fillStyle = `rgba(224,155,74,${a.toFixed(3)})`
          ctx.arc(s.x, s.y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const nowVisible = entry.isIntersecting
        if (reduced) return
        if (nowVisible && !visible) {
          visible = true
          last = performance.now()
          raf = requestAnimationFrame(frame)
        } else if (!nowVisible && visible) {
          visible = false
          cancelAnimationFrame(raf)
          raf = 0
        }
      },
      { rootMargin: '120px 0px' },
    )

    rebuild()
    io.observe(canvas)

    let resizeTimer = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(rebuild, 180)
    })
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      window.clearTimeout(resizeTimer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-hidden
    />
  )
}
