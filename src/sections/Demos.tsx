import { Link } from 'react-router'
import { DEMOS } from '@/data/demos'
import SectionShell from '@/components/SectionShell'

export default function Demos() {
  const [featured, ...others] = DEMOS
  return <SectionShell id="demos" kicker="Learn by doing" title="Put an idea to the test." lede="Five demos run in your browser. Start with The Proof Gate, a five-minute story about when a self-improving machine has earned the right to change." className="lab-band">
    <div className="lab-home">
      <article className="lab-feature">
        <Link to={`/demos/${featured.slug}/`} tabIndex={-1} aria-hidden="true"><img src={featured.poster} width="960" height="600" alt="" loading="lazy" /></Link>
        <div className="lab-feature-copy">
          <p className="lab-meta">{featured.duration} · No account needed</p>
          <h3>{featured.title}</h3>
          <p>{featured.description} Explore proof, evidence, and the judgment behind shipping an improvement.</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a className="btn-lab" href={featured.playUrl}>Play The Proof Gate (5 min)</a>
            <Link className="lab-link" to="/demos/">See all five demos <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </article>
      <ul className="lab-tiles" aria-label="More demos">
        {others.map(demo => <li key={demo.slug}><Link to={`/demos/${demo.slug}/`}>
          <img src={demo.poster} width="960" height="600" alt="" loading="lazy" />
          <span className="lab-tile-title">{demo.title}</span>
          <span className="lab-tile-meta">{demo.kind === 'Browser' ? 'Runs in your browser' : 'Desktop · Unity WebGL'}</span>
        </Link></li>)}
      </ul>
    </div>
  </SectionShell>
}
