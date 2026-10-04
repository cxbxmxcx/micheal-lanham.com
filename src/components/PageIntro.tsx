import { Link } from 'react-router'
import type { ReactNode } from 'react'

export default function PageIntro({ kicker, title, children, back }: { kicker: string; title: string; children?: ReactNode; back?: { to: string; label: string } }) {
  return <div className="page-intro">
    {back && <Link className="text-link mb-8" to={back.to}><span aria-hidden="true">←</span> {back.label}</Link>}
    <p className="kicker">{kicker}</p>
    <h1>{title}</h1>
    {children && <div className="section-lede">{children}</div>}
  </div>
}
