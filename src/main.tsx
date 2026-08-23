import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// No React.StrictMode — canvas effects must not run twice.
createRoot(document.getElementById('root')!).render(<App />)
