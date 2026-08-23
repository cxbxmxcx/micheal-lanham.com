import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollToId } from '@/lib/scroll'

gsap.registerPlugin(ScrollTrigger)

const REDUCED = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------------ */
/* D1 — Neural Swarm Hero canvas                                       */
/* ~450 teal nodes (180 mobile) + ~6% amber spark nodes, flocking +    */
/* attraction field, cursor attractor / click repulsor, 3 parallax     */
/* depth layers, DPR-capped, pauses off-screen, reduced-motion static. */
/* ------------------------------------------------------------------ */

interface SwarmNode {
  x: number
  y: number
  vx: number
  vy: number
  z: number // depth layer: 0.5 | 0.75 | 1
  r: number
  amber: boolean
  speed: number
}

function makeGlowSprite(rgb: string): HTMLCanvasElement {
  const s = document.createElement('canvas')
  s.width = s.height = 64
  const c = s.getContext('2d')!
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, `rgba(${rgb},0.9)`)
  g.addColorStop(0.25, `rgba(${rgb},0.45)`)
  g.addColorStop(1, `rgba(${rgb},0)`)
  c.fillStyle = g
  c.fillRect(0, 0, 64, 64)
  return s
}

function NeuralSwarm() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = REDUCED()
    const tealSprite = makeGlowSprite('62,158,150')
    const amberSprite = makeGlowSprite('224,155,74')

    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let nodes: SwarmNode[] = []
    let raf = 0
    let visible = true
    // The "big bang" settle is measured in *animated* time, not wall-clock.
    // rAF is suspended in background tabs, so a page opened via ctrl-click and
    // visited later would otherwise skip the settle and crawl out of the clump.
    let animTime = 0
    let lastFrame = 0
    const mouse = { x: -9999, y: -9999, nx: 0, ny: 0, active: false }
    let repulseUntil = 0
    const shocks: { x: number; y: number; t: number }[] = []

    const size = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const build = () => {
      size()
      const count = w < 768 ? 180 : 450
      const zs = [0.5, 0.75, 1]
      nodes = Array.from({ length: count }, () => {
        const z = zs[Math.floor(Math.random() * 3)]
        const amber = Math.random() < 0.06
        // "big bang": start clustered at center, disperse outward over ~1.6s
        const ang = Math.random() * Math.PI * 2
        const burst = 0.6 + Math.random() * 1.6
        return {
          x: w / 2 + (Math.random() - 0.5) * 90,
          y: h / 2 + (Math.random() - 0.5) * 90,
          vx: Math.cos(ang) * burst,
          vy: Math.sin(ang) * burst,
          z,
          r: (amber ? 3 + Math.random() * 2 : 1.5 + Math.random() * 1.5) * z,
          amber,
          speed: (0.15 + Math.random() * 0.25) * z,
        }
      })
    }

    const drawFrame = (now: number) => {
      ctx.fillStyle = '#0A0908'
      ctx.fillRect(0, 0, w, h)

      // advance animated time by at most one "long frame" per call
      animTime += lastFrame ? Math.min(now - lastFrame, 50) : 16
      lastFrame = now
      const bang = Math.max(0, 1 - animTime / 1600) // 1 → 0 during settle
      const repulsing = now < repulseUntil
      const n = nodes.length

      // pair pass: edges + gentle mutual attraction/repulsion
      for (let i = 0; i < n; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < n; j++) {
          const b = nodes[j]
          const dx = b.x - a.x
          if (dx > 220 || dx < -220) continue
          const dy = b.y - a.y
          if (dy > 220 || dy < -220) continue
          const d2 = dx * dx + dy * dy
          const hasAmber = a.amber || b.amber
          const R = hasAmber ? 220 : 120
          if (d2 > R * R) continue
          const d = Math.sqrt(d2) || 0.001
          // force: repel when crowded, attract when near
          const f = (d < 40 ? -0.006 * (1 - d / 40) : 0.0016 * (1 - d / R)) / Math.max(a.z, b.z)
          const fx = (dx / d) * f
          const fy = (dy / d) * f
          a.vx += fx
          a.vy += fy
          b.vx -= fx
          b.vy -= fy
          // edge hairline, opacity scales with proximity
          const prox = 1 - d / R
          const alpha = prox * (hasAmber ? 0.4 : 0.35)
          if (alpha < 0.03) continue
          ctx.strokeStyle = hasAmber
            ? `rgba(194,112,60,${alpha.toFixed(3)})`
            : `rgba(62,158,150,${alpha.toFixed(3)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      // integrate nodes
      for (const nd of nodes) {
        // cursor field: attractor within 260px (0.02g), repulsor after pointer-down
        if (mouse.active) {
          const dx = mouse.x - nd.x
          const dy = mouse.y - nd.y
          const d2 = dx * dx + dy * dy
          if (d2 < 260 * 260 && d2 > 1) {
            const d = Math.sqrt(d2)
            const g = (repulsing ? -0.09 : 0.02) * nd.z
            nd.vx += (dx / d) * g
            nd.vy += (dy / d) * g
          }
        }
        // wander so clusters form, merge, dissolve
        nd.vx += (Math.random() - 0.5) * 0.02
        nd.vy += (Math.random() - 0.5) * 0.02
        // damp toward target drift speed (higher during the big-bang settle)
        const target = nd.speed * (1 + bang * 6)
        const sp = Math.hypot(nd.vx, nd.vy) || 0.001
        const k = sp > target ? target / sp : 1
        nd.vx *= k * 0.995
        nd.vy *= k * 0.995
        nd.x += nd.vx
        nd.y += nd.vy
        // soft wrap
        const m = 30
        if (nd.x < -m) nd.x = w + m
        else if (nd.x > w + m) nd.x = -m
        if (nd.y < -m) nd.y = h + m
        else if (nd.y > h + m) nd.y = -m
      }

      // parallax offsets per depth layer (deeper = less shift)
      const par = { 0.5: 8, 0.75: 16, 1: 28 } as Record<number, number>

      // draw nodes (glow sprite + core)
      for (const nd of nodes) {
        const off = par[nd.z]
        const px = nd.x + mouse.nx * off
        const py = nd.y + mouse.ny * off
        const sprite = nd.amber ? amberSprite : tealSprite
        const gs = nd.r * 8
        ctx.globalAlpha = (nd.amber ? 0.9 : 0.55) * nd.z
        ctx.drawImage(sprite, px - gs / 2, py - gs / 2, gs, gs)
        ctx.globalAlpha = Math.min(1, 0.8 * nd.z + 0.2)
        ctx.fillStyle = nd.amber ? '#E09B4A' : '#3E9E96'
        ctx.beginPath()
        ctx.arc(px, py, nd.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // shockwave rings (pointer-down)
      for (let i = shocks.length - 1; i >= 0; i--) {
        const s = shocks[i]
        const t = (now - s.t) / 500
        if (t >= 1) {
          shocks.splice(i, 1)
          continue
        }
        ctx.strokeStyle = `rgba(224,155,74,${(0.6 * (1 - t)).toFixed(3)})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(s.x, s.y, t * 140, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    const loop = (now: number) => {
      if (visible) drawFrame(now)
      raf = requestAnimationFrame(loop)
    }

    build()
    if (reduced) {
      // static frame fallback: disperse nodes, render once
      for (const nd of nodes) {
        nd.x = Math.random() * w
        nd.y = Math.random() * h
      }
      drawFrame(performance.now())
    } else {
      raf = requestAnimationFrame(loop)
    }
    // canvas fades in over 1200ms
    requestAnimationFrame(() => {
      canvas.style.opacity = '1'
    })

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(canvas)

    // Resize keeps the swarm: rescale node positions into the new box rather
    // than re-seeding (which snapped everything back to a centre clump).
    // Height-only wobble under ~120px is the mobile URL bar — ignore it.
    const onResize = () => {
      const rect = canvas.getBoundingClientRect()
      const dw = rect.width - w
      const dh = rect.height - h
      if (Math.abs(dw) < 1 && Math.abs(dh) < 120) return
      const sx = rect.width / (w || rect.width)
      const sy = rect.height / (h || rect.height)
      size()
      for (const nd of nodes) {
        nd.x *= sx
        nd.y *= sy
      }
    }
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.nx = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.ny = (e.clientY / window.innerHeight - 0.5) * 2
      mouse.active = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= w && mouse.y <= h
    }
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x < 0 || y < 0 || x > w || y > h) return
      repulseUntil = performance.now() + 600
      shocks.push({ x, y, t: performance.now() })
    }
    const onLeave = () => {
      mouse.active = false
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        transition: 'opacity 1200ms ease',
      }}
      aria-hidden
    />
  )
}

