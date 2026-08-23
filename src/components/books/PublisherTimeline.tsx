import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import BookCard from './BookCard'
import { FILTER_KEYS, PUBLISHER_CLUSTERS } from './booksData'
import type { PublisherKey } from './booksData'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

type Filter = 'ALL' | PublisherKey

const nodeVariants: Variants = {
  hidden: { scale: 0 },
  show: { scale: 1, transition: { type: 'spring', stiffness: 320, damping: 13 } }, // overshoot ~1.2
}

const clusterVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const cardsVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

/**
 * Published Work — the dendrite timeline. A glowing trunk (scroll-drawn,
 * scrub-smoothed) with publisher clusters branching off it; each cluster
 * reveals with a node pop + card stagger. Optional publisher filter chips
 * with Framer Motion layout animation (400ms).
 */
export default function PublisherTimeline() {
  const [filter, setFilter] = useState<Filter>('ALL')
  const listRef = useRef<HTMLDivElement>(null)
  const spineRef = useRef<HTMLDivElement>(null)

  /* Spine draw-on tied to scroll (manual scrub ~0.5s catch-up, no library
     mixing — Framer Motion owns the cards, this is a ref-driven transform) */
  useEffect(() => {
    const list = listRef.current
    const spine = spineRef.current
    if (!list || !spine) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      spine.style.transform = 'scaleY(1)'
      return
    }
    let raf = 0
    let visible = false
    let current = 0
    const frame = () => {
      raf = requestAnimationFrame(frame)
      const r = list.getBoundingClientRect()
      const vh = window.innerHeight
      const target = clamp01((vh * 0.8 - r.top) / Math.max(1, r.height * 0.9))
      current += (target - current) * 0.14
      if (Math.abs(target - current) < 0.001) current = target
      spine.style.transform = `scaleY(${current.toFixed(4)})`
    }
    const io = new IntersectionObserver(
      (entries) => {
        const nowVisible = entries[0].isIntersecting
        if (nowVisible && !visible) {
          visible = true
          raf = requestAnimationFrame(frame)
        } else if (!nowVisible && visible) {
          visible = false
          cancelAnimationFrame(raf)
        }
      },
      { rootMargin: '160px 0px' },
    )
    io.observe(list)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [])

  const clusters = PUBLISHER_CLUSTERS.filter((c) => filter === 'ALL' || c.key === filter)

  return (
    <div>
      {/* filter chips */}
      <div className="mb-10 flex flex-wrap items-center gap-2.5" role="group" aria-label="Filter books by publisher">
        {FILTER_KEYS.map((key, i) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-full border px-4 py-1.5 font-mono text-[0.7rem] tracking-[0.14em] transition-colors duration-200',
              filter === key
                ? 'border-amber bg-amber text-void'
                : 'border-teal/60 text-teal hover:border-teal hover:bg-teal/10',
            )}
          >
            {key}
            {i > 0 && (
              <span className="ml-2 opacity-60">
                {String(PUBLISHER_CLUSTERS[i - 1].books.length).padStart(2, '0')}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* timeline */}
      <div ref={listRef} className="relative">
        {/* dendrite trunk — mobile: 2px left border on the stack; ≥lg: left 180px */}
        <div
          ref={spineRef}
          className="absolute bottom-2 left-[3px] top-1 w-[2px] origin-top lg:left-[180px]"
          style={{
            background: 'linear-gradient(to bottom, #C2703C, #E09B4A 30%, #3E9E96 130%)',
            boxShadow: '0 0 12px rgba(224,155,74,0.25)',
            transform: 'scaleY(0)',
          }}
          aria-hidden
        />

        <div className="flex flex-col gap-12">
          <AnimatePresence mode="popLayout">
            {clusters.map((cluster) => (
              <motion.div
                key={cluster.key}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <motion.div
                  className="relative pl-7 lg:pl-[216px]"
                  variants={clusterVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                >
                  {/* branch node on the spine (desktop) */}
                  <motion.span
                    variants={nodeVariants}
                    className="absolute left-[176px] top-[3px] hidden h-2.5 w-2.5 rounded-full lg:block"
                    style={{
                      background: cluster.nodeColor,
                      boxShadow: `0 0 12px ${cluster.nodeColor}`,
                      animationDuration: '2.6s',
                    }}
                    aria-hidden
                  />
                  {/* 24px horizontal hairline from node to cluster */}
                  <motion.span
                    variants={nodeVariants}
                    className="absolute left-[186px] top-[7.5px] hidden h-px w-[24px] lg:block"
                    style={{ background: `linear-gradient(90deg, ${cluster.nodeColor}, transparent)` }}
                    aria-hidden
                  />

                  {/* cluster header — dot + mono label + count */}
                  <h4 className="flex items-center gap-2.5 font-mono text-[0.75rem] font-medium tracking-[0.2em]">
                    <span
                      className="h-1.5 w-1.5 rounded-full lg:hidden"
                      style={{ background: cluster.nodeColor, boxShadow: `0 0 8px ${cluster.nodeColor}` }}
                      aria-hidden
                    />
                    <span className="text-ink">{cluster.label}</span>
                    <span className="text-faint">· {String(cluster.books.length).padStart(2, '0')}</span>
                  </h4>

                  {/* card cluster */}
                  <motion.div variants={cardsVariants} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {cluster.books.map((book) => (
                      <BookCard key={book.title} book={book} spineColor={cluster.spineColor} />
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
