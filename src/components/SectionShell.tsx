import type { ReactNode } from 'react'

interface SectionShellProps {
  id: string
  kicker: string
  title: ReactNode
  lede?: string
  children?: ReactNode
  className?: string
}

export default function SectionShell({ id, kicker, title, lede, children, className }: SectionShellProps) {
  return <section id={id} tabIndex={-1} className={className ? `section-space ${className}` : 'section-space'}>
    <div className="container-x">
      <div className="section-heading" data-reveal="up"><p className="kicker">{kicker}</p><h2>{title}</h2>{lede && <p className="section-lede">{lede}</p>}</div>
      {children}
    </div>
  </section>
}
