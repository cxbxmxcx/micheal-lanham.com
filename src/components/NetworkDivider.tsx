import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* deterministic pseudo-random so the constellation is stable across renders */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface NetworkDividerProps {
  /** optional mono label, left-aligned, e.g. "// ENTERING EVOLUTION LAB" */
  label?: string
  className?: string
}

/**
 * D7 — 80px scroll-drawn constellation divider. 8–12 teal dots connected by
 * hairlines draw on as the strip enters the viewport; one amber spark node
 * pulses; dots idle-drift ±6px on slow loops. Seams sections without hard cuts.
 */
export default function NetworkDivider({ label, className }: NetworkDividerProps) {
  const { dots, lines, spark } = useMemo(() => {
    const rand = mulberry32(1337)
    const n = 10
    const dots = Array.from({ length: n }, (_, i) => ({
      x: 80 + (1040 / (n - 1)) * i + (rand() - 0.5) * 70,
      y: 14 + rand() * 52,
      r: 1.6 + rand() * 1.6,
      dur: 8 + rand() * 4,
      delay: -rand() * 8,
    }))
    const lines: [number, number][] = []
    for (let i = 0; i < n - 1; i++) lines.push([i, i + 1])
    lines.push([1, 3], [5, 8], [2, 4], [6, 9])
    const spark = 4 + Math.floor(rand() * 3)
    return { dots, lines, spark }
  }, [])

  return (
    <div className={cn('relative h-20 w-full overflow-hidden', className)} aria-hidden>
      {label && (
        <span className="absolute left-[clamp(20px,5vw,48px)] top-1/2 z-10 -translate-y-1/2 font-mono text-[0.7rem] tracking-[0.04em] text-faint">
          {label}
        </span>
      )}
      <svg viewBox="0 0 1200 80" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {lines.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={dots[a].x}
            y1={dots[a].y}
            x2={dots[b].x}
            y2={dots[b].y}
            stroke="#3E9E96"
            strokeOpacity={0.35}
            strokeWidth={1}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.2, delay: i * 0.08, ease: 'easeOut' }}
          />
        ))}
        {dots.map((d, i) => (
          <g
            key={i}
            className="animate-divider-drift"
            style={{ animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
          >
            {i === spark ? (
              <>
                <circle cx={d.x} cy={d.y} r={d.r * 3.2} fill="#E09B4A" opacity={0.18} className="animate-spark-pulse" />
                <circle cx={d.x} cy={d.y} r={d.r + 1.2} fill="#E09B4A" className="animate-spark-pulse" />
              </>
            ) : (
              <circle cx={d.x} cy={d.y} r={d.r} fill="#3E9E96" opacity={0.85} />
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
