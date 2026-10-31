import { Link } from 'react-router'
import type { Book } from '@/data/books'
import { loadingProps, type ImagePriority } from '@/lib/images'

export function BookArtwork({ book, large = false, priority }: { book: Book; large?: boolean; priority?: ImagePriority }) {
  return <div className={`book-art ${large ? 'book-art-large' : ''}`}>
    {book.cover ? <img src={book.cover} alt={`${book.title} cover`} width="360" height="480" {...loadingProps(priority)} /> : <div className="book-type-cover" aria-hidden="true"><span>{book.publisher}</span><strong>{book.title}</strong><span>Micheal Lanham</span></div>}
  </div>
}

// Cards sit under an h2 section heading on the homepage, and directly under
// the page h1 in the library, so the caller picks the level.
export default function BookPreview({ book, heading: Heading = 'h3', priority }: { book: Book; heading?: 'h2' | 'h3'; priority?: ImagePriority }) {
  return <article className="book-preview">
    <Link to={`/books/${book.slug}/`} tabIndex={-1} aria-hidden="true"><BookArtwork book={book} priority={priority} /></Link>
    <div className="flex flex-1 flex-col p-6">
      <p className="mb-3 text-sm text-muted">{book.publisher} · {book.status === 'Published' ? book.year : book.status}</p>
      <Heading className="font-display text-xl font-semibold leading-snug">{book.title}</Heading>
      <p className="mt-3 text-sm leading-relaxed text-muted">{book.audience}</p>
      <Link className="text-link mt-auto pt-5" to={`/books/${book.slug}/`}>Explore this book<span className="sr-only">: {book.title}</span> <span aria-hidden="true">→</span></Link>
    </div>
  </article>
}
