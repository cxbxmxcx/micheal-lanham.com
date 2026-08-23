import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Height of the fixed navbar; sections also carry a matching scroll-margin-top in index.css. */
const NAV_OFFSET = 64

/**
 * Page-wide Lenis smooth scrolling (lerp 0.09), synced with GSAP ScrollTrigger.
 * Returns null — and leaves native scrolling untouched — when the user has
 * asked for reduced motion. Lenis intercepts wheel input and eases every
 * scroll, which is exactly what that preference opts out of.
 */
export function initSmoothScroll(): Lenis | null {
  if (lenis) return lenis
  if (reducedMotion()) return null
  lenis = new Lenis({ lerp: 0.09 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)
  return lenis
}

/** Pause/resume page scrolling (used while the mobile menu overlay is open). */
export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop()
    else lenis.start()
  }
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}

/**
 * Scroll to an anchor target, offset for the fixed navbar, and record the
 * hash in history so the URL is shareable and back/forward work.
 */
export function scrollToId(hash: string, { updateHash = true }: { updateHash?: boolean } = {}) {
  const el = document.querySelector(hash) as HTMLElement | null
  if (!el) return
  const offset = hash === '#top' ? 0 : -NAV_OFFSET
  if (lenis) {
    // force: the mobile menu calls this in the same tick it unlocks scrolling,
    // and Lenis silently ignores scrollTo while stopped
    lenis.scrollTo(el, { offset, force: true })
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }
  if (updateHash && window.location.hash !== hash) {
    history.pushState(null, '', hash === '#top' ? window.location.pathname : hash)
  }
  // keyboard/AT users should land in the section, not stay on the nav link
  if (hash !== '#top') {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
    el.focus({ preventScroll: true })
  }
}

/**
 * Handle a hash present on initial load (e.g. /#books) and later hashchange
 * events. The browser's native fragment jump fires before React has laid out
 * the sections, so we redo it once layout has settled.
 */
export function bindHashNavigation() {
  const go = () => {
    const hash = window.location.hash
    if (hash && document.querySelector(hash)) scrollToId(hash, { updateHash: false })
  }
  if (window.location.hash) {
    // two frames: one for React commit, one for fonts/images to settle layout
    requestAnimationFrame(() => requestAnimationFrame(go))
  }
  window.addEventListener('hashchange', go)
  return () => window.removeEventListener('hashchange', go)
}
