import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const GAME = '/demos/Selection_Engine/index.html'
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

type GameState = {
  scene: string
  chapter: number
  learned: Record<string, boolean>
  c2: { ix: number, quality: number, labels: number, critiques: number, junk: number, regress: number, kept: number, missed: number }
  c3: { method: string | null, round: number, runs: Record<string, { best: number, rounds: number }> }
  deployed: number
}
type Hook = {
  state(): GameState
  actions(): string[]
  click(id: string): boolean
  start(chapter: number): string
  judgeOnly(): { truth: number, judged: number, raw: number, kept: number, good: number, junk: number, regress: number }
}
const state = (page: Page) => page.evaluate(() => (window as unknown as { __selection: Hook }).__selection.state())
const start = (page: Page, chapter: number) => page.evaluate(n => (window as unknown as { __selection: Hook }).__selection.start(n), chapter)
const hookClick = (page: Page, id: string) => page.evaluate(i => (window as unknown as { __selection: Hook }).__selection.click(i), id)
const heading = (page: Page) => page.locator('#scene h2')

async function axe(page: Page, label: string) {
  const report = await new AxeBuilder({ page }).include('.se-wrap').withTags(WCAG).analyze()
  expect(report.violations, label + ' ' + JSON.stringify(report.violations.map(v => [v.id, v.nodes.map(n => n.target)]))).toEqual([])
}

/* The perfect gate for chapter 2: ship the three real rules, reject the rest. */
const C2_KEEP: Record<number, boolean> = { 0: true, 1: false, 2: true, 3: false, 4: true, 5: false }

