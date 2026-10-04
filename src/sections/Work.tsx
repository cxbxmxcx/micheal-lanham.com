import SectionShell from '@/components/SectionShell'
import ServiceCards from '@/components/ServiceCards'

export default function Work() {
  return <SectionShell id="work" kicker="Work with me" title={<>Move your agent system <span className="text-gradient">forward.</span></>} lede="A second set of eyes on your architecture. Practical training for the people building it." className="border-y border-panel-line bg-void-2"><ServiceCards /></SectionShell>
}