/* ------------------------------------------------------------------ */
/* D4 — animated stat counters                                         */
/* ------------------------------------------------------------------ */

const STATS: { value: number; suffix?: string; label: string }[] = [
  { value: 13, label: 'BOOKS PUBLISHED' },
  { value: 5, label: 'PUBLISHERS' },
  { value: 3, label: 'IN DEVELOPMENT' },
  { value: 20, suffix: '+', label: 'YEARS IN INDUSTRY' },
]

/* ------------------------------------------------------------------ */
/* Hero section                                                        */
/* ------------------------------------------------------------------ */

const H1_WORDS: { word: string; gradient: boolean }[] = [
  { word: 'Systems', gradient: false },
  { word: 'that', gradient: false },
  { word: 'learn,', gradient: true },
  { word: 'adapt,', gradient: true },
  { word: 'and', gradient: false },
  { word: 'improve', gradient: true },
  { word: 'themselves.', gradient: false },
]

const EYEBROW = 'AUTHOR · AI AGENTS · EVOLUTIONARY COMPUTATION'

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const swarmWrapRef = useRef<HTMLDivElement>(null)
  const eyebrowRef = useRef<HTMLSpanElement>(null)
  const ledeRef = useRef<HTMLParagraphElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const numRefs = useRef<(HTMLSpanElement | null)[]>([])
  const plusRef = useRef<HTMLSpanElement>(null)
  const tickRefs = useRef<(HTMLSpanElement | null)[]>([])

  /* Eyebrow mono scramble-decode (700ms, left → right, after 150ms) */
  useEffect(() => {
    const el = eyebrowRef.current
    if (!el) return
    if (REDUCED()) {
      el.textContent = EYEBROW
      return
    }
    const glyphs = '!<>-_\\/[]{}—=+*^?#'
    let iv = 0
    const timeout = window.setTimeout(() => {
      const t0 = performance.now()
      iv = window.setInterval(() => {
        const t = performance.now() - t0
        const resolved = Math.floor((t / 700) * EYEBROW.length)
        if (resolved >= EYEBROW.length) {
          el.textContent = EYEBROW
          clearInterval(iv)
          return
        }
        el.textContent = EYEBROW.split('')
          .map((c, i) =>
            i < resolved || c === ' ' || c === '·' ? c : glyphs[Math.floor(Math.random() * glyphs.length)],
          )
          .join('')
      }, 30)
    }, 150)
    return () => {
      clearTimeout(timeout)
      clearInterval(iv)
    }
  }, [])

  /* Entrance timeline (~1.9s) + D4 counters + scroll parallax */
  useEffect(() => {
    const reduced = REDUCED()
    const ctx = gsap.context(() => {
      const runCounters = () => {
        if (reduced) return
        STATS.forEach((s, i) => {
          const el = numRefs.current[i]
          if (!el) return
          const obj = { v: 0 }
          el.textContent = '0'
          gsap.to(obj, {
            v: s.value,
            duration: 1.4,
            delay: i * 0.12,
            ease: 'expo.out',
            onUpdate: () => {
              el.textContent = String(Math.round(obj.v))
            },
            onComplete: () => {
              if (s.suffix && plusRef.current) {
                gsap.fromTo(
                  plusRef.current,
                  { opacity: 0, scale: 1.4, color: '#E09B4A' },
                  { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' },
                )
              }
            },
          })
          const tick = tickRefs.current[i]
          if (tick) {
            gsap.fromTo(
              tick,
              { scaleX: 0 },
              { scaleX: 1, duration: 0.5, delay: i * 0.12, ease: 'expo.out', transformOrigin: 'left center' },
            )
          }
        })
      }

      if (reduced) {
        gsap.set('.hero-word', { y: 0, opacity: 1, filter: 'blur(0px)' })
        gsap.set([ledeRef.current, cueRef.current], { y: 0, opacity: 1 })
        gsap.set('.hero-cta', { y: 0, opacity: 1, scale: 1 })
        gsap.set(statsRef.current, { yPercent: 0 })
        gsap.set(tickRefs.current, { scaleX: 1 })
        if (plusRef.current) gsap.set(plusRef.current, { opacity: 1, scale: 1 })
      } else {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
        tl.fromTo(
          '.hero-word',
          { y: 60, opacity: 0, filter: 'blur(8px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.09 },
          0.35,
        )
          .fromTo(ledeRef.current, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.9)
          .fromTo(
            '.hero-cta',
            { y: 24, opacity: 0, scale: 0.94 },
            { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1 },
            1.15,
          )
          .fromTo(statsRef.current, { yPercent: 100 }, { yPercent: 0, duration: 0.7 }, 1.35)
          .fromTo(cueRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.5)
        tl.add(runCounters, 1.6)

        // scroll parallax: text lifts at ~0.35× and fades by 70% of viewport;
        // swarm persists at ~0.15×
        gsap.to(contentRef.current, {
          yPercent: -18,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: 'top top', end: '70% top', scrub: true },
        })
        gsap.to(swarmWrapRef.current, {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
        })
      }
    }, heroRef)
    return () => ctx.revert()
  }, [])

  /* tiny amber particle burst from a gradient word's baseline on hover */
  const burst = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (REDUCED()) return
    const rect = e.currentTarget.getBoundingClientRect()
    for (let i = 0; i < 9; i++) {
      const p = document.createElement('span')
      const x = rect.left + Math.random() * rect.width
      p.style.cssText = `position:fixed;left:${x}px;top:${rect.bottom - 4}px;width:3px;height:3px;border-radius:9999px;background:#E09B4A;pointer-events:none;z-index:60;box-shadow:0 0 6px rgba(224,155,74,0.8)`
      document.body.appendChild(p)
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.8
      const dist = 16 + Math.random() * 28
      p.animate(
        [
          { transform: 'translate(0,0)', opacity: 1 },
          {
            transform: `translate(${(Math.cos(ang) * dist).toFixed(1)}px, ${(Math.sin(ang) * dist).toFixed(1)}px)`,
            opacity: 0,
          },
        ],
        { duration: 400, easing: 'cubic-bezier(0.22,1,0.36,1)' },
      ).onfinish = () => p.remove()
    }
  }

  const go = (e: React.MouseEvent, hash: string) => {
    e.preventDefault()
    scrollToId(hash)
  }

  return (
    <section ref={heroRef} id="top" className="relative -mt-16 flex min-h-[100dvh] flex-col overflow-hidden">
      {/* Layer 0 — D1 swarm canvas */}
      <div ref={swarmWrapRef} className="absolute inset-0 z-0">
        <NeuralSwarm />
      </div>
      {/* Layer 1 — cinematic vignette. Was a 1.4 MB RGBA image; the same
          edge-darkening is a zero-byte gradient (warm near-black, ~92% alpha at
          the corners, clear in the centre). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 70% 62% at 50% 48%, rgba(12,11,9,0) 0%, rgba(12,11,9,0.35) 55%, rgba(14,12,10,0.78) 80%, rgba(13,11,10,0.92) 100%)',
        }}
      />

      {/* Layer 2 — content column */}
      <div
        ref={contentRef}
        className="container-x relative z-[2] flex flex-1 flex-col justify-center pb-[8vh] pt-28"
      >
        <div className="max-w-[920px]">
          <p className="kicker mb-6 flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-amber" aria-hidden />
            <span className="sr-only">{EYEBROW}</span>
            <span ref={eyebrowRef} aria-hidden>{EYEBROW}</span>
          </p>

          <h1 className="font-display text-[clamp(3rem,7.5vw,6.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
            {H1_WORDS.map(({ word, gradient }, i) => (
              <span key={i} className="hero-word inline-block will-change-transform">
                {gradient ? (
                  <span className="text-gradient" onMouseEnter={burst}>
                    {word}
                  </span>
                ) : (
                  word
                )}
                {i < H1_WORDS.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>

          <p ref={ledeRef} className="mt-8 max-w-[620px] text-lg leading-[1.7] text-muted">
            Micheal Lanham is a software and technology innovator with 20+ years across games, graphics, and
            machine intelligence — author of 13 books on AI, machine learning, and game development for Manning,
            O'Reilly, Apress, Packt, and BPB, most recently on AI agents, evolutionary deep learning, and
            generative systems, with three more in development. He works with teams on agent architecture
            reviews and AI agent training workshops.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#work" onClick={(e) => go(e, '#work')} className="hero-cta btn-amber" data-cursor data-cursor-label="OPEN">
              Work with me
            </a>
            <a
              href="#books"
              onClick={(e) => go(e, '#books')}
              className="hero-cta btn-ghost-teal"
              data-cursor
              data-cursor-label="READ"
            >
              Browse the books
            </a>
          </div>
        </div>
      </div>

      {/* Layer 4 — scroll cue */}
      <div
        ref={cueRef}
        className="absolute bottom-40 left-1/2 z-[2] flex -translate-x-1/2 flex-col items-center gap-2 sm:bottom-32"
      >
        <span className="font-mono text-[0.7rem] tracking-[0.2em] text-faint">SCROLL TO EVOLVE ▾</span>
        <span className="block h-10 w-px animate-cue-dash bg-amber/70" aria-hidden />
      </div>

      {/* Layer 3 — stats bar (D4) */}
      <div
        ref={statsRef}
        className="relative z-[3] w-full backdrop-blur-[10px]"
        style={{ background: 'rgba(15,14,12,0.66)' }}
      >
        <div className="hairline-filament absolute inset-x-0 top-0" />
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="group relative border-panel-line px-6 py-6 transition-colors duration-200 hover:bg-[rgba(224,155,74,0.05)] md:py-7 [&:nth-child(odd)]:border-r md:[&:not(:last-child)]:border-r max-md:[&:nth-child(-n+2)]:border-b"
            >
              <span
                ref={(el) => {
                  tickRefs.current[i] = el
                }}
                className="absolute left-0 top-0 block h-1 w-4 bg-amber"
                aria-hidden
              />
              <div className="font-display text-[clamp(2.25rem,4vw,3.25rem)] font-bold leading-none tracking-[-0.02em] text-ink transition-colors duration-200 group-hover:text-amber">
                <span className="sr-only">
                  {s.value}
                  {s.suffix ?? ''}
                </span>
                <span
                  ref={(el) => {
                    numRefs.current[i] = el
                  }}
                  aria-hidden
                >
                  {s.value}
                </span>
                {s.suffix && (
                  <span ref={plusRef} className="inline-block text-amber opacity-0" aria-hidden>
                    {s.suffix}
                  </span>
                )}
              </div>
              <div className="mt-2 font-mono text-[0.7rem] tracking-[0.2em] text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
