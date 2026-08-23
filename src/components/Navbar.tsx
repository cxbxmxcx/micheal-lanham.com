import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { scrollToId, lockScroll } from '@/lib/scroll'

const LINKS: { label: string; hash: string }[] = [
  { label: 'Books', hash: '#books' },
  { label: 'Demos', hash: '#demos' },
  { label: 'Work', hash: '#work' },
  { label: 'About', hash: '#about' },
  { label: 'Contact', hash: '#contact' },
]

export default function Navbar() {
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>('')
  const lastY = useRef(0)

  // Hide on scroll-down past 400px, reappear on scroll-up; blur bar fades in after 80px
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 80)
      if (y > 400 && y > lastY.current + 4) setHidden(true)
      else if (y < lastY.current - 4) setHidden(false)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Active section tracking
  useEffect(() => {
    const sections = LINKS.map((l) => document.querySelector(l.hash)).filter(Boolean) as Element[]
    if (!sections.length) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`)
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  const go = (e: React.MouseEvent, hash: string) => {
    e.preventDefault()
    setOpen(false)
    lockScroll(false) // the effect would do this after commit — too late for scrollToId
    scrollToId(hash)
  }

  // Mobile overlay is a modal: freeze page scroll, close on Escape, move focus in
  // on open and back to the toggle on close, and keep Tab inside the menu.
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    lockScroll(open)
    if (!open) return
    const menu = menuRef.current
    const toggle = toggleRef.current
    const focusables = () =>
      Array.from(menu?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    requestAnimationFrame(() => focusables()[0]?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const items = [...focusables(), toggleRef.current].filter(Boolean) as HTMLElement[]
      if (!items.length) return
      const i = items.indexOf(document.activeElement as HTMLElement)
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === items.length - 1 ? 0 : i + 1
      e.preventDefault()
      items[next].focus()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      toggle?.focus()
    }
  }, [open])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 h-16 transition-transform duration-300',
          hidden && !open ? '-translate-y-full' : 'translate-y-0',
        )}
        onFocus={() => setHidden(false)}
      >
        {/* blurred hairline bar — fades in after 80px of scroll */}
        <div
          className={cn(
            'absolute inset-0 backdrop-blur-[12px] transition-opacity duration-250',
            scrolled ? 'opacity-100' : 'opacity-0',
          )}
          style={{ background: 'rgba(10,9,8,0.72)' }}
        />
        <div
          className={cn(
            'hairline-filament absolute inset-x-0 bottom-0 transition-opacity duration-250',
            scrolled ? 'opacity-100' : 'opacity-0',
          )}
        />
        <nav className="container-x relative flex h-full items-center justify-between">
          <a
            href="#top"
            onClick={(e) => go(e, '#top')}
            className="flex items-center gap-3"
            aria-label="Micheal Lanham — back to top"
          >
            <img src="/logo.svg" alt="" className="h-8 w-8 animate-glow-pulse" />
            <span className="font-mono text-[0.8rem] font-medium tracking-[0.2em] text-ink">
              MICHEAL·LANHAM
            </span>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.hash}
                href={l.hash}
                onClick={(e) => go(e, l.hash)}
                className={cn(
                  'group relative font-mono text-[0.75rem] uppercase tracking-[0.15em] transition-colors duration-200',
                  active === l.hash ? 'text-amber' : 'text-muted hover:text-amber',
                )}
              >
                {/* teal node dot above the link */}
                <span
                  className={cn(
                    'absolute -top-2.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-teal transition-opacity duration-300',
                    active === l.hash ? 'opacity-100 animate-pulse-dot' : 'opacity-0 group-hover:opacity-100',
                  )}
                />
                {l.label}
              </a>
            ))}
            <a
              href="#work"
              onClick={(e) => go(e, '#work')}
              className="rounded-full border border-amber px-4 py-2 font-mono text-[0.75rem] uppercase tracking-[0.15em] text-amber transition-all duration-200 hover:bg-amber hover:text-void"
            >
              Work with me
            </a>
          </div>

          {/* mobile hamburger */}
          <button
            ref={toggleRef}
            className="relative z-[60] flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="site-menu"
          >
            <span
              className={cn(
                'h-px w-6 bg-ink transition-transform duration-200',
                open && 'translate-y-[3.5px] rotate-45',
              )}
            />
            <span
              className={cn(
                'h-px w-6 bg-ink transition-transform duration-200',
                open && '-translate-y-[3.5px] -rotate-45',
              )}
            />
          </button>
        </nav>
      </header>

      {/* mobile full-screen overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-40 flex flex-col justify-center lg:hidden"
            style={{ background: 'rgba(10,9,8,0.97)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <nav className="container-x flex flex-col gap-6">
              {/* a close control that lives inside the dialog, for AT that treats the rest as inert */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="self-end font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted hover:text-amber"
              >
                × Close
              </button>
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.hash}
                  href={l.hash}
                  onClick={(e) => go(e, l.hash)}
                  className="flex items-baseline gap-4 font-display text-3xl font-semibold text-ink transition-colors hover:text-amber"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ delay: 0.06 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="font-mono text-xs text-amber" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                  {l.label}
                </motion.a>
              ))}
              <motion.a
                href="#work"
                onClick={(e) => go(e, '#work')}
                className="btn-amber mt-6 self-start"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.06 * LINKS.length, duration: 0.4 }}
              >
                Work with me
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
