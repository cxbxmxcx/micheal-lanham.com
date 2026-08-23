import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from './hooks'

gsap.registerPlugin(ScrollTrigger)

interface Milestone {
  year: string
  label: string
  live?: boolean
}

const MILESTONES: Milestone[] = [
  {
    year: '~2000',
    label: 'Neural networks + evolutionary algorithms in game development',
  },
  { year: '2017–2019', label: 'Games, AR & ML teaching titles (Packt)' },
  { year: '2020–2021', label: "Cloud AI & generative models (O'Reilly, Apress)" },
  {
    year: '2023–2026',
    label: 'Evolutionary Deep Learning → AI Agents in Action (Manning)',
  },
  { year: 'NOW', label: 'Self-improving & instinctual agent systems', live: true },
]

function Dot({ live }: { live?: boolean }) {
  return (
    <span className="relative inline-flex">
      {live && (
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full bg-teal/60 [animation-duration:2.2s]"
        />
      )}
      <span
        className={
          live
            ? 'relative h-2.5 w-2.5 rounded-full bg-teal shadow-glow-teal'
            : 'relative h-2 w-2 rounded-full bg-amber shadow-glow-amber'
        }
      />
    </span>
  )
}

/**
 * Career phylogeny — a horizontal amber→teal trunk drawing left→right on
 * scroll scrub across 5 milestone nodes; nodes pop sequentially (spring
 * overshoot), captions fade in after their node. The final node is teal,
 * larger, with a LIVE pulse. Mobile rotates to a vertical list.
 * Dedicated GSAP component (no Framer Motion in this tree).
 */
export default function CareerPhylogeny() {
  const bandRef = useRef<HTMLDivElement>(null)
  const trunkRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const band = bandRef.current
    const trunk = trunkRef.current
    if (!band || !trunk) return

    const ctx = gsap.context(() => {
      const dots = gsap.utils.toArray<HTMLElement>('.phylo-dot')
      const captions = gsap.utils.toArray<HTMLElement>('.phylo-caption')

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: band,
          start: 'top 85%',
          end: 'bottom 55%',
          scrub: 1,
        },
      })

      // trunk draws across the first ~55% of the scrub
      tl.fromTo(trunk, { scaleX: 0 }, { scaleX: 1, duration: 2.6 }, 0)

      // nodes pop sequentially with spring overshoot, captions trail each node
      dots.forEach((dot, i) => {
        const at = 0.35 + i * 0.5
        tl.fromTo(
          dot,
          { scale: 0 },
          { scale: 1, duration: 0.35, ease: 'back.out(1.25)' },
          at,
        )
        const cap = captions[i]
        if (cap) {
          tl.fromTo(
            cap,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
            at + 0.15,
          )
        }
      })
    }, band)

    return () => ctx.revert()
  }, [reduced])

  return (
    <div className="pt-2">
      <p className="kicker mb-10 flex items-center gap-3 !text-[0.7rem] text-faint">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal" aria-hidden />
        {'// CAREER PHYLOGENY'}
      </p>

      {/* ---------- desktop: horizontal branching trunk ---------- */}
      <div ref={bandRef} className="relative hidden md:block">
        {/* trunk: 2px amber→teal gradient hairline, drawn via scaleX scrub.
            Dot centers sit at 64px (label block) + 20px (half of dot row) = 84px. */}
        <div
          ref={trunkRef}
          aria-hidden
          className="absolute inset-x-0 top-[83px] h-0.5 origin-left"
          style={{
            background: 'linear-gradient(90deg, #E09B4A 0%, #C2703C 55%, #3E9E96 100%)',
          }}
        />
        <ol className="relative grid grid-cols-5 gap-4">
          {MILESTONES.map((m) => (
            <li key={m.year} className="phylo-caption flex flex-col items-center text-center">
              <span className="flex h-16 items-end justify-center pb-2 font-mono text-xs leading-snug text-muted">
                {m.label}
              </span>
              <span className="flex h-10 items-center justify-center">
                <span className="phylo-dot inline-flex will-change-transform">
                  <Dot live={m.live} />
                </span>
              </span>
              <span
                className={
                  m.live
                    ? 'mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-[0.15em] text-teal'
                    : 'mt-1 font-mono text-xs tracking-[0.04em] text-faint'
                }
              >
                {m.live ? (
                  <span className="animate-spark-pulse">● NOW</span>
                ) : (
                  m.year
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* ---------- mobile: vertical list with left-border ticks ---------- */}
      <ol className="space-y-6 md:hidden">
        {MILESTONES.map((m) => (
          <li key={m.year} className="relative border-l border-panel-line pl-5">
            <span className="absolute -left-[5px] top-1.5">
              <Dot live={m.live} />
            </span>
            <p
              className={
                m.live
                  ? 'font-mono text-xs font-bold tracking-[0.15em] text-teal'
                  : 'font-mono text-xs tracking-[0.04em] text-faint'
              }
            >
              {m.live ? '● NOW' : m.year}
            </p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-muted">{m.label}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
