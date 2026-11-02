import type { ReactNode } from 'react'
import { ink } from '@/lib/ink'

// Ink drawings for the two services, in the hand of the hero's notebook sketch.
// They draw themselves as the cards reveal (index.css: .service-ink).
const DRAWINGS: Record<string, ReactNode> = {
  // A system's parts, one of them examined under a lens.
  'architecture-reviews': <>
    <path {...ink(0)} d="M16 64 C 21 52, 29 41, 40 30" />
    <path {...ink(0)} d="M40 30 C 44 43, 48 54, 55 64" />
    <path {...ink(1)} d="M16 64 C 29 67, 42 67, 55 64" />
    <path {...ink(1)} d="M40 30 C 50 27, 60 29, 69 34" />
    <circle {...ink(0)} cx="16" cy="64" r="4" />
    <circle {...ink(0)} cx="40" cy="30" r="4" />
    <circle {...ink(1)} cx="55" cy="64" r="4" />
    <circle {...ink(2)} cx="84" cy="38" r="15" />
    <circle {...ink(2)} cx="84" cy="38" r="4.5" />
    <path {...ink(3)} className="ink-heavy" d="M95 49 L109 63" />
  </>,
  // An open notebook: notes on one page, a learning loop on the other.
  workshops: <>
    <path {...ink(0)} d="M60 24 C 46 16, 28 15, 12 20 V 70 C 28 65, 46 66, 60 74" />
    <path {...ink(0)} d="M60 24 C 74 16, 92 15, 108 20 V 70 C 92 65, 74 66, 60 74" />
    <path {...ink(1)} d="M60 24 V 74" />
    <path {...ink(2)} d="M20 33 C 30 30, 40 30, 50 33 M20 43 C 30 40, 40 40, 50 43 M20 53 C 28 50, 36 50, 43 52" />
    <path {...ink(2)} d="M95 45 A 11 11 0 1 1 84 34" />
    <path {...ink(3)} d="M80 30.5 L84 34 L80 37.5" />
  </>,
}

export default function ServiceInk({ slug }: { slug: string }) {
  if (!DRAWINGS[slug]) return null
  return <svg className="service-ink" viewBox="0 0 120 84" aria-hidden="true">{DRAWINGS[slug]}</svg>
}
