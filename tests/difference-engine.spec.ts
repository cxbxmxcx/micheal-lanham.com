import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const URL = '/demos/Difference_Engine/index.html'
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

type Hook = {
  state: () => { scene: string, ledger: { recalled: number, reasoned: number, steps: number }, gears: string[], notebook: { verdict: string, valid: boolean, failedNew: boolean }[], failedNew: string[], last: { openRight: number, coverRight: number, steps: number, valid: boolean } | null, printed: { steps: number, copied: number, built: number, blank: number, wrong: number, holds: boolean } | null }
  click: (id: string) => boolean
  setGears: (ids: string[]) => string[]
  grade: (ids: string[]) => { openRight: number, coverRight: number, steps: number, valid: boolean }
  print: (ids: string[]) => { steps: number, blank: number, wrong: number, holds: boolean }
}
const state = (page: Page) => page.evaluate(() => (window as unknown as { __difference: Hook }).__difference.state())
const click = (page: Page, id: string) => page.evaluate(id => (window as unknown as { __difference: Hook }).__difference.click(id), id)
const setGears = (page: Page, ids: string[]) => page.evaluate(ids => (window as unknown as { __difference: Hook }).__difference.setGears(ids), ids)

async function axe (page: Page, label: string) {
  const report = await new AxeBuilder({ page }).withTags(WCAG).analyze()
  expect(report.violations, label).toEqual([])
  const extra = await new AxeBuilder({ page }).withRules(['heading-order', 'label-content-name-mismatch']).analyze()
  expect(extra.violations, label).toEqual([])
}

/* Play from the intro to the debrief through the test hook, with a method
   that generalises. Calls visit(scene) after each step. */
async function playThrough (page: Page, visit: (label: string) => Promise<void> = async () => {}) {
  await visit('intro'); await click(page, 'next')
  for (let i = 0; i < 4; i++) await click(page, 'count')
  await visit('s1add'); await click(page, 'next')
  for (let i = 0; i < 3; i++) await click(page, 'count')
  await visit('s1mul'); await click(page, 'next')
  await click(page, 'count'); await visit('s1again'); await click(page, 'next')
  await visit('s2table'); await click(page, 'next')
  for (let q = 0; q < 2; q++) { await click(page, 'lookup'); await visit('s2q' + q); await click(page, 'next') }
  await click(page, 'lookup'); await click(page, 'reason'); await visit('s2q-reason'); await click(page, 'next')
  await visit('s2sum'); await click(page, 'next')
  await visit('s3intro'); await click(page, 'next')
  await click(page, 'test'); await visit('s3copy'); await click(page, 'next')
  await visit('s3rack')
  await setGears(page, ['copy', 'count']); await click(page, 'test'); await visit('s3rack-slow')
  await setGears(page, ['turn', 'split', 'count']); await click(page, 'test'); await visit('s3rack-valid'); await click(page, 'next')
  await click(page, 'print'); await visit('s4print'); await click(page, 'check'); await visit('s4check'); await click(page, 'next')
  await click(page, 'ask'); await visit('s4tasks'); await click(page, 'next')
  await visit('debrief')
}

