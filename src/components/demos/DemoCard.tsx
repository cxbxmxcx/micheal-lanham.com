import { useEffect, useMemo, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion'
import { cn } from '@/lib/utils'

export interface DemoSpec {
  id: string
  index: string
  title: string
  description: string
  poster: string
  /** directory of the Unity WebGL build, root-relative (served from public/demos) */
  src: string
}

const BOOT_LINES: { text: string; tone: 'info' | 'ok' }[] = [
  { text: '> resolving unity-runtime …', tone: 'info' },
  { text: '> streaming ~5 MB …', tone: 'info' },
  { text: '> wasm ready', tone: 'ok' },
]

/** If the iframe has not reported load within this long, offer a retry. */
const LOAD_TIMEOUT_MS = 45_000

/** Typed boot log shown while the iframe streams in. Reduced-motion: full log instantly. */
function BootLog({ reduce }: { reduce: boolean }) {
  const total = BOOT_LINES.reduce((n, l) => n + l.text.length, 0)
  const [chars, setChars] = useState(reduce ? total : 0)

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      setChars((c) => {
        if (c >= total) {
          window.clearInterval(id)
          return c
        }
        return c + 1
      })
    }, 28)
    return () => window.clearInterval(id)
  }, [reduce, total])

  const shownLines = useMemo(() => {
    const out: string[] = []
    let rem = chars
    for (const l of BOOT_LINES) {
      out.push(l.text.slice(0, Math.max(0, rem)))
      rem -= l.text.length
    }
    return out
  }, [chars])

  return (
    <div className="font-mono text-[0.72rem] leading-[1.9]" aria-hidden>
      {BOOT_LINES.map((l, i) => {
        const shown = shownLines[i]
        if (!shown) return null
        const typing = shown.length < l.text.length
        return (
          <p key={l.text} className={cn(l.tone === 'ok' ? 'text-code-green' : 'text-code-blue')}>
            <span className="text-amber">{shown.slice(0, 1)}</span>
            {shown.slice(1)}
            {typing && <span className="ml-0.5 inline-block h-3 w-2 animate-pulse bg-amber align-middle" />}
          </p>
        )
      })}
      {chars >= total && <span className="inline-block h-3 w-2 animate-pulse bg-amber" />}
    </div>
  )
}

interface DemoCardProps {
  spec: DemoSpec
  /** card position in the 3-col grid, drives the entrance depth */
  side: 'left' | 'middle' | 'right'
  /** entrance stagger index */
  order: number
  /** whether this card's demo is the one allowed to run */
  active: boolean
  onLaunch: (id: string) => void
  onClose: (id: string) => void
}

/**
 * D6 — one holographic demo frame. Idle poster with scan sweep → click to
 * lazy-mount the Unity WebGL iframe behind a typed boot log → live state with
 * RUNNING chip and close control. Closing restores the poster with a brief
 * glitch flicker. Tilt is transform-only (±5° spring toward cursor) and is
 * released while the demo runs so the WebGL canvas renders untransformed.
 *
 * The Unity builds are a fixed 1050×600 canvas, so the parent grid widens the
 * active card to the full row (see Demos.tsx) and the viewport switches to a
 * 7:4 aspect that fits the canvas without cropping.
 */
