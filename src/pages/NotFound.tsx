import { Link } from 'react-router'
import PageIntro from '@/components/PageIntro'
import InkSketch from '@/components/InkSketch'

export default function NotFound() {
  return <div className="container-x min-h-[60vh] pb-20">
    <div className="not-found">
      <div><PageIntro kicker="404" title="This page isn’t here."><p>The address may have changed. Explore the books, try a demo, or head back to the homepage.</p></PageIntro><div className="flex flex-wrap gap-4"><Link className="btn-primary" to="/">Back to home</Link><Link className="btn-secondary" to="/books/">Browse books</Link><Link className="btn-secondary" to="/demos/">Try a demo</Link></div></div>
      {/* A specimen drawer with nothing in it. */}
      <figure className="not-found-plate" aria-hidden="true"><InkSketch /><p className="specimen-label">Plate 404 · specimen missing</p></figure>
    </div>
  </div>
}
