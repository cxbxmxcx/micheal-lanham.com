import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'

const LINKS = [
  { label: 'Books', to: '/books/' },
  { label: 'Demos', to: '/demos/' },
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(true)
  const location = useLocation()

  useEffect(() => {
    if (!open) return
    const menu = dialog.current!
    const trigger = toggle.current
    const main = document.querySelector('main')!
    const footer = document.querySelector('footer')!
    const header = document.querySelector('header')!
    main.inert = footer.inert = header.inert = true
    const priorOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    menu.querySelector<HTMLButtonElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab') return
      const items = [...menu.querySelectorAll<HTMLElement>('a[href], button')]
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = priorOverflow
      main.inert = footer.inert = header.inert = false
      if (restoreFocus.current) trigger?.focus()
    }
  }, [open])

  const followLink = () => {
    restoreFocus.current = false
    setOpen(false)
    requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1) || 'main')?.focus())
  }

  return <>
    <header className="site-header">
      <nav aria-label="Main navigation" className="container-x flex h-20 items-center justify-between gap-5">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Micheal Lanham — home">
          <img src="/logo.svg" width="32" height="32" alt="" />
          <span className="font-mono text-sm font-medium tracking-[0.12em]">MICHEAL LANHAM</span>
        </Link>
        <div className="hidden items-center gap-7 lg:flex">
          {LINKS.map(link => <Link key={link.to} to={link.to} aria-current={!link.to.includes('#') && location.pathname.startsWith(link.to) ? 'page' : undefined} className="nav-link">{link.label}</Link>)}
          <Link to="/work/" className="btn-amber">Work with me</Link>
        </div>
        <button ref={toggle} type="button" className="menu-toggle lg:hidden" aria-label="Open menu" aria-expanded={open} aria-controls={open ? 'site-menu' : undefined} onClick={() => { restoreFocus.current = true; setOpen(true) }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
        </button>
      </nav>
    </header>
    {open && <div ref={dialog} id="site-menu" role="dialog" aria-modal="true" aria-label="Site menu" className="mobile-menu">
      <button type="button" className="menu-close" onClick={() => setOpen(false)}>Close menu <span aria-hidden="true">×</span></button>
      <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
        <Link to="/" onClick={followLink}>Home</Link>
        {LINKS.map(link => <Link key={link.to} to={link.to} onClick={followLink}>{link.label}</Link>)}
        <Link to="/work/" onClick={followLink} className="text-amber">Work with me</Link>
      </nav>
    </div>}
  </>
}
