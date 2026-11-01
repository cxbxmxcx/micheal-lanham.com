import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
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
    for (const [name, value] of Object.entries({ description: meta.description, 'twitter:title': meta.title, 'twitter:description': meta.description, 'twitter:image': meta.image, 'twitter:image:alt': meta.imageAlt })) {
      output = output.replace(new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*\\/?>`), () => `<meta name="${name}" content="${escape(value)}" />`)
    }
    // A noindex page (the 404) has no canonical address, so it also drops og:url.
    for (const [property, value] of Object.entries({ 'og:type': meta.type, 'og:title': meta.title, 'og:description': meta.description, 'og:url': meta.canonical, 'og:image': meta.image, 'og:image:alt': meta.imageAlt })) {
      output = output.replace(new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]*"\\s*\\/?>`), () => value === undefined ? '' : `<meta property="${property}" content="${escape(value)}" />`)
    }
    output = output.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, () => meta.canonical ? `<link rel="canonical" href="${escape(meta.canonical)}" />` : '')
    output = output.replace('</head>', () => `${meta.noindex ? '<meta name="robots" content="noindex" />' : ''}<script id="page-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script></head>`)
    const file = route === '/404/' ? 'dist/404.html' : path.join('dist', route.slice(1), 'index.html')
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, output)
  }
  // The standalone game pages are full-page players. The site's demo pages are
  // the ones to index and share, so stamp each player with noindex and with
  // share tags that point at its demo page.
  const { DEMOS, RETIRED_DEMOS } = await server.ssrLoadModule('/src/data/demos.ts')
  const { getMetadata } = await server.ssrLoadModule('/src/lib/metadata.ts')
  for (const demo of DEMOS) {
    const file = path.join('dist', demo.playUrl)
    const meta = getMetadata(`/demos/${demo.slug}/`)
    const tags = [
      '<meta name="robots" content="noindex">',
      '<meta property="og:type" content="website">',
      '<meta property="og:site_name" content="Micheal Lanham">',
      `<meta property="og:title" content="${escape(meta.title)}">`,
      `<meta property="og:description" content="${escape(meta.description)}">`,
      `<meta property="og:url" content="${escape(meta.canonical)}">`,
      `<meta property="og:image" content="${escape(meta.image)}">`,
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      `<meta property="og:image:alt" content="${escape(meta.imageAlt)}">`,
      '<meta name="twitter:card" content="summary_large_image">',
    ]
    const html = await readFile(file, 'utf8')
    await writeFile(file, html.replace('</head>', () => `${tags.join('\n')}\n</head>`))
  }
  // Retired demos: send their old site pages to the game that replaced them.
  for (const [old, slug] of Object.entries(RETIRED_DEMOS)) {
    const target = DEMOS.find(demo => demo.slug === slug)
    const url = `/demos/${slug}/`
    await mkdir(path.join('dist', 'demos', old), { recursive: true })
    await writeFile(path.join('dist', 'demos', old, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(target.title)} — Micheal Lanham</title><link rel="canonical" href="https://micheal-lanham.com${url}"><meta http-equiv="refresh" content="0; url=${url}"></head><body><p>This demo is now part of <a href="${url}">${escape(target.title)}</a>.</p></body></html>`)
  }
  // lastmod: the date of the commit being built (CI checks out the pushed commit).
  let lastmod = new Date().toISOString().slice(0, 10)
  try { lastmod = execFileSync('git', ['log', '-1', '--format=%cs'], { encoding: 'utf8' }).trim() || lastmod } catch { /* not a git checkout */ }
  await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${PAGE_PATHS.map(route => `<url><loc>https://micheal-lanham.com${route}</loc><lastmod>${lastmod}</lastmod></url>`).join('')}</urlset>`)
  await writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://micheal-lanham.com/sitemap.xml\n')
  console.log(`Prerendered ${PAGE_PATHS.length} pages, 404, sitemap, and robots.txt.`)
} finally {
  await server.close()
}
