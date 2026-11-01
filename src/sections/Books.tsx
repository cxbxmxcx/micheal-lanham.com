import { Link } from 'react-router'
import SectionShell from '@/components/SectionShell'
import BookShelf from '@/components/BookShelf'
import { newestFirst } from '@/lib/shelf'
import { BOOKS, PUBLISHED_BOOKS } from '@/data/books'

const SHELF = newestFirst(BOOKS)
const FIRST_YEAR = Math.min(...PUBLISHED_BOOKS.map(book => Number(book.year)).filter(Boolean))
const EARLY_ACCESS = BOOKS.filter(book => book.status === 'Early access').length
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen']
const word = (count: number) => WORDS[count] ?? String(count)
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export default function Books() {
  return <SectionShell id="books" kicker="The books" title={sentence(`${word(PUBLISHED_BOOKS.length)} published books since ${FIRST_YEAR}, and ${word(EARLY_ACCESS)} in early access.`)} lede="Start with practical agent systems, explore evolutionary learning, or follow the work on agents that improve themselves.">
    <BookShelf books={SHELF} label="Books by Micheal Lanham, newest first" />
    <Link className="text-link mt-6" to="/books/">Browse all books by topic <span aria-hidden="true">→</span></Link>
  </SectionShell>
}
