import { motion } from 'framer-motion'
import DendriteCanvas from '@/components/books/DendriteCanvas'
import InDevelopmentCard from '@/components/books/InDevelopmentCard'
import StillLife from '@/components/books/StillLife'
import PublisherTimeline from '@/components/books/PublisherTimeline'
import { DEV_BOOKS } from '@/components/books/booksData'

/**
 * Books — "The Library" (#books).
 * Section header with D5 dendrite growth canvas behind it, the 3
 * in-development "growing specimen" cards beside the dendrite-books still
 * life, and all 13 published works on a scroll-drawn dendrite timeline
 * grouped by publisher.
 *
 * Header markup mirrors the shared SectionShell pattern (same kicker / H2 /
 * lede treatment) but is inlined here so the D5 canvas can sit behind the
 * header block only.
 */
export default function Books() {
  return (
    <section id="books" className="relative py-[clamp(96px,14vh,160px)]">
      {/* D5 — dendrite growth canvas, behind the header block only,
          masked bottom with a fade-to-void gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden" aria-hidden>
        <DendriteCanvas />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(10,9,8,0.15) 0%, rgba(10,9,8,0) 30%, rgba(10,9,8,0.82) 82%, #0A0908 100%)',
          }}
        />
      </div>

      <div className="container-x relative">
        <motion.header
          className="mb-14"
          initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="kicker mb-4 flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />
            // 01 — THE LIBRARY
          </p>
          <h2 className="text-balance font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-ink">
            Words that grew into <span className="text-gradient">networks.</span>
          </h2>
          <p className="mt-5 max-w-[640px] text-base leading-relaxed text-muted">
            Thirteen published books on AI, machine learning, and game development — for Manning,
            O&rsquo;Reilly, Apress, Packt, and BPB — most recently on AI agents, evolutionary deep learning,
            and generative systems. Three more currently in development.
          </p>
        </motion.header>

        {/* Sub-section A — In Development (growing specimens) */}
        <div className="mb-24">
          <h3 className="mb-7 flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.28em] text-teal">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal" aria-hidden />
            In development — growing specimens
          </h3>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <StillLife />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 xl:col-span-7 xl:grid-cols-1 xl:gap-5">
              {DEV_BOOKS.map((book, i) => (
                <InDevelopmentCard key={book.title} book={book} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Sub-section B — Published Work (the dendrite timeline) */}
        <div>
          <h3 className="mb-7 flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.28em] text-amber">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />
            Published work — the dendrite timeline
          </h3>
          <PublisherTimeline />
        </div>
      </div>
    </section>
  )
}
