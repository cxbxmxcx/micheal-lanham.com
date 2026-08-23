import { useId } from 'react'

const PUBLISHERS = ['MANNING', "O'REILLY", 'APRESS', 'PACKT', 'BPB']

/**
 * Publisher marquee — infinite mono loop (28s linear), pauses on hover,
 * `--faint` at 70% opacity, `✦` amber separators, edges masked to void.
 * Full-viewport-width bleed; scoped CSS so index.css stays untouched.
 */
export default function PublisherMarquee() {
  const id = useId().replace(/:/g, '')
  const scope = `pubmarquee-${id}`

  const run = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === 'b'}>
      {Array.from({ length: 3 }, (_, rep) =>
        PUBLISHERS.map((p) => (
          <span key={`${rep}-${p}`} className="flex items-center">
            <span className="px-6 font-mono text-sm font-medium tracking-[0.28em] text-faint">
              {p}
            </span>
            <span className="text-[0.7rem] text-amber" aria-hidden>
              ✦
            </span>
          </span>
        )),
      )}
    </div>
  )

  return (
    <div className={`${scope} group relative w-full overflow-hidden py-8`}>
      <ul className="sr-only">
        {PUBLISHERS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <style>{`
        .${scope} .mq-track {
          display: flex;
          width: max-content;
          animation: ${scope}-scroll 28s linear infinite;
        }
        .${scope}:hover .mq-track { animation-play-state: paused; }
        @keyframes ${scope}-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .${scope} .mq-track { animation: none; }
        }
      `}</style>

      {/* edge fade masks to void */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-void to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-void to-transparent"
      />

      <div className="mq-track" aria-hidden>
        {run('a')}
        {run('b')}
      </div>
    </div>
  )
}
