import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { DevBook } from './booksData'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 56, rotateX: 6 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.75, delay: i * 0.12, ease: EASE },
  }),
  hover: { y: -6, transition: { duration: 0.3, ease: EASE } },
}

/* ------------------------------------------------------------------ */
/* Growth ring — 72px circular progress held at ~62%, amber arc on     */
/* teal track. Perpetual slow rotate + shimmer; spins 180° on hover.   */
/* Perpetual loops isolated + memoized per performance rules.          */
/* ------------------------------------------------------------------ */
const GrowthRing = memo(function GrowthRing() {
  const reduced = useReducedMotion()
  const R = 30
  const C = 2 * Math.PI * R
  return (
    <div className="relative h-[72px] w-[72px]" aria-hidden>
      {/* perpetual slow rotation */}
      <motion.div
        className="h-full w-full"
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
      >
        {/* hover spin 180° (driven by parent variant) */}
        <motion.div
          className="h-full w-full"
          variants={{ hidden: { rotate: 0 }, show: { rotate: 0 }, hover: { rotate: 180 } }}
          transition={{ duration: 0.3, ease: EASE }}
        >
          <svg width="72" height="72" viewBox="0 0 72 72">
            {/* teal track */}
            <circle cx="36" cy="36" r={R} fill="none" stroke="#1E5A55" strokeWidth="3" opacity="0.55" />
            {/* amber arc, perpetually ~62% */}
            <motion.circle
              cx="36"
              cy="36"
              r={R}
              fill="none"
              stroke="#E09B4A"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - 0.62)}
              transform="rotate(-90 36 36)"
              animate={reduced ? undefined : { opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(224,155,74,0.5))' }}
            />
            {/* tiny teal satellite node on the arc end */}
            <circle cx="36" cy={36 - R} r="2" fill="#3E9E96" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
})

/* ------------------------------------------------------------------ */
/* Particle seep — 5 tiny amber particles drift up from the card's     */
/* bottom edge on 5s loops (opacity 0→0.5→0). Isolated + memoized.     */
/* ------------------------------------------------------------------ */
const SEED_X = [12, 30, 52, 71, 88]
const ParticleSeep = memo(function ParticleSeep() {
  const reduced = useReducedMotion()
  if (reduced) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 overflow-hidden" aria-hidden>
      {SEED_X.map((left, i) => (
        <motion.span
          key={i}
          className="absolute bottom-1 h-[3px] w-[3px] rounded-full bg-amber"
          style={{ left: `${left}%`, boxShadow: '0 0 6px rgba(224,155,74,0.6)' }}
          animate={{ y: [0, -70], x: [0, i % 2 === 0 ? 6 : -6], opacity: [0, 0.5, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: i * 1.05, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
})

interface InDevelopmentCardProps {
  book: DevBook
  index: number
}

/* MEAP badge — solid amber pill, pulsing glow 2.8s (isolated loop) */
const MeapBadge = memo(function MeapBadge() {
  const reduced = useReducedMotion()
  return (
    <motion.span
      className="rounded-full bg-amber px-2.5 py-1 font-mono text-[0.65rem] font-bold tracking-[0.12em] text-void"
      animate={reduced ? undefined : { boxShadow: ['0 0 6px rgba(224,155,74,0.35)', '0 0 18px rgba(224,155,74,0.7)', '0 0 6px rgba(224,155,74,0.35)'] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      MEAP
    </motion.span>
  )
})

/* IN DEVELOPMENT badge — teal outline pill, soft pulse */
const DevBadge = memo(function DevBadge() {
  const reduced = useReducedMotion()
  return (
    <motion.span
      className="rounded-full border border-teal px-2.5 py-1 font-mono text-[0.65rem] font-medium tracking-[0.12em] text-teal"
      animate={reduced ? undefined : { opacity: [0.65, 1, 0.65] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      IN DEVELOPMENT
    </motion.span>
  )
})

export default function InDevelopmentCard({ book, index }: InDevelopmentCardProps) {
  return (
    <motion.article
      variants={cardVariants}
      custom={index}
      initial="hidden"
      whileInView="show"
      whileHover="hover"
      viewport={{ once: true, amount: 0.2 }}
      data-cursor
      data-cursor-label="SOON"
      className="holo-panel group relative min-h-[300px] overflow-hidden p-6 xl:min-h-0"
      style={{ transformPerspective: 900 }}
    >
      {/* hover lift glow (transform/border-brighten) */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[14px]"
        variants={{ hover: { opacity: 1 } }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        style={{ boxShadow: '0 0 28px rgba(224,155,74,0.22), inset 0 0 0 1px rgba(224,155,74,0.35)' }}
        aria-hidden
      />
      {/* corner ticks — extend 12→18px on hover */}
      <CornerTicks />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <GrowthRing />
          {book.badge === 'MEAP' ? <MeapBadge /> : <DevBadge />}
        </div>

        <p className="mt-5 font-mono text-[0.72rem] tracking-[0.08em] text-muted">{book.publisher}</p>
        <h4 className="mt-2 font-display text-[1.4rem] font-semibold leading-[1.25] tracking-[-0.01em] text-ink">
          {book.title}
        </h4>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{book.flavor}</p>
      </div>

      <ParticleSeep />
    </motion.article>
  )
}

/** 12px amber L-brackets in each corner; extend to 18px on card hover. */
function CornerTicks() {
  const tick =
    'absolute h-[12px] w-[12px] border-amber opacity-80 transition-all duration-300 group-hover:h-[18px] group-hover:w-[18px]'
  return (
    <div className="pointer-events-none absolute inset-[10px]" aria-hidden>
      <span className={cn(tick, 'left-0 top-0 border-l border-t')} />
      <span className={cn(tick, 'right-0 top-0 border-r border-t')} />
      <span className={cn(tick, 'bottom-0 left-0 border-b border-l')} />
      <span className={cn(tick, 'bottom-0 right-0 border-b border-r')} />
    </div>
  )
}
