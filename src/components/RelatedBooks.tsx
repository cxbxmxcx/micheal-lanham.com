import { BOOKS, TOPIC_PHRASES, type Book } from '@/data/books'
import { newestFirst } from '@/lib/shelf'
import BookShelf from './BookShelf'

// Ends each book page with somewhere to go next: the same topic when there are
// enough books in it, otherwise topped up with the newest other books.
export default function RelatedBooks({ book }: { book: Book }) {
  const others = newestFirst(BOOKS.filter(other => other.slug !== book.slug))
  const sameTopic = others.filter(other => other.topic === book.topic)
  const byTopic = sameTopic.length >= 3
  const picks = byTopic ? sameTopic.slice(0, 5) : [...sameTopic, ...others.filter(other => other.topic !== book.topic)].slice(0, 4)
  const title = byTopic ? `More on ${TOPIC_PHRASES[book.topic]}` : 'More books to explore'
  return <section className="related-books" aria-labelledby="related-books-title">
    <p className="kicker">Keep reading</p>
    <h2 id="related-books-title">{title}</h2>
    <BookShelf books={picks} label={title} />
  </section>
}
