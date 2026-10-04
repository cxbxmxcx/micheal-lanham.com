import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'

const template = await readFile('dist/index.html', 'utf8')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
try {
  const { render, PAGE_PATHS } = await server.ssrLoadModule('/src/entry-server.tsx')
  for (const route of [...PAGE_PATHS, '/404/']) {
    const { html, meta, schema } = render(route)
    let output = template.replace('<div id="root"></div>', () => `<div id="root">${html}</div>`)
    output = output.replace(/<title>[^<]*<\/title>/, () => `<title>${escape(meta.title)}</title>`)
    for (const [name, value] of Object.entries({ description: meta.description, 'twitter:title': meta.title, 'twitter:description': meta.description })) {
      output = output.replace(new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*\\/?>`), () => `<meta name="${name}" content="${escape(value)}" />`)
    }
    for (const [property, value] of Object.entries({ 'og:title': meta.title, 'og:description': meta.description, 'og:url': meta.canonical })) {
      output = output.replace(new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]*"\\s*\\/?>`), () => `<meta property="${property}" content="${escape(value)}" />`)
    }
    output = output.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, () => `<link rel="canonical" href="${escape(meta.canonical)}" />`)
    output = output.replace('</head>', () => `${meta.noindex ? '<meta name="robots" content="noindex" />' : ''}<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script></head>`)
    const file = route === '/404/' ? 'dist/404.html' : path.join('dist', route.slice(1), 'index.html')
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, output)
  }
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${PAGE_PATHS.map(route => `<url><loc>https://micheal-lanham.com${route}</loc></url>`).join('')}</urlset>`)
  await writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://micheal-lanham.com/sitemap.xml\n')
  console.log(`Prerendered ${PAGE_PATHS.length} pages, 404, sitemap, and robots.txt.`)
} finally {
  await server.close()
}
