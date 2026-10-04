import PageIntro from '@/components/PageIntro'
import DemoPreview from '@/components/DemoPreview'
import { DEMOS } from '@/data/demos'

export default function DemoLibrary() {
  return <div className="container-x pb-20"><PageIntro kicker="Learn by doing" title="Make the theory tangible."><p>Five interactive ways to explore learning systems. Start with a short story about improvement, try a simulation, or experiment with a neural network.</p></PageIntro><div className="grid gap-6 md:grid-cols-2">{DEMOS.map(demo => <DemoPreview key={demo.slug} demo={demo} />)}</div></div>
}
