// Builds the raster icons from public/logo.svg:
//   public/apple-touch-icon.png  180 px, the gear on paper (iOS needs an opaque icon)
//   public/favicon.ico           16, 32 and 48 px PNGs in one ICO, for older browsers
//   public/icon-192.png, icon-512.png  for public/site.webmanifest (Android home screens)
// Run `npm run icons` after changing the logo.
import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const logo = await readFile('public/logo.svg')
const PAPER = '#F5F6F8'

// The gear at 80% of an opaque paper square.
const onPaper = async size => sharp({ create: { width: size, height: size, channels: 4, background: PAPER } })
  .composite([{ input: await sharp(logo, { density: 1200 }).resize(Math.round(size * .8), Math.round(size * .8)).png().toBuffer(), gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toBuffer()
const touch = await onPaper(180)
await writeFile('public/apple-touch-icon.png', touch)
await writeFile('public/icon-192.png', await onPaper(192))
await writeFile('public/icon-512.png', await onPaper(512))

// An ICO whose entries are PNGs (supported by every browser since 2009).
const sizes = [16, 32, 48]
const images = await Promise.all(sizes.map(size => sharp(logo, { density: 600 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer()))
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
sizes.forEach((size, index) => {
  const entry = 6 + 16 * index
  header.writeUInt8(size, entry)
  header.writeUInt8(size, entry + 1)
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(images[index].length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += images[index].length
})
await writeFile('public/favicon.ico', Buffer.concat([header, ...images]))
console.log(`Built public/apple-touch-icon.png (${touch.length} B), icon-192.png, icon-512.png and favicon.ico (${offset} B).`)
