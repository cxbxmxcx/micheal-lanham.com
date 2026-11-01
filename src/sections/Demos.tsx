import { Link } from 'react-router'
import { DEMOS } from '@/data/demos'
import SectionShell from '@/components/SectionShell'
import LabTiles from '@/components/LabTiles'
import EngineEmblem from '@/components/EngineEmblem'

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const word = (count: number) => WORDS[count] ?? String(count)
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// The laboratory: the concept games as brass-bezelled engines, then the Unity teaching games.
export default function Demos() {
  const engines = DEMOS.filter(demo => demo.engine)
  const classics = DEMOS.filter(demo => !demo.engine)
  return <SectionShell id="demos" kicker="The laboratory" title={`${sentence(word(engines.length))} engines for agents that learn.`} lede="Each game is a small machine you can operate: measure what good means, turn slow reasoning into instinct, and find the rule that writes the memory." className="lab-band">
    <ul className="engines" aria-label="Concept games">
      {engines.map(demo => <li key={demo.slug} className="engine">
        <EngineEmblem slug={demo.slug} />
        <p className="kicker">{demo.engine!.kicker}</p>
        <h3><Link to={`/demos/${demo.slug}/`}>{demo.title}</Link></h3>
        <p className="engine-text">{demo.description}</p>
        <dl className="gauges">{demo.engine!.gauges.map(([label, value]) => <div key={label} className="gauge"><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <div className="engine-actions"><span className="lab-meta">{demo.duration}</span><a className="btn-lab" href={demo.playUrl}>Play {demo.title}</a></div>
      </li>)}
    </ul>
    <div className="lab-more">
      <div className="lab-more-head">
        <h3>Also in the lab: {word(classics.length)} neural-network teaching games</h3>
        <Link className="lab-link" to="/demos/">See all {word(DEMOS.length)} demos <span aria-hidden="true">→</span></Link>
      </div>
      <LabTiles demos={classics} label="Neural-network teaching games" />
    </div>
  </SectionShell>
}
