import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Types the manifest lines left-to-right at ~24 chars/s, 90ms between lines. */
function TypedSpecBlock({
  specKey,
  lines,
  start,
  reduce,
}: {
  specKey: string
  lines: string[]
  start: boolean
  reduce: boolean
}) {
  const full = useMemo(() => [specKey, ...lines.map((l) => `  › ${l}`)], [specKey, lines])
  const total = full.reduce((n, l) => n + l.length, 0)
  const GAP_CHARS = Math.round(0.09 * 24) // 90ms pause expressed as "char slots"
  const end = total + full.length * GAP_CHARS
  // reduced-motion: instant — the manifest renders fully compiled
  const [chars, setChars] = useState(reduce ? end : 0)

  useEffect(() => {
    if (!start || reduce) return
    const id = window.setInterval(() => {
      setChars((c) => {
        if (c >= end) {
          window.clearInterval(id)
          return c
        }
        return c + 1
      })
    }, 1000 / 24)
    return () => window.clearInterval(id)
  }, [start, reduce, end])

  const shownLines = useMemo(() => {
    const out: string[] = []
    let rem = chars
    full.forEach((line, i) => {
      out.push(line.slice(0, Math.max(0, rem)))
      rem -= line.length + (i < full.length - 1 ? GAP_CHARS : 0)
    })
    return out
  }, [chars, full, GAP_CHARS])

  return (
    <div className="rounded-btn border border-panel-line bg-void/60 p-4 font-mono text-[0.8rem] leading-[2]">
      {/* screen readers get the finished list regardless of typing state */}
      <ul className="sr-only" aria-label={specKey.replace(/:$/, '')}>
        {full.slice(1).map((line) => (
          <li key={line}>{line.replace(/^[^a-z]*/i, '')}</li>
        ))}
      </ul>
      {full.map((line, i) => {
        const shown = shownLines[i]
        if (!shown) return <p key={i} className="h-[1.6em]" aria-hidden />
        const typing = shown.length < line.length
        return (
          <p key={i} aria-hidden className={cn('whitespace-pre-wrap', i === 0 ? 'text-amber' : 'group/row rounded px-1 -mx-1 transition-colors duration-150 hover:bg-[rgba(224,155,74,0.06)]')}>
            {i === 0 ? (
              shown
            ) : (
              <>
                <span
                  className={cn(
                    'transition-colors duration-150',
                    'text-teal group-hover/row:text-amber',
                  )}
                >
                  {shown.slice(0, Math.min(3, shown.length))}
                </span>
                <span className="text-muted">{shown.slice(3)}</span>
              </>
            )}
            {typing && <span className="ml-0.5 inline-block h-3 w-2 animate-pulse bg-amber align-middle" />}
          </p>
        )
      })}
    </div>
  )
}

export interface ServiceSpec {
  id: string
  filename: string
  chip: string
  chipTone: 'green' | 'teal'
  title: string
  summary: string
  specKey: string
  lines: string[]
  callout?: string
  credential?: string
  cta: string
}

interface ServicePanelProps {
  spec: ServiceSpec
  side: 'left' | 'right'
}

/**
 * One holographic "manifest" panel — glass card floating 1px off an offset
 * ghost frame (the layered code-panels look). Spec lines type in live once
 * the panel is 45% visible. Mailto CTA in the footer.
 */
export default function ServicePanel({ spec, side }: ServicePanelProps) {
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  // spec lines compile once the panel is 45% visible
  const halfVisible = useInView(panelRef, { amount: 0.2, once: true })

  const fromX = side === 'left' ? -64 : 64
  const fromRot = side === 'left' ? -7 : 7

  return (
    <div ref={panelRef} className="group relative" style={{ transformStyle: 'preserve-3d' }}>
      {/* ghost frame — trails the panel entrance by 120ms, separates on hover */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-card border border-panel-line transition-transform duration-300 group-hover:translate-x-1.5 group-hover:translate-y-1.5"
        style={{ transform: 'translate(2px, 2px)' }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: fromX, rotateY: fromRot }}
        whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* glass manifest card */}
      <motion.div
        className="holo-panel holo-ticks relative flex h-full flex-col gap-5 rounded-card p-7 sm:p-8"
        data-cursor
        data-cursor-label="MANIFEST"
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: fromX, rotateY: fromRot }}
        whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        whileHover={reduce ? undefined : { y: -8, z: 20 }}
      >
        {/* header: filename strip + status chip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[0.75rem] tracking-[0.04em] text-faint">
            {spec.filename}
          </span>
          <span
            className={cn(
              'rounded-full border px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.15em]',
              spec.chipTone === 'green'
                ? 'border-code-green/50 text-code-green'
                : 'border-teal/50 text-teal',
            )}
          >
            {spec.chip}
          </span>
        </div>

        <h3 className="font-display text-[1.6rem] font-semibold leading-[1.2] tracking-[-0.01em] text-ink">
          {spec.title}
        </h3>

        <p className="text-[0.95rem] leading-relaxed text-muted">{spec.summary}</p>

        <TypedSpecBlock specKey={spec.specKey} lines={spec.lines} start={halfVisible} reduce={!!reduce} />

        {spec.callout && (
          <p className="border-l border-amber/60 bg-amber/5 px-4 py-3 text-[0.85rem] leading-relaxed text-ink/90">
            {spec.callout}
          </p>
        )}

        {spec.credential && (
          <p className="font-mono text-[0.78rem] leading-relaxed text-faint">{spec.credential}</p>
        )}

        <div className="mt-auto pt-2">
          <a
            href="mailto:cxbxmxcx@micheal-lanham.com"
            className="inline-flex items-center gap-2 rounded-full border border-amber px-5 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-amber transition-all duration-200 hover:bg-amber hover:text-void"
          >
            {spec.cta} ↗
          </a>
        </div>
      </motion.div>
    </div>
  )
}
