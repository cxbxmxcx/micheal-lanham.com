import { Link } from 'react-router'
import type { Demo } from '@/data/demos'
import { loadingProps, responsiveImage } from '@/lib/images'

export default function DemoPreview({ demo, featured = false }: { demo: Demo; featured?: boolean }) {
  return <article className={featured ? 'demo-preview demo-preview-featured' : 'demo-preview'}>
    <Link to={`/demos/${demo.slug}/`} tabIndex={-1} aria-hidden="true"><img {...responsiveImage(demo.poster, featured ? '(min-width: 1024px) 640px, calc(100vw - 64px)' : '(min-width: 768px) 560px, calc(100vw - 64px)')} alt="" {...loadingProps(featured ? 'high' : 'lazy')} /></Link>
    <div className="demo-preview-copy">
      {featured && <p className="kicker mb-2">Start here</p>}
      <p className="lab-meta">{demo.duration}</p>
      <h2>{demo.title}</h2>
      <p className="demo-preview-text">{demo.description}</p>
      <p className="demo-preview-device">{demo.device}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-5">
        {demo.kind === 'Browser' && <a className="btn-lab" href={demo.playUrl}>Play {demo.title}</a>}
        <Link className="lab-link" to={`/demos/${demo.slug}/`}>Explore {demo.title} <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  </article>
}
