import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SectionShellProps {
  /** anchor id, e.g. "books" → #books */
  id: string
  /** section index shown in the kicker, e.g. "01" → "// 01 — EVOLUTION LAB" */
  index?: string
  /** uppercase kicker label, e.g. "EVOLUTION LAB" */
  kicker: string
  /** H2 content — wrap gradient keywords in <span className="text-gradient"> */
  title: ReactNode
  /** optional 1–2 sentence lede (rendered in --muted, max-w 640px) */
  lede?: string
  children?: ReactNode
  className?: string
}

/**
 * Shared section header pattern: mono amber kicker + Space Grotesk H2 +
 * optional lede. The header animates in as one unit (y 40→0, opacity,
 * blur) at 20% viewport. Wraps children in the standard 1200px container.
 */
export default function SectionShell({ id, index, kicker, title, lede, children, className }: SectionShellProps) {
  return (
    <section id={id} className={cn('relative py-[clamp(96px,14vh,160px)]', className)}>
      <div className="container-x">
        <motion.header
          className="mb-14"
          initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="kicker mb-4 flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />
            {index ? `// ${index} — ${kicker}` : kicker}
          </p>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-ink text-balance">
            {title}
          </h2>
          {lede && <p className="mt-5 max-w-[640px] text-base leading-relaxed text-muted">{lede}</p>}
        </motion.header>
        {children}
      </div>
    </section>
  )
}
