import { Link } from 'react-router'
import SectionShell from '@/components/SectionShell'
import { BOOKS, PUBLISHED_BOOKS } from '@/data/books'

// Every published or early-access book with a cover, newest first. Early access has no year yet, so it leads.
const SHELF = BOOKS.filter(book => book.cover && book.status !== 'In development')
  .sort((a, b) => Number(b.year ?? Infinity) - Number(a.year ?? Infinity))
const FIRST_YEAR = Math.min(...PUBLISHED_BOOKS.map(book => Number(book.year)).filter(Boolean))
const EARLY_ACCESS = BOOKS.filter(book => book.status === 'Early access').length
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen']
const word = (count: number) => WORDS[count] ?? String(count)
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export default function Books() {
  return <SectionShell id="books" kicker="The books" title={sentence(`${word(PUBLISHED_BOOKS.length)} published books since ${FIRST_YEAR}, and ${word(EARLY_ACCESS)} in early access.`)} lede="Start with practical agent systems, explore evolutionary learning, or follow the work on agents that improve themselves.">
    <ul className="shelf" aria-label="Books by Micheal Lanham, newest first">
      {SHELF.map(book => <li key={book.slug}><Link to={`/books/${book.slug}/`}>
        <span className="shelf-cover"><img src={book.cover} alt={book.title} width="360" height="450" loading="lazy" /></span>
        <span className="shelf-year">{book.status === 'Published' ? book.year : 'Early access'}</span>
      </Link></li>)}
    </ul>
    <Link className="text-link mt-6" to="/books/">Browse all books by topic <span aria-hidden="true">→</span></Link>
  </SectionShell>
}
