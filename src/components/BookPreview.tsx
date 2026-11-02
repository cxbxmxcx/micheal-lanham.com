import { Link } from 'react-router'
import type { Book } from '@/data/books'
import { loadingProps, responsiveImage, type ImagePriority } from '@/lib/images'
import { transitionName } from '@/lib/motion'

// Rendered widths: card covers are 264 px tall; detail covers are at most
// 300 px wide and 390 px tall, and are never enlarged past the original.
const cardSizes = (aspect: number) => `${Math.ceil(264 * aspect)}px`
const largeSizes = (aspect: number, width: number) => `${Math.ceil(Math.min(300, 390 * aspect, width))}px`

export function BookArtwork({ book, large = false, priority }: { book: Book; large?: boolean; priority?: ImagePriority }) {
  return <div className={`book-art ${large ? 'book-art-large' : ''}`}>
    {book.cover ? <img {...responsiveImage(book.cover, large ? largeSizes : cardSizes)} alt={`${book.title} cover`} {...loadingProps(priority)} style={large ? transitionName('cover', book.slug) : undefined} /> : <div className="book-type-cover" aria-hidden="true" style={large ? transitionName('cover', book.slug) : undefined}><span>{book.publisher}</span><strong>{book.title}</strong><span>Micheal Lanham</span></div>}
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
