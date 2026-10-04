import { useState } from 'react'
import SectionShell from '@/components/SectionShell'
import { EMAIL, inquiry } from '@/data/contact'

export default function Contact() {
  const [message, setMessage] = useState('')
  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); setMessage('Email address copied.') }
    catch { setMessage('Copy was unavailable. Select the email address below to copy it.') }
  }
  return <SectionShell id="contact" kicker="Let’s talk" title="What are you working on?" lede="Tell me about your agent system, your team’s learning goals, or a question about the books." className="border-t border-panel-line bg-void-2">
    <div className="flex flex-wrap items-center gap-4"><a className="btn-amber" href={inquiry('Let’s talk', 'Hi Micheal,\n\nI’m getting in touch about:\n\nA little context:\n')}>Email Micheal <span aria-hidden="true">↗</span></a><button className="btn-ghost-teal" type="button" onClick={copy}>Copy email address</button></div>
    <p className="mt-5"><a className="break-all text-muted underline decoration-muted/50 underline-offset-4" href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    <p role="status" className="mt-3 min-h-6 text-sm text-teal">{message}</p>
  </SectionShell>
}
