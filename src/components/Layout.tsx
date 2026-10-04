import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import Navbar from './Navbar'
import Footer from './Footer'
import { getMetadata } from '@/lib/metadata'

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const first = useRef(true)
  useEffect(() => {
    const meta = getMetadata(location.pathname)
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', meta.canonical)
    for (const [property, value] of Object.entries({ 'og:title': meta.title, 'og:description': meta.description, 'og:url': meta.canonical })) {
      document.querySelector(`meta[property="${property}"]`)?.setAttribute('content', value)
    }
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', meta.title)
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', meta.description)
    const robots = document.querySelector('meta[name="robots"]')
    if (meta.noindex && !robots) {
      const element = document.createElement('meta')
      element.name = 'robots'; element.content = 'noindex'; document.head.appendChild(element)
    } else if (!meta.noindex) robots?.remove()
    const initial = first.current
    first.current = false
    const frame = requestAnimationFrame(() => {
      let id = location.hash.slice(1) || 'main'
      try { id = decodeURIComponent(id) } catch { /* Treat malformed fragments as literal IDs. */ }
      const target = document.getElementById(id)
      if (location.hash && target) target.scrollIntoView()
      else if (!initial) window.scrollTo({ top: 0, behavior: 'instant' })
      if ((!initial || location.hash) && target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.hash])

  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <Navbar />
    <main id="main" tabIndex={-1}>{children}</main>
    <Footer />
  </>
}
