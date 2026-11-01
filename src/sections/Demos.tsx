import { Link } from 'react-router'
import { DEMOS } from '@/data/demos'
import SectionShell from '@/components/SectionShell'
import LabTiles from '@/components/LabTiles'

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const word = (count: number) => WORDS[count] ?? String(count)
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export default function Demos() {
  const [featured, ...others] = DEMOS
  return <SectionShell id="demos" kicker="Learn by doing" title="Put an idea to the test." lede={`${sentence(word(DEMOS.length))} demos to play. Start with ${featured.title}: ${featured.description.charAt(0).toLowerCase()}${featured.description.slice(1)}`} className="lab-band">
    <div className="lab-home">
      <article className="lab-feature">
        <Link to={`/demos/${featured.slug}/`} tabIndex={-1} aria-hidden="true"><img src={featured.poster} width="960" height="600" alt="" loading="lazy" /></Link>
        <div className="lab-feature-copy">
          <p className="lab-meta">{featured.duration} · No account needed</p>
          <h3>{featured.title}</h3>
          <p>{featured.description} {featured.outcome}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a className="btn-lab" href={featured.playUrl}>Play {featured.title}</a>
            <Link className="lab-link" to="/demos/">See all {word(DEMOS.length)} demos <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </article>
      <LabTiles demos={others} label="More demos" />
    </div>
  </SectionShell>
}
