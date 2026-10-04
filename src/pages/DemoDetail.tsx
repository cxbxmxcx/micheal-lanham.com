import { Link, useParams } from 'react-router'
import PageIntro from '@/components/PageIntro'
import DemoPlayer from '@/components/DemoPlayer'
import { DEMOS } from '@/data/demos'
import NotFound from './NotFound'

export default function DemoDetail() {
  const { slug } = useParams()
  const demo = DEMOS.find(item => item.slug === slug)
  if (!demo) return <NotFound />
  return <article className="container-x pb-20"><PageIntro back={{ to: '/demos/', label: 'All demos' }} kicker={`Interactive learning · ${demo.duration}`} title={demo.title}><p>{demo.description}</p></PageIntro>
    <div className="grid items-center gap-8 md:grid-cols-2"><img className="w-full rounded-card border border-line" src={demo.poster} alt={`${demo.title} preview`} width="960" height="600" /><div className="reading-copy"><h2>What you’ll explore</h2><p>{demo.outcome}</p>{demo.bookSlug && <p>A playable companion to <Link className="text-link" to={`/books/${demo.bookSlug}/`}>Self-Improving Agents</Link>.</p>}<p className="text-sm">{demo.kind === 'Unity WebGL' ? 'This original Unity teaching demo requires a desktop browser with WebGL support.' : 'Runs in your browser. No account or installation required.'}</p></div></div>
    <DemoPlayer key={demo.slug} demo={demo} />
  </article>
}
