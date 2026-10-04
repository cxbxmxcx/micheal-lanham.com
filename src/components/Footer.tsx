import { Link } from 'react-router'
import { EMAIL } from '@/data/contact'

export default function Footer() {
  return <footer className="border-t border-panel-line py-10">
    <div className="container-x flex flex-col justify-between gap-7 md:flex-row md:items-start">
      <div><Link to="/" className="font-display text-lg font-semibold">Micheal Lanham</Link><p className="mt-2 text-sm text-muted">Author &amp; AI practitioner · Calgary, Canada</p></div>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <Link to="/books/">Books</Link><Link to="/demos/">Demos</Link><Link to="/work/">Work with me</Link><a href="https://github.com/cxbxmxcx">GitHub <span aria-hidden="true">↗</span></a>
      </nav>
      <a className="break-all text-sm text-teal" href={`mailto:${EMAIL}`}>{EMAIL}</a>
    </div>
    <p className="container-x mt-8 text-sm text-muted">© {new Date().getFullYear()} Micheal Lanham</p>
  </footer>
}
