import { BOOKS } from '@/data/books'
import { SERVICES } from '@/data/services'
import { DEMOS } from '@/data/demos'
import SOCIAL from '@/data/social.json'

const ORIGIN = 'https://micheal-lanham.com'
const SITE = 'Micheal Lanham'
// Search results cut descriptions at about 160 characters: add whole sentences while they fit.
const fit = (...sentences: string[]) => sentences.reduce((text, sentence) => !text ? sentence : `${text} ${sentence}`.length <= 160 ? `${text} ${sentence}` : text, '')
// Social cards, built by scripts/build-social.mjs: books and demos have their own; every other page shares the site's.
const CARDS: Record<string, { image: string; alt: string }> = SOCIAL
export const PAGE_PATHS = ['/', '/books/', '/work/', '/demos/', ...BOOKS.map(book => `/books/${book.slug}/`), ...SERVICES.map(service => `/work/${service.slug}/`), ...DEMOS.map(demo => `/demos/${demo.slug}/`)]

export function getMetadata(path: string) {
  const normalized = path.endsWith('/') ? path : `${path}/`
  let title = 'Micheal Lanham — AI agents, books & training'
  let description = 'Books, interactive demos, architecture reviews, and team workshops on AI agents and learning systems by author Micheal Lanham.'
  if (normalized === '/books/') { title = 'Books on AI, machine learning & games'; description = 'Find your next book by topic: AI agents, machine learning, generative AI, games, and augmented reality.' }
  else if (normalized === '/work/') { title = 'AI agent architecture reviews & workshops'; description = 'Work with Micheal Lanham on agent architecture reviews and practical team training, scoped around your system and learning goals.' }
  else if (normalized === '/demos/') { title = 'Interactive AI demos'; description = 'Learn by doing with The Selection Engine, The Instinct Engine, The Difference Engine, and three neural-network teaching games.' }
  else if (normalized.startsWith('/books/')) { const book = BOOKS.find(item => normalized === `/books/${item.slug}/`); if (book) { title = book.title.length > 48 ? book.title.split(' — ')[0] : book.title; description = fit(`${book.title} by Micheal Lanham.`, book.audience) } }
  else if (normalized.startsWith('/work/')) { const service = SERVICES.find(item => normalized === `/work/${item.slug}/`); if (service) { title = service.title; description = service.summary } }
  else if (normalized.startsWith('/demos/')) { const demo = DEMOS.find(item => normalized === `/demos/${item.slug}/`); if (demo) { title = demo.title; description = fit(demo.description, demo.outcome, 'An interactive demo by Micheal Lanham.') } }
  const noindex = !PAGE_PATHS.includes(normalized)
  if (noindex) { title = 'Page not found'; description = 'Explore books, interactive AI demos, and ways to work with Micheal Lanham.' }
  // A page that asks not to be indexed has no canonical address to point to.
  const card = CARDS[normalized] ?? CARDS['/']
  const type = BOOKS.some(book => normalized === `/books/${book.slug}/`) ? 'book' : 'website'
  return { title: normalized === '/' ? title : `${title} — Micheal Lanham`, description, canonical: noindex ? undefined : ORIGIN + normalized, noindex, image: ORIGIN + card.image, imageAlt: card.alt, type }
}

const PERSON_ID = `${ORIGIN}/#person`
// Only facts the site already states: the footer's role and city, the topics, and the two profiles it links to.
const PERSON = {
  '@type': 'Person', '@id': PERSON_ID, name: SITE, url: `${ORIGIN}/`, image: `${ORIGIN}/micheal-lanham.png`,
  jobTitle: 'Author and AI practitioner', homeLocation: { '@type': 'Place', name: 'Calgary, Canada' },
  knowsAbout: ['AI agents', 'Machine learning', 'Evolutionary deep learning', 'Generative AI', 'Game development'],
  sameAs: ['https://github.com/cxbxmxcx', 'https://www.manning.com/authors/micheal-lanham'],
}
const SECTIONS: Record<string, string> = { books: 'Books', work: 'Work with me', demos: 'Demos' }

function breadcrumbs(normalized: string, title?: string) {
  const [, section, slug] = normalized.split('/')
  const items = [{ name: 'Home', path: '/' }, { name: SECTIONS[section], path: `/${section}/` }, ...(slug && title ? [{ name: title, path: normalized }] : [])]
  return { '@type': 'BreadcrumbList', itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: ORIGIN + item.path })) }
}

export function getStructuredData(path: string) {
  const normalized = path.endsWith('/') ? path : `${path}/`
  const graph: object[] = []
  const book = BOOKS.find(item => normalized === `/books/${item.slug}/`)
  const service = SERVICES.find(item => normalized === `/work/${item.slug}/`)
  const demo = DEMOS.find(item => normalized === `/demos/${item.slug}/`)
  if (normalized === '/') {
    graph.push({ '@type': 'WebSite', '@id': `${ORIGIN}/#website`, name: SITE, url: `${ORIGIN}/`, publisher: { '@id': PERSON_ID } })
    graph.push({ '@type': 'ProfilePage', name: getMetadata('/').title, url: `${ORIGIN}/`, mainEntity: PERSON })
  } else if (book) {
    graph.push({ '@type': 'Book', name: book.title, author: { '@id': PERSON_ID, '@type': 'Person', name: SITE }, isbn: book.isbn || undefined, datePublished: book.year || undefined, inLanguage: 'en', url: getMetadata(path).canonical, image: book.cover ? `${ORIGIN}${book.cover}` : undefined, publisher: { '@type': 'Organization', name: book.publisher } })
    graph.push(breadcrumbs(normalized, book.title))
  } else if (service) {
    graph.push({ '@type': 'Service', name: service.title, description: service.summary, url: getMetadata(path).canonical, provider: { '@id': PERSON_ID, '@type': 'Person', name: SITE } })
    graph.push(breadcrumbs(normalized, service.title))
  } else if (demo) {
    graph.push(breadcrumbs(normalized, demo.title))
  } else if (SECTIONS[normalized.split('/')[1]] && normalized.split('/').length === 3) {
    graph.push(breadcrumbs(normalized))
  }
  if (!graph.some(node => 'mainEntity' in node)) graph.push(PERSON)
  return { '@context': 'https://schema.org', '@graph': graph }
}
