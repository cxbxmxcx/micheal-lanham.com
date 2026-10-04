import { useEffect, useRef, useState } from 'react'
import type { Demo } from '@/data/demos'

export default function DemoPlayer({ demo }: { demo: Demo }) {
  const [active, setActive] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const iframe = useRef<HTMLIFrameElement>(null)
  const start = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!active) return
    const timeout = window.setTimeout(() => setStatus('error'), 45_000)
    const ready = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow || event.origin !== window.location.origin || event.data?.type !== 'unity-ready') return
      clearTimeout(timeout)
      setStatus('ready')
      // Do not steal focus if the visitor has already moved elsewhere.
      if (document.activeElement === closeButton.current) iframe.current?.focus()
    }
    window.addEventListener('message', ready)
    const desktop = window.matchMedia('(min-width: 768px)')
    const resize = () => { if (!desktop.matches) setActive(false) }
    desktop.addEventListener('change', resize)
    closeButton.current?.focus()
    return () => { clearTimeout(timeout); window.removeEventListener('message', ready); desktop.removeEventListener('change', resize) }
  }, [active, attempt])

  const close = () => { setActive(false); requestAnimationFrame(() => start.current?.focus()) }
  return <div className="mt-8">
    <div className="flex flex-wrap items-center gap-4">
      <a className="btn-amber" href={demo.playUrl}>Play {demo.title} <span aria-hidden="true">↗</span></a>
      {!active && <button ref={start} type="button" className="btn-ghost-teal hidden md:inline-flex" onClick={() => { setStatus('loading'); setActive(true) }}>Play here</button>}
    </div>
    <p className="mt-4 text-sm text-muted">{demo.device}. Opens on its own page for more room to explore.</p>
    {active && <div className="demo-player mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-panel-line p-4">
        <span role="status" className="text-sm text-muted">{status === 'ready' ? `${demo.title} is running.` : status === 'error' ? 'The demo has not reported ready.' : `Loading ${demo.title}…`}</span>
        <button ref={closeButton} className="text-link" type="button" onClick={close}>Close demo</button>
      </div>
      {status === 'error' && <div className="border-b border-panel-line p-5"><p className="mb-3">The demo may still be loading. Try again or open its own page.</p><button className="btn-ghost-teal" onClick={() => { setStatus('loading'); setAttempt(n => n + 1) }}>Try again</button><a className="text-link ml-5" href={demo.playUrl}>Open demo page</a></div>}
      <iframe key={attempt} ref={iframe} src={demo.playUrl} title={demo.title} onError={() => setStatus('error')} allow="autoplay; fullscreen; gamepad" allowFullScreen />
    </div>}
  </div>
}
