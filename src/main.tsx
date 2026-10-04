import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App'

const root = document.getElementById('root')!
const app = <BrowserRouter><App /></BrowserRouter>
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
