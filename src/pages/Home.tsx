import Hero from '@/sections/Hero'
import Books from '@/sections/Books'
import Demos from '@/sections/Demos'
import Work from '@/sections/Work'
import About from '@/sections/About'
import Contact from '@/sections/Contact'
import NetworkDivider from '@/components/NetworkDivider'

/**
 * Single-page composition — anchor sections in scroll order:
 * Hero → Books → Demos → Work → About → Contact.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <NetworkDivider label="// 01 — THE LIBRARY" />
      <Books />
      <NetworkDivider label="// 02 — PLAYABLE THEORY" />
      <Demos />
      <NetworkDivider label="// 03 — WORK WITH ME" />
      <Work />
      <NetworkDivider label="// 04 — THE OPERATOR" />
      <About />
      <NetworkDivider label="// 05 — MAKE CONTACT" />
      <Contact />
    </>
  )
}
