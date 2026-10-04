import { BOOKS } from '@/data/books'
import { SERVICES } from '@/data/services'
import { DEMOS } from '@/data/demos'

const ORIGIN = 'https://micheal-lanham.com'
export const PAGE_PATHS = ['/', '/books/', '/work/', '/demos/', ...BOOKS.map(book => `/books/${book.slug}/`), ...SERVICES.map(service => `/work/${service.slug}/`), ...DEMOS.map(demo => `/demos/${demo.slug}/`)]

export function getMetadata(path: string) {
  const normalized = path.endsWith('/') ? path : `${path}/`
  let title = 'Micheal Lanham — AI agents, books & training'
  let description = 'Books, interactive demos, architecture reviews, and team workshops on AI agents and learning systems by author Micheal Lanham.'
  if (normalized === '/books/') { title = 'Books on AI, machine learning & games'; description = 'Find your next book by topic: AI agents, machine learning, generative AI, games, and augmented reality.' }
  else if (normalized === '/work/') { title = 'AI agent architecture reviews & workshops'; description = 'Work with Micheal Lanham on agent architecture reviews and practical team training, scoped around your system and learning goals.' }
  else if (normalized === '/demos/') { title = 'Interactive AI demos'; description = 'Learn by doing with The Proof Gate, Helix Garden, and three neural-network teaching games.' }
  else if (normalized.startsWith('/books/')) { const book = BOOKS.find(item => normalized === `/books/${item.slug}/`); if (book) { title = book.title; description = `${book.title} by Micheal Lanham. ${book.audience}` } }
  else if (normalized.startsWith('/work/')) { const service = SERVICES.find(item => normalized === `/work/${item.slug}/`); if (service) { title = service.title; description = service.summary } }
  else if (normalized.startsWith('/demos/')) { const demo = DEMOS.find(item => normalized === `/demos/${item.slug}/`); if (demo) { title = demo.title; description = `${demo.description} ${demo.outcome}` } }
  if (!PAGE_PATHS.includes(normalized)) { title = 'Page not found'; description = 'Explore books, interactive AI demos, and ways to work with Micheal Lanham.' }
  return { title: normalized === '/' ? title : `${title} — Micheal Lanham`, description, canonical: ORIGIN + normalized, noindex: !PAGE_PATHS.includes(normalized) }
}
