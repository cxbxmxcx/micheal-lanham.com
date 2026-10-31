import { EMAIL } from '@/data/contact'
import { useCopyEmail } from '@/lib/useCopyEmail'

export default function EmailFallback({ className = '' }: { className?: string }) {
  const { copy, message } = useCopyEmail()
  return <div className={className}>
    <p className="text-sm text-muted">No mail app? Write to <a className="break-words text-teal underline decoration-teal/40 underline-offset-4" href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
    <button className="btn-secondary mt-3" type="button" onClick={copy}>Copy email address</button>
    <p role="status" className="mt-2 min-h-5 text-sm text-teal">{message}</p>
  </div>
}
