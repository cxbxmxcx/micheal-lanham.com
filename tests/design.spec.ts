import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const DEMO_PAGES = ['Proof_Gate', 'Helix_Garden', 'Perceptron_Game', 'MLP_Game', 'Autoencoder_Game']
const COMPANIONS = ['Proof_Gate', 'Helix_Garden']

test('the home page leads with the author, his books and his credentials', async ({ page }) => {
  await page.goto('/')
  const hero = page.locator('#top')
  await expect(hero.getByRole('heading', { level: 1 })).toHaveText(/Micheal Lanham,\s*author of AI Agents in Action\./)
  await expect(hero).toContainText('Self-Improving Agents')
  await expect(hero).toContainText('architecture reviews and hands-on training')
  await expect(hero.getByRole('img', { name: 'Micheal Lanham' })).toBeVisible()
  const covers = hero.getByRole('list', { name: 'Featured books' })
  for (const [name, slug] of [['Self-Improving Agents', 'self-improving-agents'], ['AI Agents in Action, Second Edition', 'ai-agents-in-action-second-edition']]) {
    await expect(covers.getByRole('link', { name, exact: true })).toHaveAttribute('href', `/books/${slug}/`)
  }
  await expect(hero.locator('.hero-lede').getByRole('link', { name: 'Self-Improving Agents' })).toHaveAttribute('href', '/books/self-improving-agents/')
  await expect(hero.getByText('Published with')).toBeVisible()

  // On a phone the covers sit in the first screen, and the credentials come before the agent loop.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const cover = await page.locator('.hero-covers img').first().boundingBox()
  expect(cover!.y + cover!.height).toBeLessThanOrEqual(844)
  const credentials = await page.locator('.hero-proof').boundingBox()
  const loop = await page.getByRole('group', { name: 'Explore the agent learning loop' }).boundingBox()
  expect(credentials!.y).toBeLessThan(loop!.y)
})

