import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'
import { PAGE_PATHS, getMetadata } from './lib/metadata'
import { BOOKS } from './data/books'

export { PAGE_PATHS }
export function render(path: string) {
  const book = BOOKS.find(item => path === `/books/${item.slug}/`)
  const meta = getMetadata(path)
  const person = { '@type': 'Person', name: 'Micheal Lanham', url: 'https://micheal-lanham.com/', image: 'https://micheal-lanham.com/micheal-lanham.png', sameAs: ['https://github.com/cxbxmxcx', 'https://www.manning.com/authors/micheal-lanham'] }
  const schema = book ? { '@context': 'https://schema.org', '@type': 'Book', name: book.title, author: person, isbn: book.isbn || undefined, url: meta.canonical, image: book.cover ? `https://micheal-lanham.com${book.cover}` : undefined, publisher: { '@type': 'Organization', name: book.publisher } } : { '@context': 'https://schema.org', ...person }
  return { html: renderToString(<StaticRouter location={path}><App /></StaticRouter>), meta, schema }
}
