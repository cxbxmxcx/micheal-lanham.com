import { Link } from 'react-router'
import { DEMOS } from '@/data/demos'
import SectionShell from '@/components/SectionShell'

export default function Demos() {
  const demo = DEMOS[0]
  return <SectionShell id="demos" kicker="Learn by doing" title={<>Put an idea <span className="text-accent">to the test.</span></>} className="border-y border-line bg-surface-soft">
    <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-14">
      <Link to="/demos/proof-gate/" tabIndex={-1} aria-hidden="true"><img className="w-full rounded-card border border-line" src={demo.poster} width="960" height="600" alt="" loading="lazy" /></Link>
      <div><p className="text-sm text-teal">About 5 minutes · No account needed</p><h3 className="mt-3 font-display text-3xl font-semibold">The Proof Gate</h3><p className="mt-4 text-lg leading-relaxed text-muted">{demo.description} Explore proof, evidence, and the judgment behind shipping an improvement.</p><div className="mt-6 flex flex-wrap gap-4"><Link className="btn-primary" to="/demos/proof-gate/">Try The Proof Gate</Link><Link className="text-link" to="/demos/">Explore all five demos →</Link></div></div>
    </div>
  </SectionShell>
}
