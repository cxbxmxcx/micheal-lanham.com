import { Link } from 'react-router'
import type { Demo } from '@/data/demos'

// Poster tiles for the dark "lab" look: the homepage lab band and the end of each demo page.
export default function LabTiles({ demos, label }: { demos: Demo[]; label: string }) {
  return <ul className="lab-tiles" aria-label={label}>
    {demos.map(demo => <li key={demo.slug}><Link to={`/demos/${demo.slug}/`}>
      <img src={demo.poster} width="960" height="600" alt="" loading="lazy" />
      <span className="lab-tile-title">{demo.title}</span>
      <span className="lab-tile-meta">{demo.kind === 'Browser' ? 'Runs in your browser' : 'Desktop · Unity WebGL'}</span>
    </Link></li>)}
  </ul>
}