test('plays every scene by mouse, with consistent numbers and no other origin', async ({ page, baseURL }) => {
  const errors: string[] = []
  const external: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('request', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith(new globalThis.URL(baseURL!).origin)) external.push(r.url()) })
  await page.goto(URL)
  const scene = page.locator('#scene')
  const press = (name: string | RegExp) => scene.getByRole('button', { name }).click()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Difference Engine')
  await expect(page.getByRole('link', { name: 'All demos' })).toHaveAttribute('href', '/demos/')
  await press(/Stage 1: Fingers/)

  // Stage 1: counting is System 2, slow every time.
  for (let i = 0; i < 4; i++) await press('Count a finger')
  await expect(scene.getByRole('heading', { level: 3 })).toHaveText('3 + 4 = 7, in 4 steps')
  await press(/A times question/)
  for (let i = 0; i < 3; i++) await press('Count a group of four')
  await expect(scene.getByRole('heading', { level: 3 })).toHaveText('4 × 3 = 12, in 12 steps')
  await press(/Ask it again/)
  await press('Count all twelve again')
  await expect(scene).toContainText('Three questions, 28 steps')
  expect((await state(page)).ledger).toEqual({ recalled: 0, reasoned: 3, steps: 28 })

  // Stage 2: inside the table is recall; 13 × 7 falls back on reasoning.
  await press(/Stage 2: The table/)
  await expect(scene.getByRole('table')).toContainText('100')
  await press(/First question/)
  await press('Look it up in the table')
  await expect(scene.getByRole('heading', { level: 3 })).toHaveText('Recalled: 3 × 4 = 12, in 1 step')
  await press(/Next question/)
  await press('Look it up in the table')
  await expect(scene.getByRole('heading', { level: 3 })).toHaveText('Recalled: 7 × 8 = 56, in 1 step')
  await press(/Next question/)
  await press('Look it up in the table')
  await expect(scene.getByRole('heading', { level: 3 })).toHaveText('13 × 7 is not in the table')
  await press('Reason it out')
  await expect(scene.getByRole('heading', { level: 3 })).toHaveText('Reasoned: 13 × 7 = 91, in 5 steps')
  expect((await state(page)).ledger).toEqual({ recalled: 2, reasoned: 4, steps: 35 })
  await press(/What changed/)

  // Stage 3: the memoriser passes the visible cells and fails the held-back ones.
  await press(/Stage 3: The search/)
  await expect(scene.getByRole('table')).toContainText('held back')
  await press(/Try the obvious candidate/)
  await press('Test the mechanism')
  await expect(scene.locator('#gOpen')).toHaveText('91 / 91')
  await expect(scene.locator('#gHeld')).toHaveText('0 / 9')
  await expect(scene.locator('#gHeldMark')).toHaveText('✗ fail')
  await expect(scene.locator('td.is-held.is-blank')).toHaveCount(9)
  await expect(scene.getByRole('heading', { name: 'It memorised. It did not learn.' })).toBeVisible()
  await press(/Open the gear rack/)

  // The search: too slow, then a method that passes all three checks.
  await expect(scene.getByRole('button', { name: /^Copy what you saw/ })).toHaveAttribute('aria-pressed', 'true')
  await press(/^Count it out/)
  await press('Test the mechanism')
  await expect(scene.locator('#gSteps')).toHaveText('472 / 150')
  await expect(scene.locator('#gStepsMark')).toHaveText('✗ fail')
  await expect(scene.getByRole('button', { name: 'Print a 20 × 20 table' })).toBeDisabled()
  await press(/^Copy what you saw/)
  await press(/^Turn it around/)
  await press(/^Split it/)
  await expect(scene.locator('#mech')).toHaveText('In the mechanism: Turn it around + Split it + Count it out.')
  await press('Test the mechanism')
  await expect(scene.locator('#gHeld')).toHaveText('9 / 9')
  await expect(scene.locator('#gSteps')).toHaveText('100 / 150')
  await expect(scene.locator('td.is-ok')).toHaveCount(100)
  await expect(scene.locator('#notebook li')).toHaveCount(3)
  await press('Print a 20 × 20 table')

  // Stage 4: print, check on new ground, and the task family becomes recall.
  await press('Print the 20 × 20 table')
  await expect(scene.getByRole('heading', { level: 3 }).first()).toHaveText('Printed 400 of 400 cells in 400 steps')
  await press('Check three new cells by counting')
  await expect(scene.getByRole('heading', { name: 'Checked: 3 of 3 match' })).toBeVisible()
  await expect(scene).toContainText('Checking took 613 counting steps')
  await press(/Ask the questions again/)
  await press('Ask all eight')
  await expect(scene.getByRole('heading', { level: 3 })).toHaveText('Given table: 2 recalled, 6 reasoned. Printed table: all 8 recalled.')
  await expect(scene.getByRole('table')).toContainText('342')
  await press(/What just happened/)

  await expect(scene.getByRole('heading', { level: 2 })).toHaveText('What the engine learned')
  await expect(scene).toContainText('Your method: Turn it around + Split it + Count it out.')
  await expect(scene.getByRole('link', { name: 'About the book' })).toHaveAttribute('href', '/books/instinctual-learning-agent-harness/')
  expect((await state(page)).ledger).toEqual({ recalled: 10, reasoned: 4, steps: 43 })

  await press(/Play again/)
  expect((await state(page)).scene).toBe('intro')
  expect((await state(page)).ledger).toEqual({ recalled: 0, reasoned: 0, steps: 0 })
  expect(errors).toEqual([])
  expect(external).toEqual([])
})

