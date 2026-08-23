import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion'

const STEPS: { label: string; caption: string }[] = [
  { label: 'INIT', caption: 'Get in touch and describe the system or the team.' },
  { label: 'ANALYZE', caption: 'Review of the architecture, or a curriculum tailored to your stack.' },
  { label: 'DELIVER', caption: 'Written findings, or hands-on sessions.' },
  { label: 'ITERATE', caption: 'Questions afterwards are welcome.' },
]

/**
 * 4-step mono process strip — a hairline draws left→right on scroll scrub and
 * each node pops (spring scale) as the line reaches it. Mobile: 2×2 grid,
 * hairline hidden. Reduced-motion: fully drawn, no scrub.
 */
export default function ProcessStrip() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 90%', 'end 55%'],
  })

  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])
  // one pop spring per node, triggered as the drawn line reaches it
  const pop0 = useSpring(useTransform(scrollYProgress, [0, 0.06], [0, 1]), { stiffness: 320, damping: 17 })
  const pop1 = useSpring(useTransform(scrollYProgress, [0.28, 0.38], [0, 1]), { stiffness: 320, damping: 17 })
  const pop2 = useSpring(useTransform(scrollYProgress, [0.6, 0.7], [0, 1]), { stiffness: 320, damping: 17 })
  const pop3 = useSpring(useTransform(scrollYProgress, [0.9, 1], [0, 1]), { stiffness: 320, damping: 17 })
  const pops = [pop0, pop1, pop2, pop3]

  return (
    <div ref={ref} className="relative mt-20">
      {/* connecting hairline (desktop only) — draws left→right on scrub */}
      <motion.div
        aria-hidden
        className="grad-filament absolute left-0 right-0 top-[5px] hidden h-px origin-left md:block"
        style={{ scaleX: reduce ? 1 : lineScale }}
      />

      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <div key={s.label} className="relative">
            <motion.span
              aria-hidden
              className="mb-4 block h-2.5 w-2.5 rounded-full bg-amber shadow-glow-amber"
              style={{ scale: reduce ? 1 : pops[i] }}
            />
            <motion.div
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-mono text-[0.75rem] font-medium uppercase tracking-[0.2em] text-ink">
                <span className="mr-2 text-faint">{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </p>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">{s.caption}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  )
}
