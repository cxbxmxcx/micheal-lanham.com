import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { PAGE_PATHS } from '@/lib/metadata'

// Motion is an enhancement. A small script in index.html adds `motion` to
// <html> before the first paint, but only when the visitor allows motion.
// Without it (no JavaScript, prefers-reduced-motion, or an app that never
// started) every element is shown in its final state.
export const motionAllowed = () => typeof document !== 'undefined' && document.documentElement.classList.contains('motion')

/** Reveals [data-reveal] elements as they scroll into view. index.css keeps them
 * hidden until then, but only under .motion. Marks <html> `motion-ready` so the
 * failsafe in index.html leaves motion on. */
export function useReveal(pathname: string) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('motion-ready')
    if (!motionAllowed() || !('IntersectionObserver' in window)) return
    // The observer reveals blocks as they enter. The sweep also reveals any block
    // whose top has already reached the trigger line: blocks the visitor scrolled
    // or jumped past before setup, or flung past between two frames, which an
    // observer never reports. It reads every position before changing any class.
    let observer: IntersectionObserver | undefined
    let frame = 0
    const reveal = (element: Element) => { element.classList.add('is-in'); observer?.unobserve(element) }
    const sweep = () => {
      frame = 0
      const line = window.innerHeight * 0.88
      const reached = [...document.querySelectorAll('[data-reveal]:not(.is-in)')].filter(element => element.getBoundingClientRect().top < line)
      reached.forEach(reveal)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(sweep) }
    // Set up in a task of its own, so motion never lengthens hydration.
    const timer = window.setTimeout(() => {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) reveal(entry.target)
      }, { rootMargin: '0px 0px -12% 0px' })
      document.querySelectorAll('[data-reveal]:not(.is-in)').forEach(element => observer!.observe(element))
      sweep()
      window.addEventListener('scroll', onScroll, { passive: true })
    })
    // A keyboard user tabbing ahead never lands on something still hidden.
    const onFocus = (event: FocusEvent) => { const block = (event.target as Element | null)?.closest?.('[data-reveal]:not(.is-in)'); if (block) reveal(block) }
    document.addEventListener('focusin', onFocus)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('focusin', onFocus)
    }
  }, [pathname])
}

/** Tilts [data-tilt] cards toward the pointer, with a brass glare where it points.
 * Mouse and pen only; touch screens keep the cards still. */
export function useTilt() {
  useEffect(() => {
    if (!motionAllowed() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let card: HTMLElement | null = null
    let frame = 0
    const reset = () => {
      if (!card) return
      card.classList.remove('is-tilting')
      for (const name of ['--tilt-x', '--tilt-y']) card.style.removeProperty(name)
      card = null
    }
    const move = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest?.<HTMLElement>('[data-tilt]') ?? null
      if (target !== card) reset()
      if (!target) return
      card = target
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = target.getBoundingClientRect()
        const x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height
        target.classList.add('is-tilting')
        target.style.setProperty('--tilt-x', `${((0.5 - y) * 6).toFixed(2)}deg`)
        target.style.setProperty('--tilt-y', `${((x - 0.5) * 8).toFixed(2)}deg`)
        target.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`)
        target.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`)
      })
    }
    document.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', reset)
    return () => {
      cancelAnimationFrame(frame)
      reset()
      document.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', reset)
    }
  }, [])
}

// Page transitions: a link click inside the site runs the navigation inside
// document.startViewTransition, and a book cover or demo poster in the clicked
// link morphs into the large one on the page it opens. Layout calls
// routeCommitted() once the new page has rendered.
let commitPending: (() => void) | null = null
export function routeCommitted() {
  const done = commitPending
  commitPending = null
  done?.()
}

type TransitionDocument = Document & { startViewTransition?: (update: () => Promise<void>) => { finished: Promise<void> } }

export function useRouteTransitions() {
  const navigate = useNavigate()
  useEffect(() => {
    const doc = document as TransitionDocument
    if (!motionAllowed() || typeof doc.startViewTransition !== 'function') return
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]')
      // The mobile menu manages its own focus; new tabs, downloads and other sites are left alone.
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download') || link.closest('[role="dialog"]')) return
      const url = new URL(link.href)
      if (url.origin !== window.location.origin || url.hash || url.pathname === window.location.pathname || !PAGE_PATHS.includes(url.pathname)) return
      event.preventDefault()
      const [, section, slug] = url.pathname.split('/')
      const art = slug ? link.querySelector<HTMLElement>('img, .book-type-cover') : null
      if (art) art.style.setProperty('view-transition-name', `${section === 'books' ? 'cover' : 'poster'}-${slug}`)
      const transition = doc.startViewTransition!(() => new Promise<void>(resolve => {
        // Never hold the page: resolve after 900 ms even if the route is slow.
        const timer = window.setTimeout(() => { commitPending = null; resolve() }, 900)
        commitPending = () => { window.clearTimeout(timer); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); resolve() }
        navigate(url.pathname + url.search)
      }))
      transition.finished.finally(() => art?.style.removeProperty('view-transition-name'))
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [navigate])
}

/** The view-transition-name a detail page gives its large cover or poster. */
export const transitionName = (kind: 'cover' | 'poster', slug: string) => ({ viewTransitionName: `${kind}-${slug}` })
