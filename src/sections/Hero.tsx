import { Link } from 'react-router'
import { BOOKS, PUBLISHED_BOOKS } from '@/data/books'
import { DEMOS } from '@/data/demos'
import { responsiveImage } from '@/lib/images'

const PUBLISHERS = ['Manning', 'O’Reilly', 'Apress', 'Packt', 'BPB']
// Pinned beside the portrait, back to front.
const COVERS = ['self-improving-agents', 'ai-agents-in-action-second-edition']
  .map(slug => BOOKS.find(book => book.slug === slug)!)
const CONCEPT_GAMES = DEMOS.filter(demo => demo.engine).length

// After Darwin's 1837 "I think" notebook sketch: a tree of descent in ink.
function ThinkSketch() {
  return <svg viewBox="0 0 220 200">
    <text x="18" y="26" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontSize="20" fill="currentColor" stroke="none">I think</text>
    <path d="M40 182 C 44 150, 60 140, 72 120 C 84 100, 86 84, 104 70" />
    <path d="M72 120 C 92 122, 108 112, 126 100 C 144 88, 160 92, 176 78" />
    <path d="M104 70 C 116 58, 120 46, 138 40" />
    <path d="M104 70 C 96 54, 92 46, 98 30" />
    <path d="M126 100 C 132 116, 146 124, 162 126" />
    <path d="M60 140 C 46 130, 36 120, 30 104" />
    <path d="M138 40 h 12 M98 30 v -10 M176 78 l 10 -6 M162 126 l 12 2 M30 104 l -8 -8" />
    <circle cx="40" cy="182" r="3" />
    <text x="44" y="196" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="currentColor" stroke="none">1</text>
  </svg>
}

export default function Hero() {
  return <section id="top" className="hero-section">
    <div className="container-x">
      <div className="hero-grid">
        <div className="hero-intro">
          <p className="kicker">Author &amp; AI practitioner · Calgary</p>
          <h1>Micheal Lanham, author of <em className="hero-book">AI Agents in Action</em>.</h1>
          <p className="hero-lede">My next Manning book, <Link className="hero-title" to="/books/self-improving-agents/">Self-Improving Agents</Link>, is in early access. I also help teams design better agent systems through architecture reviews and hands-on training.</p>
        </div>
        <div className="hero-art">
          <div className="hero-tree" aria-hidden="true"><ThinkSketch /></div>
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
      <div className="hero-proof">
        <dl className="hero-facts">
          <div><dt>Published books</dt><dd>{PUBLISHED_BOOKS.length}</dd></div>
          <div><dt>Years in software</dt><dd>20+</dd></div>
          <div><dt>Concept games</dt><dd>{CONCEPT_GAMES}</dd></div>
        </dl>
        <div className="hero-publishers">
          <p>Published with</p>
          <ul>{PUBLISHERS.map(name => <li key={name}>{name}</li>)}</ul>
        </div>
      </div>
    </div>
  </section>
}
