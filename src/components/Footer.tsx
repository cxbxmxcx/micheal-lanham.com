import { Link } from 'react-router'
import { EMAIL } from '@/data/contact'

export default function Footer() {
  return <footer className="border-t border-line py-10">
    <div className="container-x flex flex-col justify-between gap-7 md:flex-row md:items-start">
      <div><Link to="/" className="font-display text-lg font-semibold">Micheal Lanham</Link><p className="mt-2 text-sm text-muted">Author &amp; AI practitioner · Calgary, Canada</p></div>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 text-sm">
        <Link className="inline-flex min-h-11 items-center" to="/books/">Books</Link><Link className="inline-flex min-h-11 items-center" to="/demos/">Demos</Link><Link className="inline-flex min-h-11 items-center" to="/work/">Work with me</Link><a className="inline-flex min-h-11 items-center gap-1" href="https://github.com/cxbxmxcx">GitHub <span aria-hidden="true">↗</span></a>
      </nav>
      <a className="inline-flex min-h-11 items-center break-all text-sm text-teal" href={`mailto:${EMAIL}`}>{EMAIL}</a>
    </div>
    <p className="container-x mt-8 text-sm text-muted">© {__BUILD_YEAR__} Micheal Lanham</p>
  </footer>
}
