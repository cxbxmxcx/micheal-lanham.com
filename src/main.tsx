import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App'

// GitHub Pages also serves every folder page at .../index.html, the form old
// v1 bookmarks use. Drop that suffix before the router reads the URL so the
// route matches the prerendered page instead of rendering the 404 page.
const { pathname, search, hash } = window.location
if (pathname.endsWith('/index.html')) window.history.replaceState(window.history.state, '', pathname.slice(0, -'index.html'.length) + search + hash)

const root = document.getElementById('root')!
const app = <BrowserRouter><App /></BrowserRouter>
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
