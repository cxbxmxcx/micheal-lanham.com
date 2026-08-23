import SectionShell from '@/components/SectionShell'
import ServicePanel from '@/components/work/ServicePanel'
import type { ServiceSpec } from '@/components/work/ServicePanel'
import ProcessStrip from '@/components/work/ProcessStrip'

const SERVICES: ServiceSpec[] = [
  {
    id: 'reviews',
    filename: 'reviews.manifest.yaml',
    chip: 'By email',
    chipTone: 'green',
    title: 'Agent architecture reviews',
    summary:
      "A structured assessment of an agent system you've already built — or are about to commit to. Where it holds up, where it breaks, and what to do about it.",
    specKey: 'scope:',
    lines: [
      'orchestration & control-flow design',
      'tool & MCP integration patterns',
      'memory, state, & context strategy',
      'evaluation, observability & failure modes',
      'cost, latency & model selection',
    ],
    callout: 'Delivered as a written report with prioritised, actionable findings.',
    cta: 'Request a review',
  },
  {
    id: 'workshops',
    filename: 'workshops.manifest.yaml',
    chip: 'Remote or on-site',
    chipTone: 'teal',
    title: 'AI agent training workshops',
    summary:
      'Hands-on team training built from the same material as the books — practical and code-first, tailored to your stack and experience.',
    specKey: 'curriculum:',
    lines: [
      'agent fundamentals & behaviour patterns',
      'multi-agent collaboration & orchestration',
      'MCP, tool use & A2A communication',
      'building evaluation & feedback loops',
      'deployment & production concerns',
    ],
    credential:
      "// previously: deep learning & reinforcement learning courses through O'Reilly, plus mentorship programmes",
    cta: 'Book a workshop',
  },
]

/**
 * Work With Me (#work) — consulting services as twin holographic manifest
 * panels (mood panel 4), plus the 4-step process strip.
 */
export default function Work() {
  return (
    <SectionShell
      id="work"
      index="03"
      kicker="WORK WITH ME"
      title={
        <>
          Bring a <span className="text-gradient">practitioner</span> into the loop.
        </>
      }
      lede="Architecture reviews and hands-on training for teams building agent systems — from someone who has been wiring neural networks and evolutionary algorithms into real software since the turn of the millennium."
    >
      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        style={{ perspective: '1400px' }}
      >
        {SERVICES.map((spec, i) => (
          <ServicePanel key={spec.id} spec={spec} side={i === 0 ? 'left' : 'right'} />
        ))}
      </div>

      <ProcessStrip />
    </SectionShell>
  )
}
