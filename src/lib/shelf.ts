import type { Book } from '@/data/books'

// Published and early-access books with covers, newest first. Early access has no year yet, so it leads.
export const newestFirst = (books: Book[]) => books
  .filter(book => book.cover && book.status !== 'In development')
  .sort((a, b) => Number(b.year ?? Infinity) - Number(a.year ?? Infinity))
