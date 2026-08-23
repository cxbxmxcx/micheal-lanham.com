import { motion } from 'framer-motion'
import NeuralField from '@/components/contact/NeuralField'
import TransmissionPanel from '@/components/contact/TransmissionPanel'

/**
 * Contact (#contact) — "Open a channel." header + the transmission panel
 * email beacon over a sparse ambient neural field. The footer is shared
 * and lives in Layout (owned by the main agent).
 */
export default function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden py-[clamp(96px,14vh,160px)]">
      {/* ambient mini neural field (dimmed, teal + one amber spark) */}
      <NeuralField className="absolute inset-0" />
      {/* top/bottom fade so the field melts into the void */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-void to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-void to-transparent"
      />

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
            {'// 05 — MAKE CONTACT'}
          </p>
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-ink text-balance">
            Open a <span className="text-gradient">channel.</span>
          </h2>
          <p className="mt-5 max-w-[640px] text-base leading-relaxed text-muted">
            Get in touch — for architecture reviews, workshops, speaking, or anything
            about the books.
          </p>
        </motion.header>

        <TransmissionPanel />
      </div>
    </section>
  )
}
