import { Link } from 'react-router'
import type { Book } from '@/data/books'

// Covers standing on a shelf line, each with its year. Used on the homepage and under each book page.
export default function BookShelf({ books, label }: { books: Book[]; label: string }) {
  return <ul className="shelf" aria-label={label}>
    {books.map(book => <li key={book.slug}><Link to={`/books/${book.slug}/`}>
      <span className="shelf-cover"><img src={book.cover} alt={book.title} width="360" height="450" loading="lazy" /></span>
      <span className="shelf-year">{book.status === 'Published' ? book.year : 'Early access'}</span>
    </Link></li>)}
  </ul>
}
