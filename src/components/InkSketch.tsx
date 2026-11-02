import { ink } from '@/lib/ink'

/** After Darwin's 1837 "I think" notebook sketch: a tree of descent in ink.
 * Decorative: the caller hides it from assistive technology. */
export default function InkSketch() {
  return <svg className="ink-sketch" viewBox="0 0 220 200">
    <text x="18" y="26" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontSize="20" fill="currentColor" stroke="none">I think</text>
    <path {...ink(0)} d="M40 182 C 44 150, 60 140, 72 120 C 84 100, 86 84, 104 70" />
    <path {...ink(1)} d="M72 120 C 92 122, 108 112, 126 100 C 144 88, 160 92, 176 78" />
    <path {...ink(2)} d="M104 70 C 116 58, 120 46, 138 40" />
    <path {...ink(2)} d="M104 70 C 96 54, 92 46, 98 30" />
    <path {...ink(2)} d="M126 100 C 132 116, 146 124, 162 126" />
    <path {...ink(1)} d="M60 140 C 46 130, 36 120, 30 104" />
    <path {...ink(3)} d="M138 40 h 12 M98 30 v -10 M176 78 l 10 -6 M162 126 l 12 2 M30 104 l -8 -8" />
    <circle {...ink(0)} cx="40" cy="182" r="3" />
    <text x="44" y="196" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="currentColor" stroke="none">1</text>
  </svg>
}
