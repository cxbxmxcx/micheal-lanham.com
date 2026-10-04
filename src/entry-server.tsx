import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'
import { PAGE_PATHS, getMetadata, getStructuredData } from './lib/metadata'

export { PAGE_PATHS }
export function render(path: string) {
  const meta = getMetadata(path)
  const schema = getStructuredData(path)
  return { html: renderToString(<StaticRouter location={path}><App /></StaticRouter>), meta, schema }
}
