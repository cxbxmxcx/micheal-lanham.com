import type { CSSProperties } from 'react'

/** Props for one stroke of an ink drawing. When motion is on, index.css draws
 * the strokes in the order of `i` (ink-draw). */
export const ink = (i: number) => ({ pathLength: 1, style: { '--i': i } as CSSProperties })
