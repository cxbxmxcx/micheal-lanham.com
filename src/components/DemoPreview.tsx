import { Link } from 'react-router'
import type { Demo } from '@/data/demos'

export default function DemoPreview({ demo }: { demo: Demo }) {
  return <article className="demo-preview">
    <Link to={`/demos/${demo.slug}/`} tabIndex={-1} aria-hidden="true"><img src={demo.poster} alt="" width="960" height="600" loading="lazy" /></Link>
    <div className="flex flex-1 flex-col p-6">
      <p className="text-sm text-teal">{demo.duration}</p>
      <h2 className="mt-3 font-display text-2xl font-semibold">{demo.title}</h2>
      <p className="mt-3 leading-relaxed text-muted">{demo.description}</p>
      <p className="mt-4 text-sm text-muted">{demo.device}</p>
      <Link className="text-link mt-auto pt-5" to={`/demos/${demo.slug}/`}>Explore {demo.title} <span aria-hidden="true">→</span></Link>
    </div>
  </article>
}
