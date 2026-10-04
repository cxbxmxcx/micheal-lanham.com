import { Link } from 'react-router'
import SectionShell from '@/components/SectionShell'
import BookPreview from '@/components/BookPreview'
import { FEATURED_BOOKS } from '@/data/books'

export default function Books() {
  return <SectionShell id="books" kicker="Selected books" title={<>Ideas you can <span className="text-gradient">build on.</span></>} lede="Start with practical agent systems, explore evolutionary learning, or follow the work on agents that improve themselves.">
    <div className="grid gap-6 md:grid-cols-3">{FEATURED_BOOKS.map(book => <BookPreview key={book.slug} book={book} />)}</div>
    <Link className="text-link mt-8" to="/books/">Browse all books by topic <span aria-hidden="true">→</span></Link>
  </SectionShell>
}
