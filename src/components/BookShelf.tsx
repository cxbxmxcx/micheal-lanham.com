import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import type { Book } from '@/data/books'
import { responsiveImage } from '@/lib/images'

// Covers standing on a shelf line, each with its year. Used on the homepage and under each book page.
export default function BookShelf({ books, label }: { books: Book[]; label: string }) {
  return <ul className="shelf" aria-label={label} data-reveal="shelf">
    {books.map((book, index) => <li key={book.slug} style={{ '--i': index } as CSSProperties}><Link to={`/books/${book.slug}/`}>
      <span className="shelf-cover"><img {...responsiveImage(book.cover!, '(max-width: 639px) 100px, 160px')} alt={book.title} loading="lazy" /></span>
      <span className="shelf-year">{book.status === 'Published' ? book.year : 'Early access'}</span>
    </Link></li>)}
  </ul>
}
