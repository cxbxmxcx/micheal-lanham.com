import { Link } from 'react-router'
import SectionShell from '@/components/SectionShell'

export default function About() {
  return <SectionShell id="about" kicker="About Micheal" title={<>A career spent making <span className="text-accent">ideas work.</span></>}>
    <div className="grid items-start gap-8 md:grid-cols-[220px_1fr] lg:gap-14">
      <img src="/micheal-lanham.png" alt="Micheal Lanham" width="350" height="436" loading="lazy" className="w-44 rounded-card border border-line md:w-full" />
      <div className="reading-copy"><p className="!mt-0 text-lg">I’m Micheal Lanham, a software practitioner and author based in Calgary, Canada. Over more than 20 years, I’ve worked across games, graphics, geoscience, and machine learning.</p><p>I began using neural networks and evolutionary algorithms in game development around 2000. That work still shapes what I write and build: systems that learn from experience, and practical ways to understand whether they are improving.</p><p>Today my focus is AI agents, evolutionary learning, and the tools that help teams put those ideas into practice.</p><div className="mt-6 flex flex-wrap gap-5"><a className="text-link" href="https://github.com/cxbxmxcx/self-improving-agents">Explore the Helix companion code ↗</a><Link className="text-link" to="/books/ai-agents-in-action-second-edition/">AI Agents in Action →</Link></div></div>
    </div>
  </SectionShell>
}