test('key states meet WCAG 2.2 A/AA', async ({ page }) => {
  test.slow()
  await page.goto(URL)
  const audit = new Set(['intro', 's1add', 's2table', 's2q-reason', 's3intro', 's3copy', 's3rack-slow', 's3rack-valid', 's4check', 's4tasks', 'debrief'])
  await playThrough(page, async label => { if (audit.has(label)) await axe(page, label) })
})

test('a method that passes the table but fails new ground is caught and sent back', async ({ page }) => {
  await page.goto(URL)
  await playThrough(page, async label => {
    if (label !== 's3rack') return
    // Copy + Split + Just add passes all three checks: Just add never runs.
    await setGears(page, ['copy', 'split', 'add'])
    await click(page, 'test')
    await expect(page.locator('#hint')).toContainText('Never used on this table: Just add')
    await click(page, 'next')
    await click(page, 'print')
    await click(page, 'check')
    await expect(page.locator('#scene')).toContainText('Checked: 0 of 3 match. The new table fails.')
    await expect(page.locator('#scene')).toContainText('200 of the 300 new cells are wrong, starting with 11 × 1, which Just add made 12.')
    await click(page, 'back')
    expect((await state(page)).scene).toBe('s3rack')
    await expect(page.locator('#notebook')).toContainText('passed here, failed on the 20 × 20')
    // Testing the same method again does not offer the print.
    await click(page, 'test')
    await expect(page.locator('#hint')).toContainText('already passed here and failed on the 20 × 20')
    await expect(page.locator('#next')).toBeDisabled()
    // Copy + Split leaves the new rows blank: nothing can start a row without copying.
    await setGears(page, ['copy', 'split'])
    await click(page, 'test'); await click(page, 'next'); await click(page, 'print'); await click(page, 'check')
    await expect(page.locator('#scene')).toContainText('200 of the 300 new cells are blank, starting with 11 × 1.')
    await click(page, 'back')
  })
  expect((await state(page)).scene).toBe('debrief')
})

test('every method that passes the 10 × 10 but fails the 20 × 20 fails the three-cell check', async ({ page }) => {
  await page.goto(URL)
  const gears = ['copy', 'turn', 'zero', 'double', 'split', 'add', 'count']
  const summary = await page.evaluate(gears => {
    const hook = (window as unknown as { __difference: Hook }).__difference
    let valid = 0, latent = 0, missed = 0
    for (let m = 1; m < 1 << gears.length; m++) {
      const ids = gears.filter((_, i) => m >> i & 1)
      if (!hook.grade(ids).valid) continue
      valid++
      const p = hook.print(ids)
      if (p.blank + p.wrong > 0) { latent++; if (p.holds) missed++ }
    }
    return { valid, latent, missed, copy: hook.grade(['copy']), count: hook.grade(['count']) }
  }, gears)
  expect(summary.copy).toEqual({ openRight: 91, coverRight: 0, steps: 91, valid: false, blank: 9, wrong: 0 })
  expect(summary.count.steps).toBe(3025)
  expect(summary.valid).toBeGreaterThan(20)
  expect(summary.latent).toBeGreaterThan(0)
  expect(summary.missed).toBe(0)
})

