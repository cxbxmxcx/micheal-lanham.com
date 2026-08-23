import { motion } from 'framer-motion'
import SectionShell from '@/components/SectionShell'
import PortraitPanel from '@/components/about/PortraitPanel'
import PublisherMarquee from '@/components/about/PublisherMarquee'
import CareerPhylogeny from '@/components/about/CareerPhylogeny'

const FACTS: { label: string; value: string }[] = [
  { label: 'BASED IN', value: 'Calgary, Alberta, Canada' },
  { label: 'FOCUS', value: 'AI agents · evolutionary computation · generative systems' },
  { label: 'AVAILABLE FOR', value: 'Architecture reviews · training workshops' },
  { label: 'PUBLISHERS', value: "Manning · O'Reilly · Apress · Packt · BPB" },
]

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

export default function About() {
  return (
    <SectionShell
      id="about"
      index="04"
      kicker="THE OPERATOR"
      className="bg-void-2/50"
      title={
        <>
          Twenty years <span className="text-gradient">before it was fashionable.</span>
        </>
      }
    >
      {/* ---------- 2-col split: portrait (5) / bio + facts (7) ---------- */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <PortraitPanel />
        </div>

        <div className="lg:col-span-7">
          {/* bio copy — block reveals, staggered 150ms */}
          <motion.div
            className="space-y-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.15 } },
            }}
          >
            <motion.p
              className="text-lg leading-[1.75] text-ink"
              variants={{
                hidden: { opacity: 0, y: 32, filter: 'blur(4px)' },
                show: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: { duration: 0.7, ease: EASE },
                },
              }}
            >
              Micheal Lanham is a distinguished software and technology innovator with
              more than 20 years in the industry, spanning gaming, graphics, web, desktop
              engineering, AI, GIS, oil &amp; gas geoscience and geomechanics, and machine
              learning. He began working with neural networks and evolutionary algorithms
              in game development at the turn of the millennium — long before either was
              fashionable.
            </motion.p>
            <motion.p
              className="leading-[1.75] text-muted"
              variants={{
                hidden: { opacity: 0, y: 32, filter: 'blur(4px)' },
                show: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: { duration: 0.7, ease: EASE },
                },
              }}
            >
              The thread through it all is systems that improve themselves: genetic
              algorithms and neural architecture search (
              <span className="text-amber">Evolutionary Deep Learning</span>), generative
              models (<span className="text-amber">Generating a New Reality</span>), and
              now{' '}
              <span className="text-amber">
                self-improving, instinctual agent systems (in development)
              </span>
              .
            </motion.p>
          </motion.div>

          {/* fact grid — 2×2 holographic mini-panels */}
          <motion.dl
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
            }}
          >
            {FACTS.map((f) => (
              <motion.div
                key={f.label}
                className="group holo-panel rounded-card border-panel-line p-4 transition-shadow duration-250 hover:shadow-glow-teal"
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.55, ease: EASE },
                  },
                }}
              >
                <dt className="font-mono text-[0.7rem] tracking-[0.2em] text-faint transition-colors duration-200 group-hover:text-amber">
                  {f.label}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink">{f.value}</dd>
              </motion.div>
            ))}
          </motion.dl>
        </div>
      </div>

      {/* ---------- publisher marquee (full-width bleed) ---------- */}
      <div className="relative left-1/2 mt-6 w-screen -translate-x-1/2">
        <PublisherMarquee />
      </div>

      {/* ---------- career phylogeny timeline band ---------- */}
      <CareerPhylogeny />
    </SectionShell>
  )
}
