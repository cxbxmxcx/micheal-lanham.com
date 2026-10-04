import { useParams } from 'react-router'
import { SERVICES } from '@/data/services'
import PageIntro from '@/components/PageIntro'
import NotFound from './NotFound'

export default function ServiceDetail() {
  const { slug } = useParams()
  const service = SERVICES.find(item => item.slug === slug)
  if (!service) return <NotFound />
  return <article className="container-x pb-20">
    <PageIntro back={{ to: '/work/', label: 'Ways to work together' }} kicker="Work with me" title={service.title}><p>{service.summary}</p></PageIntro>
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">
      <div className="reading-copy">
        <h2>What we can cover</h2><ul>{service.scope.map(line => <li key={line}>{line}</li>)}</ul>
        <h2>Who it helps</h2><p>{service.audience}</p>
        <h2>What to share</h2><ul>{service.inputs.map(line => <li key={line}>{line}</li>)}</ul>
        <h2>What you receive</h2><ul>{service.deliverables.map(line => <li key={line}>{line}</li>)}</ul>
        {service.slug === 'architecture-reviews' && <div className="notice"><h2>A review report, at a glance</h2><p>An illustrative outline, adapted to the agreed scope:</p><ol><li>System goals, constraints, and architecture summary</li><li>Findings grouped by impact, with supporting evidence</li><li>Recommended changes and the reasoning behind them</li><li>Validation steps, open questions, and follow-up priorities</li></ol></div>}
      </div>
      <aside className="service-card lg:sticky lg:top-28"><h2 className="font-display text-xl font-semibold">Plan the engagement</h2><p className="mt-4 leading-relaxed text-muted">{service.format}</p><p className="mt-4 leading-relaxed text-muted">{service.schedule}</p><a className="btn-primary mt-6" href={service.href}>{service.cta}</a><p className="mt-4 text-sm text-muted">Opens an email with a few prompts to get us started.</p></aside>
    </div>
  </article>
}
