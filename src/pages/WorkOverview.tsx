import PageIntro from '@/components/PageIntro'
import ServiceCards from '@/components/ServiceCards'
import Contact from '@/sections/Contact'

export default function WorkOverview() {
  return <>
    <div className="container-x pb-16"><PageIntro kicker="Work with me" title="Build better agent systems."><p>I help teams examine the systems they are building and develop the skills to improve them. Start with an architecture review or a workshop shaped around your team.</p></PageIntro><ServiceCards />
      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {[['Start with the problem', 'Share your system or learning goals, the decisions ahead, and your preferred timing.'], ['Agree on the work', 'We define the scope, materials, deliverables, schedule, and fee before starting.'], ['Put it into practice', 'Use the findings or workshop exercises to guide the next changes to your system.']].map(([title, text], index) => <div key={title}><p className="mb-3 font-mono text-sm text-teal">0{index + 1}</p><h2 className="font-display text-xl font-semibold">{title}</h2><p className="mt-3 leading-relaxed text-muted">{text}</p></div>)}
      </div>
      <div className="notice mt-12"><p>My teaching includes books on AI agents, evolutionary deep learning, and generative systems, alongside previous deep learning and reinforcement learning courses through O’Reilly.</p></div>
    </div><Contact />
  </>
}
