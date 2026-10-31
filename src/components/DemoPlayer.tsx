import { useEffect, useRef, useState } from 'react'
import type { Demo } from '@/data/demos'

export default function DemoPlayer({ demo }: { demo: Demo }) {
  const [active, setActive] = useState(false)
  // 'error': no ready message yet (it may still be loading); 'failed': the game reported an error.
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'failed'>('loading')
  const [attempt, setAttempt] = useState(0)
  const iframe = useRef<HTMLIFrameElement>(null)
  const start = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  // Unity games need a mouse and a 1,050 px canvas. On phones and small touch
  // tablets CSS hides the play buttons and shows the notice below instead.
  const unity = demo.kind === 'Unity WebGL'
  const desktopOnly = unity ? ' unity-desktop-play' : ''

  useEffect(() => {
    if (!active) return
    const timeout = window.setTimeout(() => setStatus('error'), 45_000)
    const ready = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow || event.origin !== window.location.origin) return
      if (event.data?.type === 'unity-error') { clearTimeout(timeout); setStatus('failed'); return }
      if (event.data?.type !== 'unity-ready') return
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
      <a className={`btn-primary${desktopOnly}`} href={demo.playUrl}>Play {demo.title} <span aria-hidden="true">→</span></a>
      {!active && <button ref={start} type="button" className={`btn-secondary hidden md:inline-flex${desktopOnly}`} onClick={() => { setStatus('loading'); setActive(true) }}>Play here</button>}
    </div>
    {unity && <div className="notice unity-phone-gate"><h2>Desktop required</h2><p>{demo.title} is a Unity WebGL game made for desktop browsers. It needs a mouse or trackpad and a screen at least 1,050 pixels wide, and it downloads about 5&nbsp;MB.</p><a className="btn-secondary mt-4" href={`${demo.playUrl}?device=any`}>Continue anyway <span aria-hidden="true">→</span></a></div>}
    <p className="mt-4 text-sm text-muted">{demo.device}. Opens on its own page for more room to explore.</p>
    {active && <div className="demo-player mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-4">
        <span role="status" className="text-sm text-muted">{status === 'ready' ? `${demo.title} is running.` : status === 'error' ? 'The demo has not reported ready.' : status === 'failed' ? 'The demo could not start.' : `Loading ${demo.title}…`}</span>
        <button ref={closeButton} className="text-link" type="button" onClick={close}>Close demo</button>
      </div>
      {(status === 'error' || status === 'failed') && <div className="border-b border-line p-5"><p className="mb-3">{status === 'failed' ? 'The demo reported an error.' : 'The demo may still be loading.'} Try again or open its own page.</p><button className="btn-secondary" onClick={() => { setStatus('loading'); setAttempt(n => n + 1) }}>Try again</button><a className="text-link ml-5" href={demo.playUrl}>Open demo page</a></div>}
      <iframe key={attempt} ref={iframe} src={demo.playUrl} title={demo.title} onError={() => setStatus('error')} allow="autoplay; fullscreen; gamepad" allowFullScreen />
    </div>}
  </div>
}
