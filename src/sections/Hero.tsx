import { Link } from 'react-router'
import NeuralSwarm from '@/components/NeuralSwarm'
import { PUBLISHED_BOOKS, UPCOMING_BOOKS } from '@/data/books'

export default function Hero() {
  return <section id="top" className="hero-section">
    <div className="hero-art" aria-hidden="true"><NeuralSwarm /></div>
    <div className="container-x relative">
      <p className="kicker">Micheal Lanham · Author &amp; AI practitioner</p>
      <h1>Systems that <span className="text-gradient">learn, adapt,</span><br className="hidden sm:block" /> and improve.</h1>
      <p className="hero-lede">I write books and build software around AI agents and evolutionary learning. I help teams design better agent systems through architecture reviews and hands-on training.</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link className="btn-amber" to="/work/">Work with me <span aria-hidden="true">↗</span></Link>
        <Link className="btn-ghost-teal" to="/books/">Explore the books</Link>
      </div>
      <Link to="/demos/proof-gate/" className="mt-6 inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">Learn by doing: play The Proof Gate <span className="ml-2 text-teal" aria-hidden="true">→</span></Link>
      <dl className="hero-facts">
        <div><dt>Published books</dt><dd>{PUBLISHED_BOOKS.length}</dd></div>
        <div><dt>Years in software</dt><dd>20+</dd></div>
        <div><dt>Books in development</dt><dd>{UPCOMING_BOOKS.length}</dd></div>
      </dl>
      <p className="mt-4 text-sm text-muted">Published with Manning, O’Reilly, Apress, Packt, and BPB.</p>
    </div>
  </section>
}
