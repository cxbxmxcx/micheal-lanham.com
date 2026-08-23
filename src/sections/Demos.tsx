import { useState } from 'react'
import SectionShell from '@/components/SectionShell'
import DemoCard from '@/components/demos/DemoCard'
import type { DemoSpec } from '@/components/demos/DemoCard'

const DEMOS: DemoSpec[] = [
  {
    id: 'proof-gate',
    index: '01',
    title: 'The Proof Gate',
    description:
      'You are the gate on a self-improving machine. Three short acts from chapters 3–4 of Self-Improving Agents (Manning): the Gödel proof gate that almost never opens, gating on signals with a budget, and the Darwin Gödel Machine’s archive. Five minutes, no reading required.',
    poster: '/demo-proof-gate.webp',
    src: '/demos/Proof_Gate/',
    chips: ['Story · new', '5 min'],
  },
  {
    id: 'helix-garden',
    index: '02',
    title: 'Helix Garden',
    description:
      'A playable harness from Self-Improving Agents (Manning) — starts with a 90-second guided intro, no reading required. Creatures run a sense-plan-act-learn loop; you run the book’s improvement loop around them and gate what ships.',
    poster: '/demo-helix-garden.webp',
    src: '/demos/Helix_Garden/',
    chips: ['Canvas · new', '0.03 MB'],
  },
  {
    id: 'perceptron',
    index: '03',
    title: 'The Perceptron Game',
    description:
      'Set weights by hand and watch a single perceptron fit data — the simplest possible neural network, made visible.',
    poster: '/demo-perceptron.webp',
    src: '/demos/Perceptron_Game/',
    chips: ['Unity WebGL', '~5 MB'],
  },
  {
    id: 'mlp',
    index: '04',
    title: 'The Multilayer Perceptron Game',
    description:
      'Add hidden layers and see how MLPs solve problems a single perceptron cannot.',
    poster: '/demo-mlp.webp',
    src: '/demos/MLP_Game/',
    chips: ['Unity WebGL', '~5 MB'],
  },
  {
    id: 'autoencoder',
    index: '05',
    title: 'The Autoencoder Game',
    description:
      'Encode and reconstruct — watch an encoder/decoder pair learn a compressed representation.',
    poster: '/demo-autoencoder.webp',
    src: '/demos/Autoencoder_Game/',
    chips: ['Unity WebGL', '~5 MB'],
  },
]

const RAIN_GLYPHS = '01{}λ∂·+×=∇ƒ'.split('')

/**
 * Interactive Demos (#demos) — D6 holographic demo frames. Three playable
 * Unity WebGL builds in tilting holo-panels; iframes mount only on user
 * launch, one demo runs at a time.
 */
export default function Demos() {
  // one-at-a-time runtime guard: launching a second demo auto-closes the first
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <SectionShell
      id="demos"
      index="02"
      kicker="PLAYABLE THEORY"
      title={
        <>
          Don&rsquo;t read about neural nets. <span className="text-gradient">Operate</span> one.
        </>
      }
      lede="Five interactive demos: two playable companions to Self-Improving Agents — a story game about the three gates, and a full evolution sandbox — plus three Unity WebGL neural-network games."
      className="overflow-hidden bg-void-2/50"
    >
      {/* scoped section styles — scan sweep, border spin, glitch, code rain, bloom drift */}
      <style>{`
        @property --demo-angle { syntax: '<angle>'; initial-value: 135deg; inherits: false; }
        .demo-holo {
          border: 1px solid transparent;
          background:
            linear-gradient(160deg, rgba(224,155,74,0.08), rgba(62,158,150,0.06) 55%, transparent) padding-box,
            linear-gradient(rgba(20,17,13,0.72), rgba(20,17,13,0.72)) padding-box,
            linear-gradient(var(--demo-angle), rgba(224,155,74,0.45), rgba(62,158,150,0.35)) border-box;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: inset 0 1px 0 rgba(242,237,228,0.05);
        }
        @keyframes demo-border-spin { to { --demo-angle: 495deg; } }
        .demo-tilt:hover .demo-holo { animation: demo-border-spin 3s linear infinite; }
        @keyframes demo-scan { 0% { top: -2%; opacity: 0; } 8% { opacity: 1; } 92% { opacity: 1; } 100% { top: 102%; opacity: 0; } }
        .demo-scan { animation: demo-scan 4s linear infinite; }
        .demo-tilt:hover .demo-scan { animation-duration: 1.5s; }
        @keyframes demo-glitch {
          0% { opacity: 1; transform: translate(0, 0); }
          20% { opacity: 0.35; transform: translate(-3px, 1px); }
          40% { opacity: 1; transform: translate(2px, -1px); }
          60% { opacity: 0.5; transform: translate(-1px, 0); }
          100% { opacity: 1; transform: translate(0, 0); }
        }
        .demo-glitch { animation: demo-glitch 0.3s steps(2, end) 1; }
        @keyframes demo-rain { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        .demo-rain { animation: demo-rain 26s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .demo-tilt:hover .demo-holo,
          .demo-scan,
          .demo-glitch,
          .demo-rain { animation: none; }
          .demo-scan { opacity: 0; }
        }
      `}</style>

      {/* ambient background — two out-of-focus spark blooms + faint code-rain column */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="grad-spark animate-divider-drift absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full opacity-30 blur-3xl"
          style={{ animationDuration: '20s' }}
        />
        <div
          className="grad-spark animate-divider-drift absolute -bottom-48 -right-40 h-[520px] w-[520px] rounded-full opacity-30 blur-3xl"
          style={{
            animationDuration: '24s',
            animationDelay: '-8s',
            background: 'radial-gradient(circle, #3E9E96 0%, #1E5A55 45%, transparent 70%)',
          }}
        />
        <div className="absolute inset-y-0 left-0 hidden w-10 overflow-hidden opacity-[0.04] lg:block">
          <div className="demo-rain flex flex-col items-center gap-4 font-mono text-sm text-ink">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex flex-col items-center gap-4">
                {Array.from({ length: 36 }, (_, i) => (
                  <span key={i}>{RAIN_GLYPHS[(i * 7 + copy * 3) % RAIN_GLYPHS.length]}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {/* inline mono chips for the hard facts */}
        <div className="-mt-8 mb-10 flex flex-wrap gap-2">
          <span className="rounded-full border border-amber/40 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-amber">
            5 playable demos
          </span>
          <span className="rounded-full border border-teal/40 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-teal">
            Desktop browser
          </span>
        </div>

        {/* shallow 3D perspective field — cards converge to flat on scroll-in */}
        <div
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
          style={{ perspective: '1200px' }}
          data-active={activeId ?? undefined}
        >
          {DEMOS.map((spec, i) => (
            <DemoCard
              key={spec.id}
              spec={spec}
              side={i === 0 ? 'left' : i === 2 ? 'right' : 'middle'}
              order={i}
              active={activeId === spec.id}
              onLaunch={(id) => setActiveId(id)}
              onClose={() => setActiveId(null)}
            />
          ))}
        </div>

        <p className="mt-8 font-mono text-[0.75rem] tracking-[0.04em] text-faint">
          Demos open at full width when launched; use &ldquo;Open full size&rdquo; for a dedicated tab.
          The Unity builds are ~5 MB each and need WebGL.
        </p>
      </div>
    </SectionShell>
  )
}
