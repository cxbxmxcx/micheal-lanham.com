import SectionShell from '@/components/SectionShell'
import MailIcon from '@/components/MailIcon'
import { EMAIL, inquiry } from '@/data/contact'
import { useCopyEmail } from '@/lib/useCopyEmail'

export default function Contact() {
  const { copy, message } = useCopyEmail()
  return <SectionShell id="contact" kicker="Let’s talk" title="What are you working on?" lede="Tell me about your agent system, your team’s learning goals, or a question about the books." className="border-t border-line bg-surface-soft">
    <div className="flex flex-wrap items-center gap-4" data-reveal="up"><a className="btn-primary" href={inquiry('Let’s talk', 'Hi Micheal,\n\nI’m getting in touch about:\n\nA little context:\n')}><MailIcon /> Email Micheal</a><button className="btn-secondary" type="button" onClick={copy}>Copy email address</button></div>
    <p className="mt-5"><a className="break-all text-muted underline decoration-muted/50 underline-offset-4" href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    <p role="status" className="mt-3 min-h-6 text-sm text-teal">{message}</p>
  </SectionShell>
}