export default function DemoCard({ spec, side, order, active, onLaunch, onClose }: DemoCardProps) {
  const reduce = useReducedMotion()
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [glitch, setGlitch] = useState(0)
  const [closedNote, setClosedNote] = useState(false)
  const launchRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const state: 'idle' | 'loading' | 'live' = active ? (loaded ? 'live' : 'loading') : 'idle'

  // when a running demo unloads back to idle: reset and replay the glitch
  // flicker (render-adjustment pattern — no cascading effect setState)
  const [prevActive, setPrevActive] = useState(active)
  if (prevActive !== active) {
    setPrevActive(active)
    if (prevActive && !active) {
      setLoaded(false)
      setTimedOut(false)
      if (!reduce) setGlitch((g) => g + 1) // re-keys the poster → replays the flicker
    }
    if (!prevActive && active) {
      setClosedNote(false)
    }
  }

  // load watchdog — a build that never fires onLoad must still be dismissable
  useEffect(() => {
    if (state !== 'loading') return
    const id = window.setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(id)
  }, [state])

  // The wrapper page posts {type:'unity-ready'} once the Unity build has
  // actually streamed in (its onLoad fires after a few KB of HTML, long before
  // the ~5 MB build). Fall back to a timer after onLoad in case the message
  // never arrives, so a working build is never left hidden.
  useEffect(() => {
    if (!active) return
    const onMsg = (e: MessageEvent) => {
      if (e.source === iframeRef.current?.contentWindow && e.data?.type === 'unity-ready') setLoaded(true)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [active])
  const fallbackRef = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(fallbackRef.current), [])
  const onFrameLoad = () => {
    window.clearTimeout(fallbackRef.current)
    fallbackRef.current = window.setTimeout(() => setLoaded(true), 12_000)
  }

  // live status for assistive tech, derived from state (no effect needed)
  const status =
    state === 'loading'
      ? `Loading ${spec.title}…`
      : state === 'live'
        ? `${spec.title} is running.`
        : closedNote
          ? `${spec.title} closed.`
          : ''

  // focus follows the control that makes sense for the new state
  useEffect(() => {
    if (state === 'loading') requestAnimationFrame(() => closeRef.current?.focus())
    else if (state === 'live') requestAnimationFrame(() => iframeRef.current?.focus())
  }, [state])

  const close = () => {
    onClose(spec.id)
    setClosedNote(true)
    requestAnimationFrame(() => launchRef.current?.focus())
  }

  const retry = () => {
    setTimedOut(false)
    setLoaded(false)
    onClose(spec.id)
    requestAnimationFrame(() => onLaunch(spec.id))
  }

  // cursor tilt (transform-only, spring) — precise pointers, full motion, idle only
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(my, { stiffness: 180, damping: 18 })
  const rotateY = useSpring(mx, { stiffness: 180, damping: 18 })

  useEffect(() => {
    if (state !== 'idle') {
      mx.set(0)
      my.set(0)
    }
  }, [state, mx, my])

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (state !== 'idle' || reduce || !window.matchMedia('(pointer: fine)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    mx.set(px * 5)
    my.set(-py * 5)
  }
  const onMouseLeave = () => {
    mx.set(0)
    my.set(0)
  }

  const standaloneHref = `${spec.src}index.html`

  return (
    <motion.article
      layout
      className={cn(active && 'md:order-first md:col-span-3')}
      initial={
        reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: 64,
              z: -120,
              rotateY: side === 'left' ? 2 : side === 'right' ? -2 : 0,
            }
      }
      whileInView={{ opacity: 1, y: 0, z: 0, rotateY: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.85, delay: order * 0.14, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="demo-tilt group relative h-full"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div
          className={cn(
            'demo-holo relative flex h-full flex-col overflow-hidden rounded-card transition-shadow duration-300',
            state === 'live' && 'shadow-glow-amber-lg',
          )}
        >
          {/* one always-mounted live region so state changes are announced */}
          <span role="status" aria-live="polite" className="sr-only">
            {status}
          </span>

          {/* ── viewport area: 16:10 idle, 7:4 (= 1050:600) while running ── */}
          <div
            className={cn(
              'relative w-full overflow-hidden bg-void',
              active ? 'aspect-[7/4]' : 'aspect-[16/10]',
            )}
          >
            {/* poster */}
            <div
              key={glitch}
              className={cn('absolute inset-0', glitch > 0 && 'demo-glitch')}
            >
              <img
                src={spec.poster}
                alt=""
                loading="lazy"
                width={960}
                height={600}
                className={cn(
                  'h-full w-full object-cover transition-all duration-500',
                  state === 'loading' && 'opacity-40',
                  state === 'live' && 'opacity-0',
                  state === 'idle' && 'group-hover:brightness-110',
                )}
              />
            </div>

            {/* scanline overlay */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'repeating-linear-gradient(0deg, rgba(242,237,228,0.04) 0px, rgba(242,237,228,0.04) 1px, transparent 1px, transparent 4px)',
              }}
              aria-hidden
            />

            {/* hologram refresh sweep (idle) */}
            {state === 'idle' && (
              <div className="demo-scan grad-filament pointer-events-none absolute left-0 h-px w-full" aria-hidden />
            )}

            {/* corner ticks — amber, teal while running */}
            {(['top-2 left-2 border-t border-l', 'top-2 right-2 border-t border-r', 'bottom-2 left-2 border-b border-l', 'bottom-2 right-2 border-b border-r'] as const).map(
              (pos) => (
                <span
                  key={pos}
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute h-3 w-3 transition-colors duration-300',
                    pos,
                    state === 'live' ? 'border-teal' : 'border-amber/80',
                  )}
                />
              ),
            )}

            {/* idle: launch button */}
            {state === 'idle' && (
              <button
                ref={launchRef}
                type="button"
                onClick={() => onLaunch(spec.id)}
                data-cursor
                data-cursor-label="LAUNCH"
                aria-label={`Launch ${spec.title}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber bg-void/70 px-6 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-amber backdrop-blur-sm transition-all duration-200 hover:bg-amber hover:text-void hover:shadow-glow-amber-lg"
              >
                Launch ▶
              </button>
            )}

            {/* loading: boot log + progress hairline (+ retry after the watchdog) */}
            {state === 'loading' && (
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                {timedOut ? (
                  <p className="mb-3 font-mono text-[0.75rem] leading-relaxed text-muted">
                    Still loading. The build is ~5 MB — on a slow connection give it a moment, or{' '}
                    <button type="button" onClick={retry} className="text-amber underline underline-offset-4">
                      retry
                    </button>
                    .
                  </p>
                ) : (
                  <BootLog reduce={!!reduce} />
                )}
                <div className="mt-3 h-px w-full bg-panel-line">
                  <motion.div
                    className="h-full bg-amber"
                    initial={{ width: '0%' }}
                    animate={{ width: loaded ? '100%' : '82%' }}
                    transition={
                      loaded
                        ? { duration: 0.25, ease: 'easeOut' }
                        : { duration: 2.4, ease: [0.22, 1, 0.36, 1] }
                    }
                  />
                </div>
              </div>
            )}

            {/* the actual Unity WebGL build — mounts only after launch click */}
            {active && (
              <iframe
                ref={iframeRef}
                src={standaloneHref}
                title={spec.title}
                onLoad={onFrameLoad}
                className={cn(
                  'absolute inset-0 h-full w-full border-0 transition-opacity duration-400',
                  state === 'live' ? 'opacity-100' : 'opacity-0',
                )}
                allow="autoplay; fullscreen; gamepad"
                allowFullScreen
              />
            )}

            {/* running chip (live) + close control (loading and live) */}
            {state === 'live' && (
              <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-teal/50 bg-void/70 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-teal backdrop-blur-sm">
                <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-teal" />
                Running
              </span>
            )}
            {state !== 'idle' && (
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label={`Close ${spec.title}`}
                className="absolute right-3 top-3 rounded-full border border-panel-line bg-void/70 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-muted backdrop-blur-sm transition-colors duration-200 hover:border-amber hover:text-amber"
              >
                × Close
              </button>
            )}
          </div>

          {/* ── info strip ────────────────────────────────────────── */}
          <div className="flex flex-1 flex-col gap-2 p-5">
            <h3 className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-amber">{spec.index}</span>
              <span className="font-display text-[1.15rem] font-semibold leading-tight tracking-[-0.01em] text-ink">
                {spec.title}
              </span>
            </h3>
            <p className="text-[0.9rem] leading-relaxed text-muted">{spec.description}</p>
            <p className="mt-auto flex flex-wrap items-center gap-2 pt-2">
              <span className="rounded-full border border-faint/50 px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-faint">
                Unity WebGL
              </span>
              <span className="rounded-full border border-faint/50 px-2.5 py-0.5 font-mono text-[0.65rem] tracking-[0.1em] text-faint">
                ~5 MB
              </span>
              <a
                href={standaloneHref}
                target="_blank"
                rel="noopener"
                className="ml-auto font-mono text-[0.7rem] uppercase tracking-[0.12em] text-teal hover:text-amber"
                data-cursor
                data-cursor-label="OPEN"
              >
                Open full size <span aria-hidden>↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.article>
  )
}
