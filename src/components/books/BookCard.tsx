import { memo, useState } from 'react'
import type { MouseEvent } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { PublishedBook } from './booksData'

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

/** entrance variant — driven by the publisher cluster's stagger */
const bookCardVariants: Variants = {
  hidden: { opacity: 0, y: 44, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.65, ease: EASE } },
}

/* ------------------------------------------------------------------ */
/* Dust motes — 3 faint golden motes drifting inside the card on hover */
/* (6s loops). Isolated + memoized; mounted only while hovered.        */
/* ------------------------------------------------------------------ */
const MOTES = [
  { left: '22%', top: '62%', dx: 14, dy: -46, delay: 0 },
  { left: '58%', top: '70%', dx: -10, dy: -38, delay: 1.8 },
  { left: '80%', top: '55%', dx: 8, dy: -52, delay: 3.4 },
]
const DustMotes = memo(function DustMotes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {MOTES.map((m, i) => (
        <motion.span
          key={i}
          className="absolute h-[3px] w-[3px] rounded-full bg-amber"
          style={{ left: m.left, top: m.top, boxShadow: '0 0 6px rgba(224,155,74,0.55)' }}
          animate={{ x: [0, m.dx, 0], y: [0, m.dy, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: m.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
})

interface BookCardProps {
  book: PublishedBook
  spineColor: string
}

/**
 * Typographic "cover spine" artifact for a published book: publisher-color
 * spine bar, ghost year numeral, title / subtitle / ISBN, VIEW link or
 * ARCHIVED EDITION. Hover: springy 3D tilt (±4°), publisher-color border
 * glow, ghost year brightens, dust motes drift.
 */
export default function BookCard({ book, spineColor }: BookCardProps) {
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const rxRaw = useMotionValue(0)
  const ryRaw = useMotionValue(0)
  const rotateX = useSpring(rxRaw, { stiffness: 220, damping: 18 })
  const rotateY = useSpring(ryRaw, { stiffness: 220, damping: 18 })

  const onMove = (e: MouseEvent<HTMLElement>) => {
    if (reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ryRaw.set(px * 8) // ±4°
    rxRaw.set(-py * 8)
  }
  const onLeave = () => {
    rxRaw.set(0)
    ryRaw.set(0)
    setHovered(false)
  }

  return (
    <motion.article
      variants={bookCardVariants}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
      className="group relative min-h-[190px] overflow-hidden rounded-card border bg-panel p-6 pl-7 transition-[border-color,box-shadow] duration-200"
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        borderColor: hovered ? spineColor : 'var(--panel-line)',
        boxShadow: hovered ? `0 0 24px ${spineColor}59` : 'inset 0 1px 0 rgba(242,237,228,0.05)',
      }}
    >
      {/* 3px publisher-color spine bar */}
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: spineColor, boxShadow: `0 0 12px ${spineColor}80` }}
        aria-hidden
      />

      {/* ghost year numeral */}
      {book.year && (
        <span
          className="pointer-events-none absolute right-4 top-3 font-mono text-[2.75rem] font-bold leading-none text-faint opacity-50 transition-colors duration-200 group-hover:text-muted group-hover:opacity-90"
          aria-hidden
        >
          {book.year}
        </span>
      )}

      <div className="relative flex h-full flex-col">
        {book.year && (
          <p className="font-mono text-[0.72rem] tracking-[0.08em] text-faint">{book.year}</p>
        )}
        <h5 className="mt-1.5 max-w-[85%] font-display text-[1.25rem] font-semibold leading-[1.25] tracking-[-0.01em] text-ink">
          {book.title}
        </h5>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{book.subtitle}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-5">
          {book.isbn ? (
            <span className="font-mono text-[0.72rem] tracking-[0.04em] text-faint">ISBN {book.isbn}</span>
          ) : (
            <span />
          )}
          {book.url ? (
            <a
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-label="READ"
              className="group/link font-mono text-[0.78rem] tracking-[0.08em] text-teal transition-colors duration-150 hover:text-amber"
            >
              VIEW{' '}
              <span className="inline-block transition-transform duration-150 group-hover/link:translate-x-[3px]">
                ↗
              </span>
            </a>
          ) : (
            <span className="font-mono text-[0.78rem] tracking-[0.08em] text-faint">ARCHIVED EDITION</span>
          )}
        </div>
      </div>

      {hovered && !reduced && <DustMotes />}
    </motion.article>
  )
}
