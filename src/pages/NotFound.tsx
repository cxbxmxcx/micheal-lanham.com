import { Link } from 'react-router'
import PageIntro from '@/components/PageIntro'

export default function NotFound() {
  return <div className="container-x min-h-[60vh] pb-20"><PageIntro kicker="404" title="This page isn’t here."><p>The address may have changed. Explore the books, try a demo, or head back to the homepage.</p></PageIntro><div className="flex flex-wrap gap-4"><Link className="btn-amber" to="/">Back to home</Link><Link className="btn-ghost-teal" to="/books/">Browse books</Link></div></div>
}
