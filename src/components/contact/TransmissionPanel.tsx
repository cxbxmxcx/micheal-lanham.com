import { useEffect, useId, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TypedText from '@/components/about/TypedText'

const EMAIL = 'cxbxmxcx@micheal-lanham.com'
const MAILTO = `mailto:${EMAIL}`
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

/**
 * Transmission panel — the Contact centerpiece. Holographic glass panel
 * (corner ticks, scanlines) with a typed mono status strip, the email
 * address as hero element (mailto), idle underline pulse, hover gradient
 * sheen + tooltip chip, click status feedback, and a copy-to-clipboard chip.
 */
export default function TransmissionPanel() {
  const id = useId().replace(/:/g, '')
  const scope = `tx-${id}`
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [ripples, setRipples] = useState<number[]>([])
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
    } catch {
      // fallback for non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = EMAIL
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    later(() => setCopied(false), 1500)
  }

  const onSend = () => {
    setSending(true)
    later(() => setSending(false), 1200)
    setRipples((r) => [...r.slice(-2), Date.now()])
  }

  return (
    <motion.div
      className={`${scope} holo-panel holo-ticks relative mx-auto w-full max-w-[760px] overflow-hidden px-6 py-8 sm:px-10 sm:py-10`}
      initial={{ opacity: 0, y: 48, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <style>{`
        .${scope} .tx-underline {
          animation: ${scope}-pulse 3s ease-in-out infinite;
        }
        @keyframes ${scope}-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
        .${scope} .tx-grad {
          background: linear-gradient(100deg, #E09B4A, #C2703C 60%, #3E9E96);
          background-size: 220% 100%;
          background-position: 0% 0;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          opacity: 0;
          transition: opacity 200ms ease, background-position 300ms ease;
        }
        .${scope} .tx-email:hover .tx-grad,
        .${scope} .tx-email:focus-visible .tx-grad {
          opacity: 1;
          background-position: 100% 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .${scope} .tx-underline { animation: none; opacity: 0.6; }
          .${scope} .tx-grad { transition: opacity 0.01ms; }
        }
      `}</style>

      {/* top mono strip */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-panel-line pb-4 font-mono text-[0.72rem] tracking-[0.08em]">
        <TypedText
          text="TX://micheal-lanham.com · CHANNEL OPEN"
          active
          delay={900}
          charsPerSecond={30}
          className="text-muted"
        />
        <span className="text-code-green">SIGNAL ▓▓▓▓▓ 100%</span>
      </div>

      {/* one always-mounted live region: copy + send feedback for assistive tech */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Address copied' : sending ? 'Opening mail client' : ''}
      </span>

      {/* email beacon */}
      <div className="relative z-10 py-10 text-center sm:py-12">
        <a
          href={MAILTO}
          onClick={onSend}
          data-cursor
          data-cursor-label="SEND"
          className="tx-email group relative inline-block outline-offset-4"
          aria-label={`Send an email to ${EMAIL}`}
        >
          {/* hover tooltip chip */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full border border-amber/50 bg-void/90 px-3 py-1 font-mono text-[0.65rem] tracking-[0.2em] text-amber opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
          >
            SEND TRANSMISSION ↗
          </span>

          <span className="relative font-display text-[clamp(1.4rem,3.4vw,2.4rem)] font-semibold tracking-[-0.01em] text-ink [text-shadow:0_0_22px_rgba(224,155,74,0.22)]">
            {EMAIL}
            {/* gradient sheen layer (revealed on hover) */}
            <span aria-hidden className="tx-grad absolute inset-0">
              {EMAIL}
            </span>
          </span>

          {/* idle pulsing amber underline hairline */}
          <span
            aria-hidden
            className="tx-underline absolute -bottom-2 left-0 right-0 h-px grad-filament"
          />

          {/* click ripples */}
          <AnimatePresence>
            {ripples.map((rk) => (
              <motion.span
                key={rk}
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber/60"
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                onAnimationComplete={() =>
                  setRipples((r) => r.filter((k) => k !== rk))
                }
              />
            ))}
          </AnimatePresence>
        </a>

        <p className="mt-7 font-mono text-[0.85rem] leading-relaxed text-muted">
          architecture reviews · training workshops · speaking · just talk shop
        </p>

        {/* copy chip + click status */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <motion.button
            type="button"
            onClick={copy}
            animate={copied ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className={
              copied
                ? 'rounded-full border border-code-green/60 px-4 py-1.5 font-mono text-[0.7rem] tracking-[0.15em] text-code-green'
                : 'rounded-full border border-faint px-4 py-1.5 font-mono text-[0.7rem] tracking-[0.15em] text-faint transition-colors duration-200 hover:border-amber hover:text-amber'
            }
          >
            {copied ? 'COPIED ✓' : '⧉ COPY ADDRESS'}
          </motion.button>

          <AnimatePresence>
            {sending && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="font-mono text-[0.7rem] tracking-[0.15em] text-code-green"
                aria-hidden
              >
                OPENING MAIL CLIENT…
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
