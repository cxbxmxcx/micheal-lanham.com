import { useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router'
import { BOOKS, TOPICS, PUBLISHED_BOOKS, UPCOMING_BOOKS } from '@/data/books'
import BookPreview from '@/components/BookPreview'
import PageIntro from '@/components/PageIntro'

const subscribe = () => () => {}

export default function BookLibrary() {
  const [params, setParams] = useSearchParams()
  // Static hosting serves the same HTML for every query string. Match that
  // HTML for hydration, then apply the shared link's filter in the browser.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false)
  const topic = hydrated ? TOPICS.find(value => value === params.get('topic')) ?? 'All topics' : 'All topics'
  const books = BOOKS.filter(book => topic === 'All topics' || book.topic === topic)
  return <div className="container-x pb-20">
    <PageIntro kicker="The library" title="Find your next book."><p>{PUBLISHED_BOOKS.length} published books and {UPCOMING_BOOKS.length} in development. Choose a topic, find your starting point, and explore the material at your own pace.</p></PageIntro>
    <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter books by topic">
      {TOPICS.map(value => <button key={value} className="filter-chip" aria-pressed={value === topic} onClick={() => setParams(value === 'All topics' ? {} : { topic: value }, { preventScrollReset: true })}>{value}</button>)}
    </div>
    <p role="status" className="mb-6 text-sm text-muted">{books.length} {books.length === 1 ? 'book' : 'books'}{topic === 'All topics' ? ' across all topics' : ` in ${topic.toLowerCase()}`}</p>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{books.map(book => <BookPreview key={book.slug} book={book} />)}</div>
    <p className="mt-10 max-w-3xl text-sm leading-relaxed text-muted">Early access means chapters are available through the Manning Early Access Program (MEAP) while a book is being written. Other development titles do not yet have a public release date. Earlier books remain useful references; their tooling reflects the edition’s publication date.</p>
  </div>
}
