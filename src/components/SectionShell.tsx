import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionShellProps {
  id: string
  index?: string
  kicker: string
  title: ReactNode
  lede?: string
  children?: ReactNode
  className?: string
}

export default function SectionShell({ id, kicker, title, lede, children, className }: SectionShellProps) {
  return <section id={id} tabIndex={-1} className={cn('section-space', className)}>
    <div className="container-x">
      <div className="section-heading"><p className="kicker">{kicker}</p><h2>{title}</h2>{lede && <p className="section-lede">{lede}</p>}</div>
      {children}
    </div>
  </section>
}
