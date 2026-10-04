import { inquiry } from './contact'

export const SERVICES = [
  {
    slug: 'architecture-reviews', title: 'Agent architecture reviews',
    summary: 'Understand where your agent system holds up, where it breaks, and what to improve next.',
    audience: 'Teams building an agent prototype, preparing for deployment, or investigating reliability and cost problems.',
    scope: ['Orchestration and control-flow design', 'Tool and MCP integration patterns', 'Memory, state, and context strategy', 'Evaluation, observability, and failure modes', 'Cost, latency, and model selection'],
    inputs: ['Your goals and the decisions you need to make', 'An architecture diagram or walkthrough of the system', 'Representative tasks, evaluation results, and known failure cases'],
    deliverables: ['A written assessment of the agreed architecture and risks', 'Prioritized recommendations with evidence and suggested next steps', 'Questions to resolve and a proposed validation approach'],
    format: 'A written review, scoped around your system and the decisions ahead.',
    schedule: 'Send a short description of your system and target date. We agree on scope, access, fee, and delivery timing before the review begins.',
    cta: 'Request an architecture review',
    href: inquiry('Agent architecture review', 'Hi Micheal,\n\nSystem or project:\nWhat we need help with:\nCurrent stage and known issues:\nTarget date:\nLinks or materials we can share:\n'),
  },
  {
    slug: 'workshops', title: 'AI agent training workshops',
    summary: 'Help your team build, evaluate, and reason about agent systems through practical work.',
    audience: 'Engineering teams that want shared foundations and hands-on practice relevant to their own stack.',
    scope: ['Agent fundamentals and behavior patterns', 'Tools, MCP, and agent communication', 'Multi-agent collaboration and orchestration', 'Evaluation and feedback loops', 'Deployment and production concerns'],
    inputs: ['Your team size, roles, and experience with Python and agents', 'The frameworks and tools you use', 'Learning goals, preferred format, and possible dates'],
    deliverables: ['A curriculum agreed around your learning goals', 'Guided exercises and hands-on sessions', 'Time to discuss your architecture and next steps'],
    format: 'Remote or on-site. Session length and group format are agreed around the curriculum and team.',
    schedule: 'Share your goals, team size, and preferred dates. We confirm the curriculum, duration, preparation, and fee before booking.',
    cta: 'Discuss a team workshop',
    href: inquiry('AI agent training workshop', 'Hi Micheal,\n\nTeam size and roles:\nExperience with Python and AI agents:\nOur stack:\nLearning goals:\nRemote or on-site (location):\nPreferred dates and duration:\n'),
  },
]
