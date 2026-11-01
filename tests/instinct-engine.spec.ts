import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PAGE = '/demos/Instinct_Engine/index.html'
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

type Entry = { id: string, route: string, right: boolean, stale?: boolean, escalated?: boolean, checked?: boolean, events: string[], checkEvents?: string[] }
type State = {
  phase: string, day: number, ix: number, policy: number, quarantine: boolean, staleWrong: number, complained: boolean,
  cards: { W?: { limit: number, gift: boolean }, Q?: object }, jev: { limit: number } | null,
  days: { t: number, c: number, wrong: number, routes: string[] }[], task: { id: string, fam: string } | null, last: Entry | null,
}
type Hook = { state(): State, reference(): { t: number, c: number, wrong: number }[], ideal(): string | null, click(id: string): boolean }
const hook = (page: Page) => ({
  state: () => page.evaluate(() => (window as unknown as { __instinct: Hook }).__instinct.state()),
  reference: () => page.evaluate(() => (window as unknown as { __instinct: Hook }).__instinct.reference()),
  ideal: () => page.evaluate(() => (window as unknown as { __instinct: Hook }).__instinct.ideal()),
  click: (id: string) => page.evaluate(id => (window as unknown as { __instinct: Hook }).__instinct.click(id), id),
})

/* Route the current task with `choose`, or press the scene's main button. */
async function step(page: Page, choose: (s: State) => string) {
  const h = hook(page), s = await h.state()
  if (s.phase === 'task') expect(await h.click('r-' + choose(s)), `${s.task?.id} → ${choose(s)}`).toBe(true)
  else expect(await h.click('n'), s.phase).toBe(true)
  return h.state()
}
async function playTo(page: Page, until: (s: State) => boolean, choose: (s: State) => string) {
  for (let i = 0; i < 80; i++) {
    const s = await hook(page).state()
    if (until(s)) return s
    await step(page, choose)
  }
  throw new Error('never reached the target state')
}
/* A trusting harness: recall whenever it can, and never check. */
const trusting = (s: State) => {
  const fam = s.task!.fam
  if (fam === 'E') return 's1'
  if (fam === 'N') return 's2'
  if (fam === 'W' && s.jev && !s.quarantine) return 'jev'
  if (s.cards[fam as 'W' | 'Q'] && !(fam === 'W' && s.quarantine)) return 'mem'
  return 's2'
}
const axe = async (page: Page, label: string) =>
  expect((await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations, label).toEqual([])

test('the story numbers hold: a well-tuned harness spends 94, 38, 32.4 and 32.3 seconds', async ({ page }) => {
  await page.goto(PAGE)
  expect(await hook(page).reference()).toEqual([
    { t: 940, c: 630, wrong: 0 }, { t: 380, c: 270, wrong: 0 }, { t: 324, c: 224, wrong: 0 }, { t: 323, c: 223, wrong: 0 },
  ])
})

test('plays end to end by keyboard: focus lands on each new heading, and key states pass axe', async ({ page }) => {
  test.slow()
  const foreign: string[] = []
  const origin = new URL(process.env.SITE_URL || 'http://127.0.0.1:3000').origin
  page.on('request', request => { if (new URL(request.url()).origin !== origin) foreign.push(request.url()) })
  await page.goto(PAGE)
  await expect(page.locator('h1')).toHaveText('The Instinct Engine')
  await expect(page.locator('#sceneTitle')).toHaveText('A brass oracle that cannot learn')
  await axe(page, 'intro')

  const audited = new Set<string>()
  for (let i = 0; i < 80; i++) {
    const s = await hook(page).state()
    if (s.phase === 'debrief') break
    const key = s.phase === 'result' ? `result:${s.last!.route}:${s.day}` : `${s.phase}:${s.day}`
    if (!audited.has(key)) { audited.add(key); await axe(page, key) }
    const target = s.phase === 'task' ? '#r-' + await hook(page).ideal() : '#n'
    await page.locator(target).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#sceneTitle')).toBeFocused()
  }
  await expect(page.locator('#sceneTitle')).toHaveText('The oracle never changed')
  await axe(page, 'debrief')
  const s = await hook(page).state()
  expect(s.days.map(d => ({ t: d.t, c: d.c, wrong: d.wrong }))).toEqual(await hook(page).reference())
  await expect(page.locator('#scene')).toContainText('You answered 20 of 20 correctly')
  await expect(page.getByRole('link', { name: 'About the book' })).toHaveAttribute('href', '/books/instinctual-learning-agent-harness/')

  // Play again returns to the start, with focus on its heading.
  await page.locator('#replay').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#sceneTitle')).toHaveText('A brass oracle that cannot learn')
  await expect(page.locator('#sceneTitle')).toBeFocused()
  expect((await hook(page).state()).days[0].t).toBe(0)
  expect(foreign).toEqual([])
})

test('day 1: System 1 is fast and wrong on shop facts, System 2 is slow and writes a memory card', async ({ page }) => {
  await page.goto(PAGE)
  await playTo(page, s => s.phase === 'task' && s.task!.id === 'W1', () => 's1')
  await expect(page.locator('#r-mem')).toBeDisabled()
  await expect(page.locator('#r-mem')).toContainText('No card yet')
  await expect(page.locator('#r-jev')).toContainText('Not compiled yet')
  let s = await step(page, () => 's1')
  expect(s.last).toMatchObject({ id: 'W1', route: 's1', right: false })
  await expect(page.locator('#scene')).toContainText('Wrong')
  await hook(page).click('n')
  s = await step(page, () => 's2')    // Q1 by System 2: writes the quote card
  expect(s.last).toMatchObject({ id: 'Q1', right: true, events: ['card-q'] })
  await expect(page.locator('#scene')).toContainText('Quote: $65')
  await expect(page.locator('#scene .ie-card')).toContainText('$40 service on every job')
  expect(s.days[0]).toMatchObject({ t: 340, c: 220, wrong: 1 })
  await expect(page.locator('#gTime')).toHaveText('34 s')
  await expect(page.locator('#gWrong')).toHaveText('1')
})

test('day 3: the card answers the gift case wrongly, while Jev escalates it to System 2', async ({ page }) => {
  await page.goto(PAGE)
  await playTo(page, s => s.phase === 'task' && s.task!.id === 'W7', trusting)
  await expect(page.locator('#r-jev')).toBeEnabled()
  let s = await step(page, () => 'mem')
  expect(s.last).toMatchObject({ id: 'W7', route: 'mem', right: false })
  await expect(page.locator('#scene')).toContainText('says nothing about gifts')
  // A spot check teaches the card the missing rule.
  expect(await hook(page).click('check')).toBe(true)
  s = await hook(page).state()
  expect(s.last!.checkEvents).toEqual(['card-gift'])
  expect(s.cards.W).toEqual({ limit: 12, gift: true })

  await page.reload()
  await playTo(page, s => s.phase === 'task' && s.task!.id === 'W7', trusting)
  s = await step(page, () => 'jev')
  expect(s.last).toMatchObject({ id: 'W7', route: 'jev', escalated: true, right: true })
  expect(s.days[2].routes).toContain('jev+s2')
  await expect(page.locator('#scene .ie-box')).toContainText('probability 0.61 < 0.80')
})

test('day 4 trap: trusted memories give fast wrong answers until a complaint benches them', async ({ page }) => {
  await page.goto(PAGE)
  let s = await playTo(page, s => s.phase === 'result' && s.last!.id === 'W9', trusting)
  expect(s.policy).toBe(6)
  expect(s.last).toMatchObject({ route: 'jev', right: false, stale: true })
  // The harness can't see it: no verdict, and the wrong gauge is hidden.
  await expect(page.locator('#scene')).toContainText('Unknown to the harness')
  await expect(page.locator('#gWrong')).toHaveText('? hidden')
  await axe(page, 'day 4 hidden result')

  s = await playTo(page, s => s.phase === 'complaint', trusting)
  expect(s).toMatchObject({ complained: true, quarantine: true, staleWrong: 2 })
  await expect(page.locator('#sceneTitle')).toHaveText('A complaint arrives')
  await axe(page, 'complaint')

  s = await playTo(page, s => s.phase === 'task' && s.task!.id === 'W11', trusting)
  await expect(page.locator('#r-jev')).toContainText('Benched after a complaint')
  await expect(page.locator('#r-mem')).toBeDisabled()
  s = await step(page, () => 's2')
  expect(s.last!.events).toEqual(['card-rewritten', 'jev-recompiled', 'unbenched'])
  expect(s.cards.W!.limit).toBe(6)
  s = await playTo(page, s => s.phase === 'summary', trusting)
  expect(s.days[3].wrong).toBe(2)
  await expect(page.locator('#scene .ie-ledger')).toContainText('Wrong')
  await expect(page.locator('#scene')).toContainText('2 answers were fast, confident and wrong')
  await expect(page.locator('#scene')).toContainText('A complaint caught it')
})

test('day 4: a spot check catches the stale card before any complaint', async ({ page }) => {
  await page.goto(PAGE)
  await playTo(page, s => s.phase === 'result' && s.last!.id === 'W9', trusting)
  expect(await hook(page).click('check')).toBe(true)
  let s = await hook(page).state()
  expect(s.last!.checkEvents).toEqual(['card-rewritten', 'jev-recompiled'])
  await expect(page.locator('#scene')).toContainText('the warranty is now 6 months, not 12')
  s = await playTo(page, s => s.phase === 'summary', trusting)
  expect(s).toMatchObject({ complained: false, staleWrong: 1 })
  expect(s.days[3].wrong).toBe(1)
  await expect(page.locator('#scene')).toContainText('Your spot check on message 1 caught the change')
})

test('plays by mouse at 320 px with reduced motion: no sideways scroll, 44 px targets, nothing to wait for', async ({ page }) => {
  test.slow()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto(PAGE)
  for (let i = 0; i < 80; i++) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth), 'scroll width').toBeLessThanOrEqual(320)
    for (const box of await page.locator('#scene button:visible, #scene a.de-btn:visible, #scene summary').evaluateAll(els => els.map(el => el.getBoundingClientRect().height)))
      expect(box).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
    const s = await hook(page).state()
    if (s.phase === 'debrief') break
    const target = s.phase === 'task' ? '#r-' + trusting(s) : '#n'
    await page.locator(target).click()
  }
  await expect(page.locator('#sceneTitle')).toHaveText('The oracle never changed')
  await axe(page, 'debrief at 320 px')
})

test('inside the demo player it hides the site shell and reports ready to its own origin', async ({ page }) => {
  await page.goto('/404.html')
  const ready = await page.evaluate(src => new Promise<{ type: string, origin: boolean }>(resolve => {
    window.addEventListener('message', event => resolve({ type: event.data?.type, origin: event.origin === window.location.origin }))
    const frame = document.createElement('iframe')
    frame.src = src
    frame.style.width = '800px'; frame.style.height = '600px'
    document.body.append(frame)
  }), PAGE)
  expect(ready).toEqual({ type: 'unity-ready', origin: true })
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('.ml-header')).toBeHidden()
  await expect(frame.locator('#sceneTitle')).toBeVisible()
})

test('the page description fits in 160 characters', async ({ page }) => {
  const html = await (await page.request.get(PAGE)).text()
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''
  expect(description.length).toBeGreaterThan(50)
  expect(description.length).toBeLessThanOrEqual(160)
})