test('the home bookshelf shows every book newest first, and only the home page closes on a cobalt band', async ({ page }) => {
  await page.goto('/')
  const shelf = page.getByRole('list', { name: 'Books by Micheal Lanham, newest first' })
  const links = shelf.getByRole('link')
  expect(await links.count()).toBeGreaterThanOrEqual(13)
  await expect(links.first()).toHaveAttribute('href', '/books/self-improving-agents/')
  await expect(links.first()).toContainText('Early access')
  const years = (await shelf.locator('.shelf-year').allTextContents()).filter(text => /^\d{4}$/.test(text)).map(Number)
  expect(years).toEqual([...years].sort((a, b) => b - a))
  for (const href of await links.evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')))) expect(href).toMatch(/^\/books\/[a-z0-9-]+\/$/)
  expect(await page.locator('#contact').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('gradient')

  await page.goto('/work/')
  expect(await page.locator('#contact').evaluate(element => getComputedStyle(element).backgroundImage)).toBe('none')
})

test('book and demo pages end with somewhere to go next', async ({ page }) => {
  await page.goto('/books/evolutionary-deep-learning/')
  const related = page.getByRole('region', { name: 'More on machine learning' })
  expect(await related.getByRole('link').count()).toBeGreaterThanOrEqual(3)
  await expect(related.locator('a[href="/books/evolutionary-deep-learning/"]')).toHaveCount(0)

  await page.goto('/books/self-improving-agents/')
  const more = page.getByRole('region', { name: 'More books to explore' })
  await expect(more.getByRole('link').first()).toHaveAttribute('href', '/books/ai-agents-in-action-second-edition/')
  await expect(more.locator('a[href="/books/self-improving-agents/"]')).toHaveCount(0)

  await page.goto('/demos/proof-gate/')
  const demos = page.getByRole('region', { name: 'More demos' })
  await expect(demos.getByRole('link')).toHaveCount(4)
  await expect(demos.locator('a[href="/demos/proof-gate/"]')).toHaveCount(0)
})

test('the dark lab band leads into all five demos', async ({ page }) => {
  await page.goto('/')
  const lab = page.locator('#demos')
  expect(await lab.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(11, 10, 8)')
  await expect(lab.getByRole('link', { name: 'Play The Proof Gate (5 min)' })).toHaveAttribute('href', '/demos/Proof_Gate/index.html')
  await expect(lab.getByRole('link', { name: 'See all five demos' })).toHaveAttribute('href', '/demos/')
  for (const slug of ['helix-garden', 'perceptron', 'multilayer-perceptron', 'autoencoder']) await expect(lab.locator(`a[href="/demos/${slug}/"]`)).toBeVisible()

  await page.goto('/demos/')
  const featured = await page.locator('.demo-preview-featured').boundingBox()
  const second = await page.locator('.lab-library-grid .demo-preview').first().boundingBox()
  expect(featured!.width).toBeGreaterThan(second!.width * 1.8)
  await expect(page.locator('.lab-library-grid .demo-preview')).toHaveCount(4)
})

test('standalone demo pages share the site header, landmarks and footer', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    for (const demo of DEMO_PAGES) {
      await page.goto(`/demos/${demo}/index.html`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('link', { name: 'All demos' })).toHaveAttribute('href', '/demos/')
      if (COMPANIONS.includes(demo)) await expect(page.getByRole('link', { name: 'A companion to Self-Improving Agents (Manning)' })).toHaveAttribute('href', '/books/self-improving-agents/')
      const nav = page.getByRole('navigation', { name: 'Main navigation' })
      if (width === 390) await nav.locator('summary').click()
      for (const [name, href] of [['Books', '/books/'], ['Demos', '/demos/'], ['Work with me', '/work/']]) await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${demo} at ${width}`).toBeLessThanOrEqual(width)
    }
  }
})

test('the demo shell has no automated WCAG A/AA violations', async ({ page }) => {
  for (const demo of DEMO_PAGES) {
    await page.goto(`/demos/${demo}/index.html`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(report.violations, demo).toEqual([])
  }
})

test('embedded demos hide the site shell and keep the dark stage', async ({ page }) => {
  await page.goto('/demos/proof-gate/')
  await page.getByRole('button', { name: 'Play here', exact: true }).click()
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('#scene h2')).toBeVisible()
  for (const selector of ['header', 'footer', 'h1', '.ml-skip']) await expect(frame.locator(selector)).toBeHidden()
  expect(await frame.locator('body').evaluate(body => getComputedStyle(body).backgroundColor)).toBe('rgb(10, 9, 8)')
})

test('The Proof Gate ends with a route into the book', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/demos/Proof_Gate/index.html')
  const steps = await page.evaluate(() => {
    const gate = (window as unknown as { __gate: { click: (id: string) => boolean } }).__gate
    let count = 0
    while (!document.getElementById('replay') && count < 100) { if (!gate.click('n')) gate.click('k'); count++ }
    return count
  })
  expect(steps).toBeLessThan(100)
  const card = page.locator('.bookcard')
  await expect(card).toContainText('This is chapter 3 of Self-Improving Agents.')
  await expect(card.getByRole('link', { name: 'Read it in MEAP' })).toHaveAttribute('href', 'https://www.manning.com/books/self-improving-agents')
})

test('the library leads with published and early-access books, then what is coming next', async ({ page }) => {
  await page.goto('/books/')
  const grid = page.locator('.library-grid')
  await expect(grid.getByRole('heading').first()).toHaveText('Self-Improving Agents')
  await expect(grid.getByRole('heading', { name: 'Learn AI Filmmaking' })).toHaveCount(0)
  const coming = page.getByRole('region', { name: 'Coming next' })
  await expect(coming.getByRole('link', { name: /Learn AI Filmmaking/ })).toHaveAttribute('href', '/books/learn-ai-filmmaking/')

  // Phones show two covers to a row.
  await page.setViewportSize({ width: 390, height: 844 })
  const tops = await grid.locator('.book-preview').evaluateAll(cards => cards.slice(0, 2).map(card => card.getBoundingClientRect().top))
  expect(Math.abs(tops[0] - tops[1])).toBeLessThan(2)
})

test('the phone menu carries the brand, a Work with me button and the email address', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu', exact: true }).click()
  const menu = page.getByRole('dialog', { name: 'Site menu' })
  await expect(menu.getByText('Micheal Lanham', { exact: true })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Work with me', exact: true })).toHaveClass(/btn-primary/)
  await expect(menu.getByRole('link', { name: 'cxbxmxcx@micheal-lanham.com' })).toHaveAttribute('href', 'mailto:cxbxmxcx@micheal-lanham.com')
  await expect(menu.getByRole('button', { name: 'Copy email address' })).toBeVisible()
})
