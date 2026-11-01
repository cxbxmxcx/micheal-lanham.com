import { DEMOS } from '@/data/demos'
import LabTiles from './LabTiles'

// Ends each demo page with the other demos, in the lab's dark look.
export default function MoreDemos({ current }: { current: string }) {
  return <section className="lab-panel" aria-labelledby="more-demos-title">
    <p className="kicker">Keep playing</p>
    <h2 id="more-demos-title">More demos</h2>
    <LabTiles demos={DEMOS.filter(demo => demo.slug !== current)} label="More demos" />
  </section>
}
