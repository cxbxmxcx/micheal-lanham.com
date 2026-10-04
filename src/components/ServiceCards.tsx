import { Link } from 'react-router'
import { SERVICES } from '@/data/services'

export default function ServiceCards() {
  return <div className="grid gap-6 md:grid-cols-2">
    {SERVICES.map((service, index) => <article key={service.slug} className="service-card">
      <p className="mb-5 font-mono text-sm text-teal">0{index + 1} / {index === 0 ? 'REVIEW' : 'LEARN'}</p>
      <h3 className="font-display text-2xl font-semibold">{service.title}</h3>
      <p className="mt-3 leading-relaxed text-muted">{service.summary}</p>
      <p className="mt-5 text-sm leading-relaxed text-ink">{index === 0 ? 'A written report with prioritized findings and next steps.' : 'A curriculum tailored to your team, delivered remotely or on-site.'}</p>
      <Link to={`/work/${service.slug}/`} className="text-link mt-auto pt-6">{index === 0 ? 'Explore architecture reviews' : 'Explore team workshops'} <span aria-hidden="true">→</span></Link>
    </article>)}
  </div>
}
