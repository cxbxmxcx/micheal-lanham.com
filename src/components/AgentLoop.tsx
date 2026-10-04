import { useState } from 'react'

const STEPS = [
  { name: 'Observe', label: 'Gather context', description: 'Bring together the task, relevant knowledge, and feedback from the environment.' },
  { name: 'Act', label: 'Put a plan to work', description: 'Choose a useful next step and use the right tools to carry it out.' },
  { name: 'Evaluate', label: 'Look for evidence', description: 'Compare the result with the goal. Use evidence to understand what worked and what failed.' },
  { name: 'Improve', label: 'Make a measured change', description: 'Test a change to the strategy, memory, or tools. Keep it when the evidence supports an improvement.' },
]
const PATHS = ['M146 48H248', 'M320 86V210', 'M254 252H152', 'M80 214V90']

export default function AgentLoop() {
  const [selected, setSelected] = useState(0)
  const step = STEPS[selected]
  return <figure className="agent-loop">
    <figcaption className="loop-caption"><span className="loop-dot" aria-hidden="true" /> The agent learning loop</figcaption>
    <div className="loop-diagram" role="group" aria-label="Explore the agent learning loop">
      <svg viewBox="0 0 400 300" fill="none" aria-hidden="true">
        <defs><marker id="loop-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="currentColor" /></marker></defs>
        <circle cx="200" cy="150" r="67" className="loop-orbit" />
        <path d="M120 80L155 115M280 80L245 115M280 220L245 185M120 220L155 185" className="loop-spokes" />
        {PATHS.map((path, index) => <path key={path} d={path} markerEnd="url(#loop-arrow)" className={`loop-flow ${index === selected ? 'is-selected' : ''}`} />)}
      </svg>
      <div className="loop-core" aria-hidden="true"><span>Agent</span><small>Context + memory</small></div>
      {STEPS.map((item, index) => <button key={item.name} type="button" className="loop-node" data-step={index} aria-label={item.name} aria-pressed={index === selected} aria-controls="agent-step" onClick={() => setSelected(index)}><span aria-hidden="true">0{index + 1}</span>{item.name}</button>)}
    </div>
    <div id="agent-step" className="loop-explanation" role="status" aria-live="polite" aria-atomic="true"><p className="font-display font-semibold">{step.label}</p><p>{step.description}</p></div>
    <p className="loop-hint">Select a step to explore.</p>
  </figure>
}
