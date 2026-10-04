import { useEffect, useRef } from 'react'

/** Restrained decoration; never required for reading or navigation. */
export default function NeuralSwarm() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!
    const context = canvas.getContext('2d')
    if (!context) return
    const ctx = context
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0, height = 0, frame = 0, visible = true, last = 0
    const points = Array.from({ length: 70 }, (_, i) => ({ x: Math.random(), y: Math.random(), dx: (Math.random() - 0.5) * 0.000014, dy: (Math.random() - 0.5) * 0.000014, amber: i % 9 === 0 }))
    const rings: { x: number; y: number; start: number }[] = []
    const size = () => {
      width = canvas.clientWidth; height = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const draw = (now: number) => {
      const delta = motion.matches ? 0 : Math.min(last ? now - last : 16, 40)
      last = now
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < points.length; i++) {
        const point = points[i]
        point.x = (point.x + point.dx * delta + 1) % 1
        point.y = (point.y + point.dy * delta + 1) % 1
        for (let j = i + 1; j < points.length; j++) {
          const next = points[j]
          const distance = Math.hypot((point.x - next.x) * width, (point.y - next.y) * height)
          if (distance > 150) continue
          ctx.strokeStyle = `rgba(62,158,150,${0.35 * (1 - distance / 150)})`
          ctx.beginPath(); ctx.moveTo(point.x * width, point.y * height); ctx.lineTo(next.x * width, next.y * height); ctx.stroke()
        }
        ctx.fillStyle = point.amber ? '#E09B4A' : '#3E9E96'
        ctx.beginPath(); ctx.arc(point.x * width, point.y * height, point.amber ? 2.5 : 1.5, 0, Math.PI * 2); ctx.fill()
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        // A rAF timestamp can precede a pointer event from the same frame.
        const progress = Math.max(0, (now - rings[i].start) / 650)
        if (progress >= 1) { rings.splice(i, 1); continue }
        ctx.strokeStyle = `rgba(224,155,74,${0.35 * (1 - progress)})`
        ctx.beginPath(); ctx.arc(rings[i].x, rings[i].y, progress * 90, 0, Math.PI * 2); ctx.stroke()
      }
    }
    const loop = (now: number) => { draw(now); if (visible && !motion.matches) frame = requestAnimationFrame(loop) }
    const restart = () => { cancelAnimationFrame(frame); last = 0; if (visible) { draw(performance.now()); if (!motion.matches) frame = requestAnimationFrame(loop) } }
    const resize = new ResizeObserver(() => { size(); restart() })
    resize.observe(canvas)
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; restart() })
    observer.observe(canvas)
    const click = (event: PointerEvent) => {
      if (motion.matches) return
      const rect = canvas.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return
      rings.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, start: performance.now() })
      if (rings.length > 4) rings.shift()
    }
    window.addEventListener('pointerdown', click)
    motion.addEventListener('change', restart)
    return () => { cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect(); window.removeEventListener('pointerdown', click); motion.removeEventListener('change', restart) }
  }, [])
  return <canvas ref={ref} className="h-full w-full" aria-hidden="true" />
}
