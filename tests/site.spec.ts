import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('agent learning loop responds to keyboard selection with reduced motion', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const loop = page.getByRole('group', { name: 'Explore the agent learning loop' })
  await expect(loop).toBeVisible()
  const evaluate = loop.getByRole('button', { name: 'Evaluate', exact: true })
  await evaluate.focus()
  await page.keyboard.press('Enter')
  await expect(evaluate).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('#agent-step')).toContainText('evidence')
  await expect(evaluate).toBeFocused()
  await page.keyboard.press('Tab')
  const improve = loop.getByRole('button', { name: 'Improve', exact: true })
  await expect(improve).toBeFocused()
  await page.keyboard.press('Space')
  await expect(improve).toHaveAttribute('aria-pressed', 'true')
  await expect(evaluate).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('#agent-step')).toContainText('change')
  expect(errors).toEqual([])
})

test('each agent step can be selected directly without overlapping controls', async ({ page }) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const loop = page.getByRole('group', { name: 'Explore the agent learning loop' })
    for (const name of ['Observe', 'Act', 'Evaluate', 'Improve']) {
      const button = loop.getByRole('button', { name, exact: true })
      await button.click({ timeout: 2000 })
      await expect(button).toHaveAttribute('aria-pressed', 'true')
    }
  }
})

test('phone layout stays inside the viewport before scroll reveals', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('mobile menu navigation focuses its destination; dismissal restores the toggle', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Open menu', exact: true })
  await toggle.click()
  await page.keyboard.press('Escape')
  await expect(toggle).toBeFocused()
  await toggle.click()
  await page.getByRole('dialog', { name: 'Site menu' }).getByRole('link', { name: 'Work with me', exact: true }).click()
  await expect(page.locator('main')).toBeFocused()
  await expect(page).toHaveURL(/\/work\/$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('service scope is visible immediately without typing delays', async ({ page }) => {
  await page.goto('/work/architecture-reviews/')
  await expect(page.getByRole('heading', { level: 1, name: 'Agent architecture reviews' })).toBeVisible()
  await expect(page.getByText('Memory, state, and context strategy', { exact: true })).toBeVisible({ timeout: 1000 })
  const mail = page.getByRole('link', { name: 'Request an architecture review', exact: true }).first()
  await expect(mail).toHaveAttribute('href', /mailto:.*subject=.*body=/)
})

test('book topic filters keep matching books and open a detail page', async ({ page }) => {
  await page.goto('/books/')
  await page.getByRole('button', { name: 'AI agents', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'AI Agents in Action, Second Edition', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Game Audio Development with Unity 5.X', exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: 'About AI Agents in Action, Second Edition', exact: true }).click()
  await expect(page).toHaveURL(/\/books\/ai-agents-in-action-second-edition\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AI Agents in Action, Second Edition')
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your next book.')
})

test('Back restores the reading position after opening a book near the library bottom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/books/')
  const book = page.getByRole('link', { name: 'About Game Audio Development with Unity 5.X', exact: true })
  await book.scrollIntoViewIfNeeded()
  const position = await page.evaluate(() => window.scrollY)
  expect(position).toBeGreaterThan(1000)
  await book.click()
  await expect(page).toHaveURL(/\/books\/game-audio-development\/$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/books\/$/)
  await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - position)).toBeLessThan(10)
  await expect(page.locator('main')).toBeFocused()
})

test('Back and Forward close the mobile menu and focus the destination', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Open menu', exact: true })
  await toggle.click()
  await page.getByRole('dialog').getByRole('link', { name: 'Contact', exact: true }).click()
  await expect(page.locator('#contact')).toBeFocused()
  await toggle.click()
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('main')).toBeFocused()
  await toggle.click()
  await page.goForward()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('#contact')).toBeFocused()
  expect(await page.locator('main').evaluate(element => element.inert)).toBe(false)
})

