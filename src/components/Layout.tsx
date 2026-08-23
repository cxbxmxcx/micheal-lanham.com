import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import Navbar from './Navbar'
import Footer from './Footer'
import Cursor from './Cursor'
import { initSmoothScroll, bindHashNavigation } from '@/lib/scroll'

/**
 * Shared layout — children pattern (Layout wraps <Routes>).
 * The navbar is `fixed`, so Layout owns the 64px top offset on the content
 * slot. Full-bleed sections (the hero) opt out inside the section itself
 * with a matching negative top margin — do not remove this offset.
 *
 * MotionConfig reducedMotion="user" makes every Framer whileInView/initial
 * animation in the tree respect prefers-reduced-motion (transforms and
 * filters are dropped, opacity fades are kept) without touching each one.
 */
export default function Layout({ children }: { children: ReactNode }) {
  useEffect(() => {
    initSmoothScroll()
    return bindHashNavigation()
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-[100dvh] bg-void text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-amber focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.15em] focus:text-void"
        >
          Skip to content
        </a>
        <Cursor />
        <Navbar />
        <main id="main" tabIndex={-1} className="pt-16 outline-none">
          {children}
        </main>
        <Footer />
      </div>
    </MotionConfig>
  )
}
