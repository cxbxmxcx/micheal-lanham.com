import type { ReactNode } from 'react'

// Brass line emblems for the three concept games, as drawn in the approved mockup.
const EMBLEMS: Record<string, ReactNode> = {
  // A branching tree of variants, after Darwin's sketch.
  'selection-engine': <><path d="M60 104 V70 M60 70 C 40 60 30 44 24 22 M60 70 C 76 58 86 46 92 24 M60 86 C 74 82 92 76 104 64 M24 22 h -8 M92 24 h 8 M104 64 l 8 -4" /><circle cx="24" cy="22" r="4" /><circle cx="92" cy="24" r="4" /><circle cx="104" cy="64" r="4" /></>,
  // A sealed oracle on its plinth, with three routes beneath it.
  'instinct-engine': <><circle cx="60" cy="46" r="26" /><circle cx="60" cy="46" r="10" /><path d="M8 96 h104 M20 96 v-10 h16 v10 M52 96 v-10 h16 v10 M84 96 v-10 h16 v10 M60 72 v14" /></>,
  // A times table beside a gear.
  'difference-engine': <><rect x="10" y="12" width="56" height="56" /><path d="M10 26 h56 M10 40 h56 M10 54 h56 M24 12 v56 M38 12 v56 M52 12 v56" /><circle cx="92" cy="74" r="20" /><circle cx="92" cy="74" r="7" /><path d="M92 50 v-6 M92 98 v6 M68 74 h-6 M116 74 h6" /></>,
}

export default function EngineEmblem({ slug }: { slug: string }) {
  if (!EMBLEMS[slug]) return null
  return <div className="engine-emblem" aria-hidden="true"><svg viewBox="0 0 120 110">{EMBLEMS[slug]}</svg></div>
}
