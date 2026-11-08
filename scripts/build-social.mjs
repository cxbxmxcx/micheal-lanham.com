// Builds the social cards (Open Graph and Twitter images) in the cobalt
// editorial style: one per book, one per demo, and one for every other page. Chrome
// renders each card as a 1200 x 630 HTML page with its fonts and images
// inlined, and src/data/social.json records each page's card, its alt text
// and a hash of everything that went into it. src/lib/metadata.ts reads it.
//
//   npm run social                          regenerate after changing a book, a demo or this file
//   node scripts/build-social.mjs --check   (part of npm test) fail if a card is missing or stale
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'vite'

const CHECK = process.argv.includes('--check')
const MANIFEST = 'src/data/social.json'
const OUT = 'public/social'
const sha1 = data => createHash('sha1').update(data).digest('hex')
const escape = text => String(text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const [{ BOOKS }, { DEMOS }] = await Promise.all([server.ssrLoadModule('/src/data/books.ts'), server.ssrLoadModule('/src/data/demos.ts')]).finally(() => server.close())

const FONTS = { Fraunces: 'fraunces-latin-wght.woff2', Inter: 'inter-latin-wght.woff2', 'JetBrains Mono': 'jetbrains-mono-latin-wght.woff2' }
const SITE_COVERS = ['self-improving-agents', 'ai-agents-in-action-second-edition'].map(slug => BOOKS.find(book => book.slug === slug).cover)

const cards = [
  { path: '/', name: 'site', kind: 'site', kicker: 'Author & AI practitioner · Calgary', title: 'Micheal Lanham, author of <em>AI Agents in Action</em>.', text: 'Books, playable concept games, and help for teams building AI agents.', alt: 'Micheal Lanham, author of AI Agents in Action, with two of his books' },
  ...BOOKS.map(book => ({ path: `/books/${book.slug}/`, name: `book-${book.slug}`, kind: 'book', kicker: `${book.publisher} · ${book.status === 'Published' ? book.year : book.status}`, title: escape(book.title), text: escape(book.subtitle), image: book.cover, alt: `${book.title} by Micheal Lanham${book.cover ? ', with its cover' : ''}` })),
  ...DEMOS.map(demo => ({ path: `/demos/${demo.slug}/`, name: `demo-${demo.slug}`, kind: 'demo', kicker: demo.engine ? `Concept game · ${demo.engine.kicker}` : 'Neural-network teaching game', title: escape(demo.title), text: escape(demo.description), image: demo.poster, alt: `${demo.title}, an interactive demo by Micheal Lanham` })),
]

const STYLE = `
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { position: relative; color: #14283B; font-family: Inter, sans-serif; background: radial-gradient(900px 520px at 10% 0, rgba(255, 255, 255, .65), transparent 70%), repeating-linear-gradient(0deg, transparent 0 39px, rgba(45, 80, 200, .06) 39px 40px), #F5F6F8; }
.frame { position: absolute; inset: 22px; border: 1px solid #D4DCE7; outline: 1px solid #D4DCE7; outline-offset: -7px; }
.copy { position: absolute; left: 76px; top: 72px; bottom: 70px; display: flex; flex-direction: column; }
.kicker { font: 500 19px/1.4 'JetBrains Mono', monospace; letter-spacing: .14em; text-transform: uppercase; color: #2D50C8; }
h1 { margin-top: 20px; font: 600 var(--size, 64px)/1.06 Fraunces, serif; letter-spacing: -.015em; text-wrap: balance; }
h1 em { font-style: italic; color: #2D50C8; white-space: nowrap; }
.text { margin-top: 22px; font-size: 25px; line-height: 1.45; color: #536477; }
.brand { margin-top: auto; padding-top: 24px; display: flex; align-items: center; gap: 14px; font: 600 27px/1 Fraunces, serif; }
.brand svg { width: 46px; height: 46px; }
.brand span { margin-left: 8px; font: 500 18px/1 'JetBrains Mono', monospace; letter-spacing: .06em; color: #536477; }
.art { position: absolute; top: 50%; transform: translateY(-50%); }
.book .copy { width: 640px; } .book .art { right: 92px; }
.cover { display: block; width: 290px; border: 1px solid #D4DCE7; box-shadow: 0 26px 50px rgba(20, 40, 59, .25); transform: rotate(3deg); }
.typeset { width: 290px; height: 390px; padding: 30px; display: flex; flex-direction: column; justify-content: space-between; background: #FFFFFF; border-left: 7px solid #2D50C8; box-shadow: 0 26px 50px rgba(20, 40, 59, .22); transform: rotate(3deg); }
.typeset small { font: 500 15px/1.4 'JetBrains Mono', monospace; letter-spacing: .1em; text-transform: uppercase; color: #536477; }
.typeset strong { font: 600 32px/1.15 Fraunces, serif; }
.demo .copy { width: 560px; } .demo .art { right: 66px; }
.engine { position: relative; width: 460px; padding: 14px; border-radius: 12px; background: linear-gradient(180deg, #221B14, #17130E); box-shadow: 0 0 0 1px #8E6526, 0 0 0 5px #5C4218, 0 26px 50px rgba(20, 40, 59, .3); }
.engine img { display: block; width: 100%; border-radius: 6px; }
.site .copy { width: 590px; } .site .art { right: 70px; width: 420px; height: 470px; }
.oval { position: absolute; right: 0; top: 18px; width: 270px; height: 338px; padding: 10px; border-radius: 50%; background: linear-gradient(135deg, #2D50C8, #14283B); box-shadow: 0 20px 44px rgba(20, 40, 59, .3); }
.oval img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.tree { position: absolute; left: 0; top: 0; width: 200px; color: #14283B; opacity: .72; }
.tree svg { display: block; width: 100%; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.pinned { position: absolute; width: 112px; border: 1px solid #D4DCE7; box-shadow: 0 14px 26px rgba(20, 40, 59, .25); }
.pinned.one { left: 6px; bottom: 58px; transform: rotate(-8deg); }
.pinned.two { left: 96px; bottom: 40px; transform: rotate(3deg); }
`
const TREE = '<svg viewBox="0 0 220 200"><text x="18" y="26" font-family="Fraunces, serif" font-style="italic" font-size="20" fill="currentColor" stroke="none">I think</text><path d="M40 182 C 44 150, 60 140, 72 120 C 84 100, 86 84, 104 70"/><path d="M72 120 C 92 122, 108 112, 126 100 C 144 88, 160 92, 176 78"/><path d="M104 70 C 116 58, 120 46, 138 40"/><path d="M104 70 C 96 54, 92 46, 98 30"/><path d="M126 100 C 132 116, 146 124, 162 126"/><path d="M60 140 C 46 130, 36 120, 30 104"/><path d="M138 40 h 12 M98 30 v -10 M176 78 l 10 -6 M162 126 l 12 2 M30 104 l -8 -8"/><circle cx="40" cy="182" r="3"/></svg>'

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' }
const dataUrl = async file => `data:${MIME[file.slice(file.lastIndexOf('.'))]};base64,${(await readFile(file)).toString('base64')}`

function art(card, images) {
  if (card.kind === 'site') return `<div class="art"><div class="tree">${TREE}</div><div class="oval"><img src="${images.portrait}" alt=""></div><img class="pinned one" src="${images.covers[0]}" alt=""><img class="pinned two" src="${images.covers[1]}" alt=""></div>`
  if (card.kind === 'demo') return `<div class="art"><div class="engine"><img src="${images.image}" alt=""></div></div>`
  return `<div class="art">${images.image ? `<img class="cover" src="${images.image}" alt="">` : `<div class="typeset"><small>${escape(card.kicker)}</small><strong>${card.title}</strong><small>Micheal Lanham</small></div>`}</div>`
}

function html(card, assets, images) {
  const faces = Object.entries(assets.fonts).map(([family, url]) => `@font-face { font-family: '${family}'; font-weight: 400 700; src: url(${url}) format('woff2'); }`).join('\n')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${faces}${STYLE}</style></head><body class="${card.kind}"><div class="frame"></div><div class="copy"><p class="kicker">${escape(card.kicker)}</p><h1>${card.title}</h1>${card.text ? `<p class="text">${card.text}</p>` : ''}<p class="brand">${assets.logo}Micheal Lanham<span>micheal-lanham.com</span></p></div>${art(card, images)}</body></html>`
}

// Everything a card depends on, so --check can tell a stale card without rendering it.
// Text is hashed with LF line endings, so a Windows checkout (autocrlf) agrees with CI.
const lf = text => text.replace(/\r\n?/g, '\n')
const fonts = await Promise.all(Object.values(FONTS).map(file => readFile(`public/fonts/${file}`)))
const shared = sha1([STYLE, TREE, lf(html.toString()), lf(art.toString()), ...fonts.map(sha1), sha1(lf(await readFile('public/logo.svg', 'utf8'))), sha1(await readFile('public/micheal-lanham.png'))].join('\n'))
const fingerprint = async card => sha1([shared, card.kind, card.kicker, card.title, card.text, card.alt, card.image ? sha1(await readFile(`public${card.image}`)) : '', ...(card.kind === 'site' ? await Promise.all(SITE_COVERS.map(async cover => sha1(await readFile(`public${cover}`)))) : [])].join('\n'))

const manifest = {}
for (const card of cards) manifest[card.path] = { image: `/social/${card.name}.jpg`, alt: card.alt, sha1: await fingerprint(card) }

if (CHECK) {
  const saved = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
  const problems = []
  for (const [path, entry] of Object.entries(manifest)) {
    if (!saved[path]) problems.push(`${path} has no card in ${MANIFEST}`)
    else if (saved[path].sha1 !== entry.sha1 || saved[path].image !== entry.image || saved[path].alt !== entry.alt) problems.push(`${path}: its card is out of date`)
    if (!existsSync(`public${entry.image}`)) problems.push(`${entry.image} is missing`)
  }
  for (const path of Object.keys(saved)) if (!manifest[path]) problems.push(`${path} is in ${MANIFEST} but has no page`)
  const built = existsSync(OUT) ? await readdir(OUT) : []
  for (const file of built) if (!Object.values(manifest).some(entry => entry.image === `/social/${file}`)) problems.push(`/social/${file} is not used by any page`)
  if (problems.length) {
    console.error(`Social cards are out of date; run npm run social.\n- ${problems.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`Social cards: ${cards.length} cards are current.`)
} else {
  const require = createRequire(import.meta.url)
  const { chromium } = require('@playwright/test')
  const assets = { logo: await readFile('public/logo.svg', 'utf8'), fonts: Object.fromEntries(await Promise.all(Object.entries(FONTS).map(async ([family, file]) => [family, await dataUrl(`public/fonts/${file}`)]))) }
  const siteImages = { portrait: await dataUrl('public/micheal-lanham.png'), covers: await Promise.all(SITE_COVERS.map(cover => dataUrl(`public${cover}`))) }
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ channel: process.env.CI ? undefined : 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  for (const card of cards) {
    const images = card.kind === 'site' ? siteImages : { image: card.image ? await dataUrl(`public${card.image}`) : undefined }
    await page.setContent(html(card, assets, images), { waitUntil: 'load' })
    // Long titles step down from 64 px until the copy fits the card.
    await page.evaluate(async () => {
      await document.fonts.ready
      const copy = document.querySelector('.copy'), title = document.querySelector('h1')
      for (let size = 64; size >= 40 && copy.scrollHeight > copy.clientHeight; size -= 2) title.style.setProperty('--size', `${size - 2}px`)
    })
    await page.screenshot({ path: `${OUT}/${card.name}.jpg`, type: 'jpeg', quality: 84 })
  }
  await browser.close()
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Built ${cards.length} social cards in ${OUT} and ${MANIFEST}.`)
}
