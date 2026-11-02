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
  })
})
