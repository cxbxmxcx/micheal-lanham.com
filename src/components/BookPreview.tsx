import { Link } from 'react-router'
import type { Book } from '@/data/books'

export function BookArtwork({ book, large = false }: { book: Book; large?: boolean }) {
  return <div className={`book-art ${large ? 'book-art-large' : ''}`}>
    {book.cover ? <img src={book.cover} alt={`${book.title} cover`} width="360" height="480" loading="lazy" /> : <div className="book-type-cover" aria-hidden="true"><span>{book.publisher}</span><strong>{book.title}</strong><span>Micheal Lanham</span></div>}
  </div>
}

export default function BookPreview({ book }: { book: Book }) {
  return <article className="book-preview">
    <Link to={`/books/${book.slug}/`} tabIndex={-1} aria-hidden="true"><BookArtwork book={book} /></Link>
    <div className="flex flex-1 flex-col p-6">
      <p className="mb-3 text-sm text-muted">{book.publisher} · {book.status === 'Published' ? book.year : book.status}</p>
      <h3 className="font-display text-xl font-semibold leading-snug">{book.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{book.audience}</p>
      <Link className="text-link mt-auto pt-5" to={`/books/${book.slug}/`} aria-label={`About ${book.title}`}>Explore this book <span aria-hidden="true">→</span></Link>
    </div>
  </article>
}
