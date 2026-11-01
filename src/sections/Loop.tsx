import { Link } from 'react-router'
import AgentLoop from '@/components/AgentLoop'

export default function Loop() {
  return <section id="loop" tabIndex={-1} className="loop-section section-space">
    <div className="container-x loop-layout">
      <div className="section-heading loop-copy">
        <p className="kicker">How agents improve</p>
        <h2>Systems that learn, adapt, and improve.</h2>
        <p className="section-lede">Whether you are building a first agent or improving one in production, the work tends to follow the same four steps. Gather context, act, look for evidence, and keep only the changes that evidence supports.</p>
        <Link className="text-link mt-4" to="/demos/helix-garden/">See the loop run in Helix Garden <span aria-hidden="true">→</span></Link>
      </div>
      <AgentLoop />
    </div>
  </section>
}
