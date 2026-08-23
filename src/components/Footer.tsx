import { scrollToId } from '@/lib/scroll'

const NAV: { label: string; hash: string }[] = [
  { label: 'Books', hash: '#books' },
  { label: 'Demos', hash: '#demos' },
  { label: 'Work', hash: '#work' },
  { label: 'About', hash: '#about' },
  { label: 'Contact', hash: '#contact' },
]

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative">
      <div className="hairline-filament" />
      <div className="container-x flex flex-col items-center gap-8 py-12 md:flex-row md:justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="h-6 w-6" />
          <span className="font-mono text-xs text-muted">
            © {year} Micheal Lanham · Calgary, Alberta
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-5">
          {NAV.map((l) => (
            <a
              key={l.hash}
              href={l.hash}
              onClick={(e) => {
                e.preventDefault()
                scrollToId(l.hash)
              }}
              className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-faint transition-colors hover:text-amber"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="mailto:cxbxmxcx@micheal-lanham.com"
          className="font-mono text-xs text-muted transition-all duration-200 hover:text-amber hover:drop-shadow-[0_0_10px_rgba(224,155,74,0.5)]"
        >
          cxbxmxcx@micheal-lanham.com
        </a>
      </div>
      <p className="container-x pb-8 text-center font-mono text-[0.7rem] text-faint">
        built by hand with React, GSAP and canvas — no templates, no trackers
      </p>
    </footer>
  )
}
