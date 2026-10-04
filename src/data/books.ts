import { PUBLISHER_CLUSTERS } from '@/components/books/booksData'
import { inquiry } from './contact'

export const TOPICS = ['All topics', 'AI agents', 'Machine learning', 'Generative AI', 'Games & AR'] as const
export type Topic = (typeof TOPICS)[number]
export interface Book {
  slug: string
  title: string
  subtitle: string
  publisher: string
  year: string | null
  isbn: string | null
  url: string | null
  status: 'Published' | 'Early access' | 'In development'
  topic: Topic
  audience: string
  cover?: string
  code?: string
}

type Guide = Pick<Book, 'slug' | 'topic' | 'audience' | 'cover' | 'code'>
const GUIDES: Record<string, Guide> = {
  '9781633434530': { slug: 'ai-agents-in-action-second-edition', topic: 'AI agents', audience: 'Python developers ready to build agents with tools, memory, evaluation, and multi-agent workflows.', cover: '/books/ai-agents-second.png', code: 'https://github.com/cxbxmxcx/AI-Agent-Workflows' },
  '9781633436343': { slug: 'ai-agents-in-action', topic: 'AI agents', audience: 'Readers working through the first edition. For the updated material, start with the second edition.', cover: '/books/ai-agents.png' },
  '9781617299520': { slug: 'evolutionary-deep-learning', topic: 'Machine learning', audience: 'Developers exploring how genetic algorithms can search, tune, and evolve neural networks.', cover: '/books/evolutionary-deep-learning.png' },
  '9781492075813': { slug: 'practical-ai-google-cloud', cover: '/books/practical-ai-google-cloud.jpg', topic: 'Machine learning', audience: 'Developers exploring the foundations of managed AI services on Google Cloud.' },
  '9781484270912': { slug: 'generating-a-new-reality', cover: '/books/generating-a-new-reality.jpg', topic: 'Generative AI', audience: 'Readers interested in the foundations of autoencoders, adversarial networks, and synthetic media.' },
  '9781839214936': { slug: 'reinforcement-learning-for-games', cover: '/books/reinforcement-learning-for-games.jpg', topic: 'Machine learning', audience: 'Game developers exploring agents that learn through interaction and rewards.' },
  '9781788994071': { slug: 'deep-learning-for-games', cover: '/books/deep-learning-for-games.jpg', topic: 'Machine learning', audience: 'Game developers bringing neural networks and reinforcement learning into their projects.' },
  '9781789138139': { slug: 'learn-unity-ml-agents', cover: '/books/learn-unity-ml-agents.jpg', topic: 'Games & AR', audience: 'Unity developers studying the foundations of training agents in simulated environments.' },
  '9781788830409': { slug: 'learn-arcore', cover: '/books/learn-arcore.jpg', topic: 'Games & AR', audience: 'Developers studying early ARCore workflows for Android, Unity, and the web.' },
  '9781787122888': { slug: 'augmented-reality-game-development', cover: '/books/augmented-reality-game-development.jpg', topic: 'Games & AR', audience: 'Unity developers interested in the foundations of augmented-reality game design.' },
  '9781787286450': { slug: 'game-audio-development', cover: '/books/game-audio-development.jpg', topic: 'Games & AR', audience: 'Game developers learning the principles of interactive audio and soundtrack design.' },
  '9789355516435': { slug: 'python-game-development-chatgpt', cover: '/books/python-game-development-chatgpt.jpg', topic: 'Generative AI', audience: 'Python learners exploring game development with help from generative AI.' },
}

export const PUBLISHED_BOOKS: Book[] = PUBLISHER_CLUSTERS.flatMap(cluster => cluster.books.map(book => ({
  ...book,
  ...GUIDES[book.isbn!],
  publisher: cluster.label.replace('MANNING PUBLICATIONS', 'Manning').replace("O'REILLY MEDIA", "O'Reilly").replace('APRESS', 'Apress').replace('PACKT PUBLISHING', 'Packt').replace('BPB PUBLICATIONS', 'BPB'),
  status: 'Published' as const,
  url: book.isbn === '9781617299520' ? 'https://www.manning.com/books/evolutionary-deep-learning' : book.url,
})))

export const UPCOMING_BOOKS: Book[] = [
  { slug: 'self-improving-agents', title: 'Self-Improving Agents', subtitle: 'How to engineer adaptive harnesses', publisher: 'Manning', year: null, isbn: '9781633433182', url: 'https://www.manning.com/books/self-improving-agents', status: 'Early access', topic: 'AI agents', audience: 'Developers exploring how to measure, guide, and evaluate improvements to an agent system.', cover: '/books/self-improving-agents.png', code: 'https://github.com/cxbxmxcx/self-improving-agents' },
  { slug: 'learn-ai-filmmaking', title: 'Learn AI Filmmaking', subtitle: 'Generative pipelines for cinematic craft.', publisher: 'BPB', year: null, isbn: null, url: null, status: 'In development', topic: 'Generative AI', audience: 'Filmmakers and creative technologists exploring generative tools in a filmmaking workflow.' },
  { slug: 'instinctual-learning-agent-harness', title: 'The Instinctual Learning Agent Harness', subtitle: 'Instincts, drives, and self-improving agents.', publisher: 'Packt', year: null, isbn: null, url: null, status: 'In development', topic: 'AI agents', audience: 'Agent builders exploring architectures shaped by instincts, drives, and learning.' },
]

export const BOOKS = [...UPCOMING_BOOKS, ...PUBLISHED_BOOKS]
export const FEATURED_BOOKS = [UPCOMING_BOOKS[0], PUBLISHED_BOOKS[0], PUBLISHED_BOOKS[2]]
export const bookInquiry = (book: Book) => inquiry(`Question about ${book.title}`, `Hi Micheal,\n\nI'd like to know more about ${book.title}.\n\nMy question:\n`)
export function bookDestination(book: Book) {
  if (book.status === 'Early access') return 'Read early chapters at Manning'
  if (!book.url) return 'Ask about this book'
  return book.url.includes('amazon.com') ? 'View at Amazon' : `View at ${book.publisher}`
}
