import { Link, useParams } from 'react-router'
import MoreDemos from '@/components/MoreDemos'
import PageIntro from '@/components/PageIntro'
import DemoPlayer from '@/components/DemoPlayer'
import { DEMOS, UNITY_CONTROLS, UNITY_GUIDES } from '@/data/demos'
import { BOOKS } from '@/data/books'
import NotFound from './NotFound'
import { transitionName } from '@/lib/motion'
import { responsiveImage } from '@/lib/images'

export default function DemoDetail() {
  const { slug } = useParams()
  const demo = DEMOS.find(item => item.slug === slug)
  if (!demo) return <NotFound />
  const guide = UNITY_GUIDES[demo.slug]
  const book = BOOKS.find(item => item.slug === demo.bookSlug)
  return <article className="container-x pb-20"><PageIntro back={{ to: '/demos/', label: 'All demos' }} kicker={`Interactive learning · ${demo.duration}`} title={demo.title}><p>{demo.description}</p></PageIntro>
    <div className="grid items-center gap-8 md:grid-cols-2"><img className="w-full rounded-card border border-line" {...responsiveImage(demo.poster, '(min-width: 768px) 580px, calc(100vw - 40px)')} alt={`${demo.title} preview`} fetchPriority="high" style={transitionName('poster', demo.slug)} /><div className="reading-copy"><h2>What you’ll explore</h2><p>{demo.outcome}</p>{book && <p>A playable companion to <Link className="text-link" to={`/books/${book.slug}/`}>{book.title}</Link>.</p>}<p className="text-sm">{demo.kind === 'Unity WebGL' ? 'This original Unity teaching demo requires a desktop browser with WebGL support.' : 'Runs in your browser. No account or installation required.'}</p></div></div>
    {guide && <div className="mt-12 grid gap-8 md:grid-cols-2 lg:gap-14">
      <div className="reading-copy"><h2 id="how-to-play">How to play</h2><ol>{guide.steps.map(step => <li key={step}>{step}</li>)}</ol><p>{UNITY_CONTROLS}</p></div>
      <div className="reading-copy"><h2>What the game shows</h2><p>{guide.summary}</p></div>
    </div>}
    <DemoPlayer key={demo.slug} demo={demo} />
    <MoreDemos current={demo.slug} />
  </article>
}