test('the whole game plays by mouse, every scene passes axe, and every number holds', async ({ page }) => {
  test.slow()
  const origin = new URL(process.env.SITE_URL || 'http://127.0.0.1:3000').origin
  const foreign: string[] = []
  page.on('request', request => { if (!request.url().startsWith(origin) && !request.url().startsWith('data:')) foreign.push(request.url()) })
  await page.goto(GAME)
  const seen = new Set<string>()
  const check = async () => {
    const { scene } = await state(page)
    if (!seen.has(scene)) { seen.add(scene); await axe(page, scene) }
  }
  const click = async (id: string) => { await page.locator('#' + id).click(); await check() }

  await expect(heading(page)).toHaveText('Build a machine that improves itself')
  await check()

  // Chapter 1: define good, read instruments, gate three claims.
  await click('se-next')
  await click('good-a')
  await expect(page.locator('#good-feedback')).toContainText('Not quite.')
  await expect(page.locator('#status')).toContainText('Not quite.')
  await click('good-b')
  await expect(heading(page)).toHaveText('Good is something you can compute')
  expect((await state(page)).learned.good).toBe(true)
  await click('se-next')
  await click('read-judge')
  await expect(page.locator('#out-judge')).toContainText('9/10')
  await click('read-proof')
  await expect(page.locator('#out-proof')).toContainText('= 7')
  await click('read-jev')
  await expect(page.locator('#out-jev')).toContainText('count_is_correct: no · p 0.93')
  await click('se-reject')
  await expect(heading(page)).toHaveText('The count was 7')
  await expect(page.locator('#scene')).toContainText('Rightly rejected.')
  await click('se-next')
  await click('read-proof')
  await expect(page.locator('#out-proof')).toContainText('Nothing to compute')
  await click('se-keep')
  await expect(heading(page)).toHaveText('You just measured instead of proving')

  // Chapter 2: the revenue task, gated cleanly.
  await click('se-next')
  await expect(page.locator('#scene')).toContainText('Cy $508 · Ben $446 · Dee $260')
  await expect(page.locator('#scene')).toContainText('Cy $358 · Ben $296 · Dee $220')
  await click('se-next')
  await expect(page.locator('#scene')).toContainText('→ 63')
  await expect(page.locator('#scene')).toContainText('→ 100')
  await click('se-next')
  for (let step = 0; step < 6; step++) {
    const s = await state(page)
    expect(s.scene).toBe('c2-version')
    await click('read-jev')
    if (s.c2.ix === 5) {
      await click('read-label')
      await expect(page.locator('#out-label')).toHaveText('= 78 (exact)')
      await click('read-judge')
      await expect(page.locator('#out-judge')).toHaveText('≈ 87 (opinion)')
    }
    await click(C2_KEEP[s.c2.ix] ? 'se-keep' : 'se-reject')
    await click('se-next')
    if ((await state(page)).scene === 'c2-debrief') break
  }
  const c2 = (await state(page)).c2
  expect(c2).toMatchObject({ quality: 86, junk: 0, regress: 0, kept: 3, missed: 0, labels: 2 })
  await expect(page.locator('#scene')).toContainText('A clean gate.')
  await expect(page.locator('#scene')).toContainText('It would report 100 out of 100 while the truth sat at 78')
  await expect(page.locator('#gauges')).toContainText('86 / 100')

  // Chapter 3: the ratchet parks, GEPA and the archive recover.
  await click('se-next')
  await expect(page.locator('#se-next')).toHaveCount(0)
  await click('run-hill')
  await click('se-runall')
  await expect(heading(page)).toHaveText('Parked at 86')
  await expect(page.locator('#scene')).toContainText('The ratchet parked.')
  await expect(page.locator('#se-next')).toHaveCount(0) // no way on until a search passes the peak
  await click('run-gepa')
  for (let round = 1; round <= 6; round++) await click('se-step')
  await expect(heading(page)).toHaveText('Past the peak: 92')
  await expect(page.locator('#scene .se-front')).toContainText('The front nowB3 (92, best on totals and dates)')
  await click('run-dgm')
  for (let round = 1; round <= 7; round++) await click('se-step')
  // Before the last round the archive table shows B2's chance of being drawn.
  await expect(page.locator('#scene table')).toContainText('B2 · 70 ◀ next')
  await expect(page.locator('#scene table')).toContainText('20%')
  await click('se-step')
  await expect(heading(page)).toHaveText('Past the peak: 92')
  const c3 = (await state(page)).c3
  expect(c3.runs).toEqual({ hill: { best: 86, rounds: 7 }, gepa: { best: 92, rounds: 6 }, dgm: { best: 92, rounds: 8 } })
  await expect(page.locator('#scene')).toContainText('Hill climbing: parked at 86 · GEPA: reached 92 in 6 rounds · Darwin Gödel Machine: reached 92 in 8 rounds')

  await click('se-next')
  await expect(heading(page)).toHaveText('Four parts, and the order matters')
  expect(Object.values((await state(page)).learned)).toEqual([true, true, true, true])
  await expect(page.locator('#stations')).toContainText('✓ in place')
  await expect(page.getByRole('link', { name: /Read it in early access/ })).toHaveAttribute('href', 'https://www.manning.com/books/self-improving-agents')
  await click('se-replay')
  await expect(heading(page)).toHaveText('Build a machine that improves itself')

  expect([...seen].sort()).toEqual(['c1-count', 'c1-count-result', 'c1-good', 'c1-proof', 'c1-sum', 'c1-sum-result', 'c2-check', 'c2-debrief', 'c2-result', 'c2-task', 'c2-version', 'c3-intro', 'c3-run', 'end', 'intro'])
  expect(foreign, 'no requests to other origins').toEqual([])
})

test('a judge-trusting gate leaks junk and the regression, exactly as the judge-only run predicts', async ({ page }) => {
  await page.goto(GAME)
  const judgeOnly = await page.evaluate(() => (window as unknown as { __selection: Hook }).__selection.judgeOnly())
  expect(judgeOnly).toEqual({ truth: 78, judged: 100, raw: 126, kept: 6, good: 3, junk: 2, regress: 1 })
  await start(page, 2)
  await hookClick(page, 'se-next')
  await hookClick(page, 'se-next')
  for (let step = 0; step < 6; step++) {
    await hookClick(page, 'se-keep')
    await hookClick(page, 'se-next')
  }
  const s = await state(page)
  expect(s.scene).toBe('c2-debrief')
  expect(s.c2).toMatchObject({ quality: 78, junk: 2, regress: 1, kept: 3 })
  await expect(page.locator('#scene')).toContainText('The gate leaked.')

  // Rejecting the refund rule means the regression that drops it never arrives.
  await start(page, 2)
  await hookClick(page, 'se-next')
  await hookClick(page, 'se-next')
  for (let step = 0; step < 6; step++) {
    if ((await state(page)).scene !== 'c2-version') break
    await hookClick(page, (await state(page)).c2.ix === 0 ? 'se-reject' : 'se-keep')
    await hookClick(page, 'se-next')
  }
  expect((await state(page)).c2).toMatchObject({ quality: 78, junk: 2, regress: 0, missed: 1 })
})

