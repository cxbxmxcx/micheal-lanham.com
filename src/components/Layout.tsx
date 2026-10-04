import { useEffect, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigationType } from 'react-router'
import Navbar from './Navbar'
import Footer from './Footer'
import { getMetadata, getStructuredData } from '@/lib/metadata'

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, { left: number; top: number }>())
  const previous = useRef<{ pathname: string; hash: string } | null>(null)
  useEffect(() => {
    const priorRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = priorRestoration }
  }, [])
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
    let schema = document.getElementById('page-schema')
    if (!schema) {
      schema = document.createElement('script')
      schema.id = 'page-schema'
      schema.setAttribute('type', 'application/ld+json')
      document.head.appendChild(schema)
    }
    schema.textContent = JSON.stringify(getStructuredData(location.pathname))
    const robots = document.querySelector('meta[name="robots"]')
    if (meta.noindex && !robots) {
      const element = document.createElement('meta')
      element.name = 'robots'; element.content = 'noindex'; document.head.appendChild(element)
    } else if (!meta.noindex) robots?.remove()
  }, [location.pathname])

  useLayoutEffect(() => {
    const prior = previous.current
    const changedPage = !prior || prior.pathname !== location.pathname || prior.hash !== location.hash
    previous.current = { pathname: location.pathname, hash: location.hash }
    const saved = navigationType === 'POP' ? positions.current.get(location.key) : undefined
    const remember = () => positions.current.set(location.key, { left: window.scrollX, top: window.scrollY })
    const frame = requestAnimationFrame(() => {
      let id = location.hash.slice(1) || 'main'
      try { id = decodeURIComponent(id) } catch { /* Treat malformed fragments as literal IDs. */ }
      const target = document.getElementById(id)
      if (saved) window.scrollTo({ ...saved, behavior: 'instant' })
      else if (changedPage && location.hash && target) target.scrollIntoView()
      else if (changedPage && prior) window.scrollTo({ top: 0, behavior: 'instant' })
      if (changedPage && (prior || location.hash) && target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
      }
      remember()
      window.addEventListener('scroll', remember, { passive: true })
      document.addEventListener('click', remember, true)
    })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', remember)
      document.removeEventListener('click', remember, true)
    }
  }, [location.pathname, location.hash, location.key, navigationType])

  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <Navbar />
    <main id="main" tabIndex={-1}>{children}</main>
    <Footer />
  </>
}
