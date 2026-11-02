import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Motion is an enhancement (src/lib/motion.ts and the script in index.html).
// These tests opt back into motion; every other spec checks the finished page.
test.use({ reducedMotion: 'no-preference' })
// The exact class token: a word-boundary pattern would also match "motion-ready".
const MOTION = /(^|\s)motion(\s|$)/

const scrollIntoView = (page: Page, selector: string) => page.locator(selector).first().evaluate(element => element.scrollIntoView({ block: 'center' }))

test('with motion, the heading and portrait paint at once while the sketch draws itself', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveClass(MOTION)
  expect(await page.locator('h1').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
  expect(await page.locator('.hero-portrait').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
  expect(await page.locator('.hero-tree path').first().evaluate(element => getComputedStyle(element).animationName)).toBe('ink-draw')
  await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/)
})

test('sections reveal as they scroll in, and the revealed laboratory passes axe', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/)
  const engines = page.locator('[data-reveal="engines"]')
  await expect(engines).not.toHaveClass(/\bis-in\b/)
  expect(await page.locator('.engine').first().evaluate(element => getComputedStyle(element).opacity)).toBe('0')
  await scrollIntoView(page, '#demos .engines')
  await expect(engines).toHaveClass(/\bis-in\b/)
  // Every engine finishes powering up within a couple of seconds.
  await expect.poll(() => page.locator('.engine').evaluateAll(cards => cards.map(card => getComputedStyle(card).opacity)), { timeout: 4000 }).toEqual(['1', '1', '1'])
  await page.waitForTimeout(1200)
  expect((await new AxeBuilder({ page }).include('#demos').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
})

test('the hero plate follows a mouse by depth, and scrolling turns the lab gears', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/motion-ready/)
  const depth = () => page.locator('.hero-art').evaluate(element => element.style.getPropertyValue('--px'))
  await page.mouse.move(200, 200)
  await page.mouse.move(1400, 820, { steps: 6 })
  // Mouse and pen only: a browser that reports no fine pointer (a phone, or CI's
  // headless shell) keeps the plate still.
  if (await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)) {
    await expect.poll(depth).not.toBe('')
    // Nearer layers move further: the covers shift more than the portrait, and the far sketch moves the other way.
    const shift = (selector: string) => page.locator(selector).first().evaluate(element => parseFloat(getComputedStyle(element).translate) || 0)
    await expect.poll(() => shift('.hero-covers a'), { timeout: 3000 }).toBeGreaterThan(10)
    expect(await shift('.hero-oval')).toBeGreaterThan(0)
    expect(await shift('.hero-oval')).toBeLessThan(await shift('.hero-covers a'))
    expect(await shift('.hero-tree .ink-sketch')).toBeLessThan(0)
    // Leaving the hero lets every layer settle back.
    await page.mouse.move(700, 895)
    await page.evaluate(() => window.scrollTo(0, document.querySelector<HTMLElement>('#work')!.offsetTop))
    await expect.poll(depth).toBe('')
  } else {
    expect(await depth()).toBe('')
  }
  // Scroll-driven gears (Chromium and Safari): two scroll positions, two angles.
  if (await page.evaluate(() => CSS.supports('animation-timeline: view()'))) {
    const angle = () => page.locator('#demos').evaluate(element => getComputedStyle(element, '::before').rotate)
    await page.locator('#demos').evaluate(element => element.scrollIntoView({ block: 'end' }))
    const first = await angle()
    await page.locator('#demos').evaluate(element => element.scrollIntoView({ block: 'start' }))
    await expect.poll(angle).not.toBe(first)
  }
})

test('a chosen loop step sends a brass token along its arrow', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/motion-ready/)
  await scrollIntoView(page, '.agent-loop')
  await expect(page.locator('.loop-token')).toHaveCount(0)
  await page.getByRole('button', { name: 'Act', exact: true }).click()
  await expect(page.locator('.loop-token')).toHaveCount(1)
  await page.getByRole('button', { name: 'Evaluate', exact: true }).click()
  await expect(page.locator('.loop-token')).toHaveCount(1)
})

test('the facts count up to their real values, and screen readers only hear the final value', async ({ page }) => {
  await page.goto('/')
  const facts = page.locator('.hero-facts dd')
  await expect(facts.locator('.sr-only')).toHaveText(['12', '20+', '3'])
  await expect(facts.locator('[aria-hidden="true"]')).toHaveText(['12', '20+', '3'], { timeout: 5000 })
})

test('blocks the visitor jumps past are revealed, not left hidden', async ({ page }) => {
  await page.goto('/#contact')
  await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/)
  // The laboratory sits above the contact band: jumped past, never scrolled into view.
  await expect(page.locator('[data-reveal="engines"]')).toHaveClass(/\bis-in\b/)
  await expect(page.locator('#books [data-reveal="shelf"]')).toHaveClass(/\bis-in\b/)
})

test('keyboard focus reveals a block before it scrolls into view', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/)
  const block = page.locator('#demos .lab-more')
  await expect(block).not.toHaveClass(/\bis-in\b/)
  await block.getByRole('link').first().focus()
  await expect(block).toHaveClass(/\bis-in\b/)
})

test('a link into a book plays the page transition and lands on the book, at the top, with focus on the page', async ({ page }) => {
  await page.addInitScript(() => {
    const doc = document as Document & { startViewTransition?: (update: () => Promise<void>) => unknown }
    const original = doc.startViewTransition?.bind(document)
    if (original) doc.startViewTransition = update => { (window as unknown as { transitions: number }).transitions = ((window as unknown as { transitions?: number }).transitions ?? 0) + 1; return original(update) }
  })
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/)
  await scrollIntoView(page, '.shelf')
  await page.locator('.shelf a[href="/books/evolutionary-deep-learning/"]').click()
  await expect(page).toHaveURL(/\/books\/evolutionary-deep-learning\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Evolutionary Deep Learning')
  await expect(page.locator('main')).toBeFocused()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  expect(await page.evaluate(() => (window as unknown as { transitions?: number }).transitions)).toBe(1)
})

test('if the app never starts, motion switches off within seconds and nothing stays hidden', async ({ page }) => {
  await page.route('**/assets/*.js', route => route.abort())
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(MOTION)
  await expect(page.locator('html')).not.toHaveClass(MOTION, { timeout: 5000 })
  expect(await page.locator('.engine').first().evaluate(element => getComputedStyle(element).opacity)).toBe('1')
})

test('without JavaScript nothing is hidden', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'no-preference' })
  const page = await context.newPage()
  await page.goto(`${process.env.SITE_URL || 'http://127.0.0.1:3000'}/`)
  await expect(page.locator('html')).not.toHaveClass(MOTION)
  expect(await page.locator('.engine').first().evaluate(element => getComputedStyle(element).opacity)).toBe('1')
  await context.close()
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('nothing moves and nothing waits hidden', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveClass(MOTION)
    expect(await page.locator('.hero-tree path').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none')
    expect(await page.locator('.engine').first().evaluate(element => getComputedStyle(element).opacity)).toBe('1')
    await expect(page.locator('.hero-facts dd [aria-hidden="true"]')).toHaveText(['12', '20+', '3'])
    // The hero holds still under the pointer, and the loop sends no token.
    await page.mouse.move(200, 200)
    await page.mouse.move(1400, 820, { steps: 4 })
    expect(await page.locator('.hero-art').evaluate(element => element.style.getPropertyValue('--px'))).toBe('')
    await page.getByRole('button', { name: 'Act', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Act', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.loop-token')).toHaveCount(0)
  })
})
