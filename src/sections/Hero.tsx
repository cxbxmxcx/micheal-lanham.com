import { useRef } from 'react'
import { Link } from 'react-router'
import { BOOKS, PUBLISHED_BOOKS } from '@/data/books'
import { DEMOS } from '@/data/demos'
import { responsiveImage } from '@/lib/images'
import CountUp from '@/components/CountUp'
import InkSketch from '@/components/InkSketch'
import { usePointerDepth } from '@/lib/motion'

const PUBLISHERS = ['Manning', 'O’Reilly', 'Apress', 'Packt', 'BPB']
// Pinned beside the portrait, back to front.
const COVERS = ['self-improving-agents', 'ai-agents-in-action-second-edition']
  .map(slug => BOOKS.find(book => book.slug === slug)!)
const CONCEPT_GAMES = DEMOS.filter(demo => demo.engine).length

export default function Hero() {
  const section = useRef<HTMLElement>(null)
  const art = useRef<HTMLDivElement>(null)
  // The plate's layers sit at different depths and follow the pointer (index.css: hero depth).
  usePointerDepth(section, art)
  return <section ref={section} id="top" className="hero-section">
    <div className="container-x">
      <div className="hero-grid">
        <div className="hero-intro">
          <p className="kicker">Author &amp; AI practitioner · Calgary</p>
          <h1>Micheal Lanham, author of <em className="hero-book">AI Agents in Action</em>.</h1>
          <p className="hero-lede">My next Manning book, <Link className="hero-title" to="/books/self-improving-agents/">Self-Improving Agents</Link>, is in early access. I also help teams design better agent systems through architecture reviews and hands-on training.</p>
        </div>
        <div ref={art} className="hero-art">
          <div className="hero-tree" aria-hidden="true"><InkSketch /></div>
          {/* The oval is 62% of the plate: up to 270 px wide, 180 px on phones. */}
          <div className="hero-oval"><img className="hero-portrait" {...responsiveImage('/micheal-lanham.png', '(max-width: 639px) 180px, 270px')} alt="Micheal Lanham" fetchPriority="high" /></div>
          <ul className="hero-covers" aria-label="Featured books">
            {COVERS.map(book => <li key={book.slug}><Link to={`/books/${book.slug}/`}><img {...responsiveImage(book.cover!, '(max-width: 639px) 92px, 115px')} alt={book.title} /></Link></li>)}
          </ul>
          <p className="hero-plate specimen-label" aria-hidden="true">Plate I · the author, with specimens</p>
        </div>
        <div className="hero-actions">
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" to="/work/">Work with me <span aria-hidden="true">→</span></Link>
            <Link className="btn-secondary" to="/books/">Browse the books</Link>
          </div>
          <Link to="/demos/selection-engine/" className="mt-5 inline-flex min-h-11 items-center text-sm text-muted hover:text-ink">Learn by doing: play The Selection Engine <span className="ml-2 text-teal" aria-hidden="true">→</span></Link>
        </div>
      </div>
      <div className="hero-proof" data-reveal="up">
        <dl className="hero-facts">
          <div><dt>Published books</dt><dd><CountUp value={PUBLISHED_BOOKS.length} /></dd></div>
          <div><dt>Years in software</dt><dd><CountUp value={20} suffix="+" /></dd></div>
          <div><dt>Concept games</dt><dd><CountUp value={CONCEPT_GAMES} /></dd></div>
        </dl>
        <div className="hero-publishers">
          <p>Published with</p>
          <ul>{PUBLISHERS.map(name => <li key={name}>{name}</li>)}</ul>
        </div>
      </div>
    </div>
  </section>
}
