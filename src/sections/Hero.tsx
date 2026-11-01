import { Link } from 'react-router'
import { BOOKS, PUBLISHED_BOOKS, UPCOMING_BOOKS } from '@/data/books'
import { responsiveImage } from '@/lib/images'

const PUBLISHERS = ['Manning', 'O’Reilly', 'Apress', 'Packt', 'BPB']
// Listed front to back: the first cover sits on top of the fan.
const COVERS = ['self-improving-agents', 'ai-agents-in-action-second-edition', 'evolutionary-deep-learning']
  .map(slug => BOOKS.find(book => book.slug === slug)!)

export default function Hero() {
  return <section id="top" className="hero-section">
    <div className="container-x">
      <div className="hero-grid">
        <div className="hero-intro">
          <p className="kicker">Author &amp; AI practitioner</p>
          <h1>Micheal Lanham,<br /> <span className="text-accent">author of <span className="hero-book">AI Agents in Action</span>.</span></h1>
          <p className="hero-lede">My next Manning book, <Link className="hero-title" to="/books/self-improving-agents/">Self-Improving Agents</Link>, is in early access. I also help teams design better agent systems through architecture reviews and hands-on training.</p>
        </div>
        <div className="hero-art">
          {/* Rendered at 59% of the art box: up to 320 px wide, 200 px on phones. */}
          <img className="hero-portrait" {...responsiveImage('/micheal-lanham.png', '(max-width: 639px) 200px, 320px')} alt="Micheal Lanham" fetchPriority="high" />
          <ul className="hero-covers" aria-label="Featured books">
            {COVERS.map(book => <li key={book.slug}><Link to={`/books/${book.slug}/`}><img {...responsiveImage(book.cover!, '(max-width: 639px) 120px, 190px')} alt={book.title} /></Link></li>)}
          </ul>
        </div>
        <div className="hero-actions">
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" to="/work/">Work with me <span aria-hidden="true">→</span></Link>
            <Link className="btn-secondary" to="/books/">Browse the books</Link>
          </div>
          <Link to="/demos/proof-gate/" className="mt-5 inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">Learn by doing: play The Proof Gate <span className="ml-2 text-teal" aria-hidden="true">→</span></Link>
        </div>
      </div>
      <div className="hero-proof">
        <dl className="hero-facts">
          <div><dt>Published books</dt><dd>{PUBLISHED_BOOKS.length}</dd></div>
          <div><dt>Years in software</dt><dd>20+</dd></div>
          <div><dt>Books in development</dt><dd>{UPCOMING_BOOKS.length}</dd></div>
        </dl>
        <div className="hero-publishers">
          <p>Published with</p>
          <ul>{PUBLISHERS.map(name => <li key={name}>{name}</li>)}</ul>
        </div>
      </div>
    </div>
  </section>
}
