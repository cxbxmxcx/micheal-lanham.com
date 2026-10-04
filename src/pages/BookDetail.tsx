import { Link, useParams } from 'react-router'
import { BOOKS, bookDestination, bookInquiry } from '@/data/books'
import { BookArtwork } from '@/components/BookPreview'
import PageIntro from '@/components/PageIntro'
import NotFound from './NotFound'

export default function BookDetail() {
  const { slug } = useParams()
  const book = BOOKS.find(item => item.slug === slug)
  if (!book) return <NotFound />
  return <article className="container-x pb-20">
    <PageIntro back={{ to: '/books/', label: 'All books' }} kicker={`${book.publisher} · ${book.status}`} title={book.title}><p>{book.subtitle}</p></PageIntro>
    <div className="grid items-start gap-10 md:grid-cols-[minmax(200px,320px)_1fr] lg:gap-16">
      <BookArtwork book={book} large />
      <div className="reading-copy">
        <h2>Who this is for</h2><p>{book.audience}</p>
        <h2>{book.status === 'Published' ? 'Explore the book' : 'Follow the work'}</h2>
        <p>{book.status === 'Early access' ? 'Read available chapters through the Manning Early Access Program (MEAP) as the book develops. The publisher’s page has the current chapter list and publication estimate.' : book.status === 'In development' ? 'This book is in development. A publication date and public purchase link have not been announced here. Get in touch if you have a question about the work.' : 'Visit the publisher or retailer for the full contents, available formats, and current edition details.'}</p>
        {book.year && Number(book.year) < 2024 && <p className="notice">Published in {book.year}. Libraries, services, and APIs may have changed since this edition; check current documentation when running its examples.</p>}
        {book.slug === 'ai-agents-in-action' && <p><Link className="text-link" to="/books/ai-agents-in-action-second-edition/">Looking for the latest material? Explore the second edition →</Link></p>}
        <div className="my-7 flex flex-wrap gap-4"><a className="btn-amber" href={book.url || bookInquiry(book)}>{bookDestination(book)} <span aria-hidden="true">↗</span></a>{book.code && <a className="btn-ghost-teal" href={book.code}>Explore the companion code <span aria-hidden="true">↗</span></a>}</div>
        {book.slug === 'self-improving-agents' && <div className="notice"><h3>Try the ideas</h3><p>Explore improvement decisions through two interactive companions.</p><div className="mt-3 flex flex-wrap gap-5"><Link className="text-link" to="/demos/proof-gate/">The Proof Gate →</Link><Link className="text-link" to="/demos/helix-garden/">Helix Garden →</Link></div></div>}
        <dl className="book-details"><div><dt>Publisher</dt><dd>{book.publisher}</dd></div><div><dt>Topic</dt><dd>{book.topic}</dd></div>{book.year && <div><dt>Published</dt><dd>{book.year}</dd></div>}{book.isbn && <div><dt>ISBN</dt><dd>{book.isbn}</dd></div>}</dl>
      </div>
    </div>
  </article>
}
