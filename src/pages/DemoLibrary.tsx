import PageIntro from '@/components/PageIntro'
import DemoPreview from '@/components/DemoPreview'
import { DEMOS } from '@/data/demos'

export default function DemoLibrary() {
  const [featured, ...others] = DEMOS
  return <>
    <div className="container-x"><PageIntro kicker="Learn by doing" title="Make the theory tangible."><p>Six interactive ways to explore learning systems: three concept games about agents that learn, and three neural-network teaching games.</p></PageIntro></div>
    <div className="lab-band lab-library">
      <div className="container-x">
        <DemoPreview demo={featured} featured />
        <div className="lab-library-grid" data-reveal="stagger">{others.map(demo => <DemoPreview key={demo.slug} demo={demo} />)}</div>
      </div>
    </div>
  </>
}
