// Builds the responsive WebP versions of the book covers and the author
// portrait, plus src/data/images.json, which src/lib/images.ts reads for
// srcset and intrinsic sizes. The originals stay in public/ for structured data.
//
//   npm run images                          regenerate after adding or replacing an image
//   node scripts/build-images.mjs --check   (part of npm test) fail if anything is stale
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises'

const CHECK = process.argv.includes('--check')
const MANIFEST = 'src/data/images.json'
const COVER_WIDTHS = [240, 480, 720]
const PORTRAIT_WIDTHS = [220, 440]

const covers = (await readdir('public/books')).filter(file => /\.(jpe?g|png)$/i.test(file)).sort()
const sources = [
  ...covers.map(file => ({ source: `/books/${file}`, widths: COVER_WIDTHS })),
  { source: '/micheal-lanham.png', widths: PORTRAIT_WIDTHS },
]
const sha1 = buffer => createHash('sha1').update(buffer).digest('hex')
const variantPath = (source, width) => `/img${source.replace(/\.\w+$/, '')}-${width}.webp`
// Never upscale: a width past the original collapses to the original width.
const targetWidths = (widths, original) => [...new Set(widths.map(width => Math.min(width, original)))]

if (CHECK) {
  const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
  const problems = []
  const expected = new Set()
  for (const { source } of sources) {
    const entry = manifest[source]
    if (!entry) { problems.push(`${source} has no entry in ${MANIFEST}`); continue }
    if (entry.sha1 !== sha1(await readFile(`public${source}`))) problems.push(`${source} changed since its WebP versions were built`)
    for (const { src } of entry.variants) {
      expected.add(src)
      if (!existsSync(`public${src}`)) problems.push(`${src} is missing`)
    }
  }
  for (const source of Object.keys(manifest)) if (!sources.some(item => item.source === source)) problems.push(`${source} is in ${MANIFEST} but no longer exists`)
  const built = existsSync('public/img') ? (await readdir('public/img', { recursive: true })).filter(file => file.endsWith('.webp')).map(file => `/img/${file.replaceAll('\\', '/')}`) : []
  for (const file of built) if (!expected.has(file)) problems.push(`${file} is not used by any image`)
  if (problems.length) {
    console.error(`Responsive images are out of date; run npm run images.\n- ${problems.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`Responsive images: ${sources.length} originals and ${expected.size} WebP files are current.`)
} else {
  const { default: sharp } = await import('sharp')
  await rm('public/img', { recursive: true, force: true })
  await mkdir('public/img/books', { recursive: true })
  const manifest = {}
  for (const { source, widths } of sources) {
    const buffer = await readFile(`public${source}`)
    const { width, height } = await sharp(buffer).metadata()
    const variants = []
    for (const target of targetWidths(widths, width)) {
      const src = variantPath(source, target)
      await sharp(buffer).resize({ width: target }).webp({ quality: 80, effort: 6 }).toFile(`public${src}`)
      variants.push({ src, width: target })
    }
    manifest[source] = { sha1: sha1(buffer), width, height, variants }
  }
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Built WebP versions of ${sources.length} images into public/img/ and wrote ${MANIFEST}.`)
}
