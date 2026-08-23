import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Side feature — dendrite-books still life in a holographic frame.
 * Slow 12s ken-burns zoom (1.0→1.06, alternate). On <xl it renders as a
 * 320px full-width banner with masked edges; on xl it fills the left
 * column (span 5) beside the stacked in-development cards.
 * Perpetual zoom loop is isolated in this memoized micro-component.
 */
const StillLife = memo(function StillLife() {
  const reduced = useReducedMotion()
  return (
    <figure className="xl:col-span-5 xl:flex xl:h-full xl:flex-col">
      <div className="holo-panel holo-ticks relative h-[320px] overflow-hidden xl:h-full xl:min-h-[560px] xl:flex-1">
        <motion.img
          src="/dendrite-books.webp"
          alt="Cinematic still life of worn hardcover books on a dark surface, golden dendrite particles growing out of the top book and dissolving into drifting sparks"
          className="h-full w-full object-cover"
          animate={reduced ? undefined : { scale: [1, 1.06] }}
          transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        {/* masked edges for the <xl banner treatment */}
        <div
          className="pointer-events-none absolute inset-0 xl:hidden"
          style={{
            background:
              'linear-gradient(to right, rgba(10,9,8,0.55), transparent 18%, transparent 82%, rgba(10,9,8,0.55)), linear-gradient(to bottom, rgba(10,9,8,0.25), transparent 30%, transparent 70%, rgba(10,9,8,0.6))',
          }}
          aria-hidden
        />
      </div>
      <figcaption className="mt-3 font-mono text-[0.72rem] tracking-[0.04em] text-faint">
        every book starts as a small spark of selection pressure.
      </figcaption>
    </figure>
  )
})

export default StillLife