test('the game plays by keyboard alone, and focus follows each new step', async ({ page }) => {
  await page.goto(GAME)
  await page.locator('#se-next').focus()
  await page.keyboard.press('Enter')
  await expect(heading(page)).toHaveText('First, decide what good means')
  await expect(heading(page)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('#good-a')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#good-a')).toBeFocused() // a wrong answer keeps your place
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(heading(page)).toHaveText('Good is something you can compute')
  await expect(heading(page)).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(heading(page)).toHaveText('Five instruments, one claim')
  await page.keyboard.press('Tab')
  await expect(page.locator('#read-proof')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#read-proof')).toBeFocused()
  await expect(page.locator('#read-proof')).toHaveText('Read Proof again')
  await expect(page.locator('#status')).toContainText('Proof: LINE.count')
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab')
  await expect(page.locator('#se-reject')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(heading(page)).toHaveText('The count was 7')
  await expect(heading(page)).toBeFocused()

  // Chapter 3 by keyboard: pick the archive and step it to the end.
  await start(page, 3)
  await page.locator('#run-hill').focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.locator('#run-dgm')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(heading(page)).toBeFocused()
  for (let round = 1; round <= 8; round++) {
    await page.keyboard.press('Tab')
    await expect(page.locator('#se-step')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(heading(page)).toBeFocused()
  }
  await expect(heading(page)).toHaveText('Past the peak: 92')
  await expect(page.locator('#status')).toContainText('Run finished. Deployed score 92.')
})

test('at 320 px with reduced motion every scene fits, waits for nothing, and keeps 44 px targets', async ({ page }) => {
  test.slow()
  await page.setViewportSize({ width: 320, height: 740 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(GAME)
  const audit = async (label: string) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth), label).toBeLessThanOrEqual(320)
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), label).toBe(0)
    for (const box of await page.locator('#scene button, #scene a').evaluateAll(els => els.map(el => { const r = el.getBoundingClientRect(); return [el.id || el.textContent, r.width, r.height] as const }))) {
      expect(box[2], label + ' ' + box[0]).toBeGreaterThanOrEqual(44)
      expect(box[1], label + ' ' + box[0]).toBeGreaterThanOrEqual(44)
    }
  }
  // Walk the full game with the hook, preferring the next step, then keep, then a search.
  const seen = new Set<string>()
  for (let step = 0; step < 80; step++) {
    const s = await state(page)
    if (!seen.has(s.scene + s.c3.round)) { seen.add(s.scene + s.c3.round); await audit(s.scene + ' ' + s.c3.round) }
    if (s.scene === 'end') break
    const actions = await page.evaluate(() => (window as unknown as { __selection: Hook }).__selection.actions())
    const pick = s.scene === 'c1-good' ? 'good-b'
      : s.scene === 'c3-intro' ? 'run-hill'
        : s.scene === 'c3-run' && actions.includes('se-step') ? 'se-step'
          : s.scene === 'c3-run' && s.c3.method === 'hill' ? 'run-dgm'
            : ['se-next', 'se-keep'].find(id => actions.includes(id))
    expect(pick, s.scene).toBeTruthy()
    if (s.scene === 'c1-count' || s.scene === 'c2-version') for (const id of actions.filter(a => a.startsWith('read-'))) await hookClick(page, id)
    if (s.scene === 'c1-count' || s.scene === 'c2-version') await audit(s.scene + ' read')
    await hookClick(page, pick!)
  }
  expect((await state(page)).scene).toBe('end')
  await audit('end')
  const report = await new AxeBuilder({ page }).include('.se-wrap').withTags(WCAG).analyze()
  expect(report.violations).toEqual([])
})

test('embedded in the site player, the page hides its shell and signals ready to its own origin', async ({ page }) => {
  await page.goto('/404.html')
  const message = await page.evaluate(src => new Promise<{ data: unknown, origin: string }>(resolve => {
    window.addEventListener('message', event => resolve({ data: event.data, origin: event.origin }), { once: true })
    const frame = document.createElement('iframe')
    frame.src = src
    frame.title = 'The Selection Engine'
    document.body.appendChild(frame)
  }), GAME)
  expect(message.data).toEqual({ type: 'unity-ready' })
  expect(message.origin).toBe(new URL(page.url()).origin)
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('html')).toHaveClass(/embedded/)
  await expect(frame.locator('.ml-header')).toBeHidden()
  await expect(frame.locator('#scene h2')).toHaveText('Build a machine that improves itself')
})