test('structured data follows client navigation between books', async ({ page }) => {
  await page.goto('/books/ai-agents-in-action/')
  await page.getByRole('link', { name: 'Looking for the latest material? Explore the second edition' }).click()
  await expect(page).toHaveURL(/\/books\/ai-agents-in-action-second-edition\/$/)
  const schema = page.locator('script[type="application/ld+json"]')
  await expect.poll(async () => JSON.parse(await schema.textContent() || '{}').isbn).toBe('9781633434530')
  await expect.poll(async () => JSON.parse(await schema.textContent() || '{}').url).toBe('https://micheal-lanham.com/books/ai-agents-in-action-second-edition/')
})

test('early access has a real publisher destination', async ({ page }) => {
  await page.goto('/books/self-improving-agents/')
  await expect(page.getByRole('link', { name: 'Read early chapters at Manning' })).toHaveAttribute('href', 'https://www.manning.com/books/self-improving-agents')
})

test('book covers stay inside the artwork area and clear the text', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/books/', '/books/self-improving-agents/', '/books/practical-ai-google-cloud/']) {
    await page.goto(path)
    const cover = page.locator('.book-art img').first()
    await cover.scrollIntoViewIfNeeded()
    await cover.evaluate(image => (image as HTMLImageElement).decode())
    await expect(cover).toBeVisible()
    const bounds = await cover.evaluate(image => ({ image: image.getBoundingClientRect().bottom, frame: image.parentElement!.getBoundingClientRect().bottom }))
    expect(bounds.image, path).toBeLessThanOrEqual(bounds.frame)
  }
})

test('a shared topic link hydrates without errors and preserves keyboard focus when filtering', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/books/?topic=AI+agents')
  await expect(page.getByRole('button', { name: 'AI agents', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Game Audio Development with Unity 5.X', exact: true })).toHaveCount(0)
  const filter = page.getByRole('button', { name: 'Games & AR', exact: true })
  await filter.click()
  await expect(filter).toBeFocused()
  expect(errors).toEqual([])
})

test('a failed embedded demo offers recovery without claiming it is running', async ({ page }) => {
  await page.clock.install()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/demos/Proof_Gate/index.html', route => route.fulfill({ status: 503, body: 'Temporarily unavailable' }))
  await page.goto('/demos/proof-gate/')
  await page.getByRole('button', { name: 'Play here', exact: true }).click()
  await expect(page.locator('iframe')).toBeAttached()
  await page.clock.fastForward(45_001)
  await expect(page.getByRole('status')).toHaveText('The demo has not reported ready.')
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open demo page' })).toHaveAttribute('href', '/demos/Proof_Gate/index.html')
  await page.getByRole('button', { name: 'Close demo' }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
})

test('mobile demos use the full page instead of a tiny iframe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/demos/proof-gate/')
  const play = page.getByRole('link', { name: 'Play The Proof Gate', exact: true })
  await expect(play).toHaveAttribute('href', '/demos/Proof_Gate/index.html')
  await play.click()
  await expect(page).toHaveURL(/\/demos\/Proof_Gate\/index.html$/)
  await expect(page.locator('iframe')).toHaveCount(0)
})

test('desktop demo can start and close, with honest failure recovery', async ({ page }) => {
  await page.goto('/demos/proof-gate/')
  await page.getByRole('button', { name: 'Play here', exact: true }).click()
  await expect(page.getByTitle('The Proof Gate', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close demo', exact: true }).click()
  await expect(page.locator('iframe')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Play here', exact: true })).toBeFocused()
})

test('narrow and reduced-motion pages keep content readable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const url of ['/', '/books/', '/work/', '/demos/', '/books/self-improving-agents/']) {
    await page.goto(url)
    await expect(page.locator('h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(320)
  }
})

test('key pages have no automated WCAG A/AA violations', async ({ page }) => {
  for (const url of ['/', '/books/', '/work/architecture-reviews/', '/demos/proof-gate/']) {
    await page.goto(url)
    await expect(page.locator('h1')).toBeVisible()
    const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(report.violations, url).toEqual([])
  }
})

test('prerendered detail content and metadata work without JavaScript', async ({ browser }) => {
  test.skip(!process.env.STATIC_CHECK, 'Runs against the production build')
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(`${process.env.SITE_URL}/books/self-improving-agents/`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Self-Improving Agents')
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', 'https://micheal-lanham.com/books/self-improving-agents/')
  await expect(page).toHaveTitle(/Self-Improving Agents/)
  await context.close()
})
