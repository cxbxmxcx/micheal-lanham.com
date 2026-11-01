import { Link, useParams } from 'react-router'
import RelatedBooks from '@/components/RelatedBooks'
import { DEMOS } from '@/data/demos'
import { BOOKS, bookDestination, bookInquiry } from '@/data/books'
import { BookArtwork } from '@/components/BookPreview'
import PageIntro from '@/components/PageIntro'
import MailIcon from '@/components/MailIcon'
import NotFound from './NotFound'

export default function BookDetail() {
  const { slug } = useParams()
  const book = BOOKS.find(item => item.slug === slug)
  if (!book) return <NotFound />
  const companions = DEMOS.filter(demo => demo.bookSlug === book.slug)
  return <article className="container-x pb-20">
    <PageIntro back={{ to: '/books/', label: 'All books' }} kicker={`${book.publisher} · ${book.status}`} title={book.title}><p>{book.subtitle}</p></PageIntro>
    <div className="grid items-start gap-10 md:grid-cols-[minmax(200px,320px)_1fr] lg:gap-16">
      <BookArtwork book={book} large priority="high" />
      <div className="reading-copy">
        <h2>Who this is for</h2><p>{book.audience}</p>
        <h2>{book.status === 'Published' ? 'Explore the book' : 'Follow the work'}</h2>
        <p>{book.status === 'Early access' ? 'Read available chapters through the Manning Early Access Program (MEAP) as the book develops. The publisher’s page has the current chapter list and publication estimate.' : book.status === 'In development' ? 'This book is in development. A publication date and public purchase link have not been announced here. Get in touch if you have a question about the work.' : 'Visit the publisher or retailer for the full contents, available formats, and current edition details.'}</p>
        {book.year && Number(book.year) < 2024 && <p className="notice">Published in {book.year}. Libraries, services, and APIs may have changed since this edition; check current documentation when running its examples.</p>}
        {book.slug === 'ai-agents-in-action' && <p><Link className="text-link" to="/books/ai-agents-in-action-second-edition/">Looking for the latest material? Explore the second edition <span aria-hidden="true">→</span></Link></p>}
        <div className="my-7 flex flex-wrap gap-4">{book.url ? <a className="btn-primary" href={book.url}>{bookDestination(book)} <span aria-hidden="true">↗</span></a> : <a className="btn-primary" href={bookInquiry(book)}><MailIcon /> {bookDestination(book)}</a>}{book.code && <a className="btn-secondary" href={book.code}>Explore the companion code <span aria-hidden="true">↗</span></a>}</div>
        {companions.length > 0 && <div className="notice"><h3>Try the ideas</h3><p>Play them in {companions.length === 1 ? 'an interactive companion' : `${companions.length} interactive companions`}.</p><div className="mt-3 flex flex-wrap gap-5">{companions.map(demo => <Link key={demo.slug} className="text-link" to={`/demos/${demo.slug}/`}>{demo.title} <span aria-hidden="true">→</span></Link>)}</div></div>}
        <dl className="book-details"><div><dt>Publisher</dt><dd>{book.publisher}</dd></div><div><dt>Topic</dt><dd>{book.topic}</dd></div>{book.year && <div><dt>Published</dt><dd>{book.year}</dd></div>}{book.isbn && <div><dt>ISBN</dt><dd>{book.isbn}</dd></div>}</dl>
      </div>
    </div>
    <RelatedBooks book={book} />
  </article>
}