test('plays by keyboard alone, and focus follows each new step', async ({ page }) => {
  test.slow()
  await page.goto(URL)
  const focusedButton = () => page.evaluate(() => {
    const el = document.activeElement
    return el && (el.tagName === 'BUTTON' || el.tagName === 'A') && el.closest('#scene') ? (el.textContent || '').replace(/\s+/g, ' ').trim().replace(/^\W+/, '') : ''
  })
  const focusedTag = () => page.evaluate(() => document.activeElement?.tagName)
  async function press (name: string, key = 'Enter') {
    for (let i = 0; i < 60; i++) {
      if ((await focusedButton()).startsWith(name)) { await page.keyboard.press(key); return }
      await page.keyboard.press('Tab')
    }
    throw new Error('Could not reach ' + name + ' by Tab')
  }
  await press('Stage 1: Fingers')
  expect(await focusedTag()).toBe('H2')
  for (let i = 0; i < 4; i++) await press('Count a finger')
  expect(await focusedTag()).toBe('H3')
  await press('A times question')
  for (let i = 0; i < 3; i++) await press('Count a group of four', 'Space')
  await press('Ask it again')
  await press('Count all twelve again')
  await press('Stage 2: The table')
  await press('First question')
  for (let q = 0; q < 2; q++) { await press('Look it up in the table'); expect(await focusedTag()).toBe('H3'); await press('Next question') }
  await press('Look it up in the table')
  await press('Reason it out')
  await press('What changed?')
  await press('Stage 3: The search')
  await press('Try the obvious candidate')
  await press('Test the mechanism')
  await press('Open the gear rack')
  expect(await focusedTag()).toBe('H2')
  for (const gear of ['Copy what you saw', 'Turn it around', 'Split it', 'Count it out']) await press(gear, 'Space')
  expect((await state(page)).gears).toEqual(['turn', 'split', 'count'])
  await press('Test the mechanism')
  expect(await focusedButton()).toBe('Test the mechanism')
  await expect(page.locator('#status')).toContainText('All three checks pass')
  await press('Print a 20 × 20 table')
  await press('Print the 20 × 20 table')
  await press('Check three new cells by counting')
  await press('Ask the questions again')
  await press('Ask all eight')
  await press('What just happened')
  expect(await focusedTag()).toBe('H2')
  await expect(page.locator('#scene h2')).toHaveText('What the engine learned')
  await press('Play again')
  expect((await state(page)).scene).toBe('intro')
})

test('fits a 320 px screen with 44 px targets at every step', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto(URL)
  await playThrough(page, async label => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth), label).toBeLessThanOrEqual(320)
    // Players read "held back", as in the mockup, never "covered".
    expect(await page.locator('#scene').innerText(), label).not.toMatch(/covered/i)
    const small = await page.locator('#scene button:visible, #scene a:visible').evaluateAll(els => els
      .map(el => ({ name: (el.textContent || '').trim().slice(0, 30), box: el.getBoundingClientRect() }))
      .filter(({ box }) => box.width < 44 || box.height < 44).map(({ name }) => name))
    expect(small, label).toEqual([])
  })
})

test('stage 3 uses the mockup board: table left, gearbox right, one column below 860 px', async ({ page }) => {
  await page.goto(URL)
  await playThrough(page, async label => {
    if (label !== 's3rack-valid') return
    const box = async (sel: string) => (await page.locator(sel).boundingBox())!
    let table = await box('.dx-plate'), gears = await box('.dx-gearbox')
    expect(gears.x).toBeGreaterThan(table.x + table.width - 1)
    await expect(page.locator('.dx-gearbox .de-chip')).toHaveCount(7)
    await expect(page.locator('.dx-gearbox .de-gauge')).toHaveCount(3)
    await expect(page.locator('#scene h2')).toHaveCSS('font-family', /Fraunces/)
    await expect(page.locator('#scene')).not.toHaveClass(/de-panel/)
    await page.setViewportSize({ width: 820, height: 900 })
    table = await box('.dx-plate'); gears = await box('.dx-gearbox')
    expect(gears.y).toBeGreaterThan(table.y + table.height - 1)
    await page.setViewportSize({ width: 1440, height: 900 })
  })
})

test('with reduced motion nothing animates', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(URL)
  await playThrough(page, async label => {
    expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), label).toBe(0)
  })
})

test('embedded in the site, it hides the shell and says it is ready to this origin only', async ({ page }) => {
  await page.goto('/demos/')
  const message = await page.evaluate(src => new Promise<{ data: unknown, sameOrigin: boolean }>(resolve => {
    window.addEventListener('message', event => resolve({ data: event.data, sameOrigin: event.origin === window.location.origin }))
    const frame = document.createElement('iframe')
    frame.title = 'The Difference Engine'
    frame.src = src
    document.body.append(frame)
  }), URL)
  expect(message).toEqual({ data: { type: 'unity-ready' }, sameOrigin: true })
  const frame = page.frameLocator('iframe[title="The Difference Engine"]')
  await expect(frame.locator('#scene h2')).toBeVisible()
  for (const selector of ['header', 'footer', 'h1', '.ml-skip']) await expect(frame.locator(selector)).toBeHidden()
})
