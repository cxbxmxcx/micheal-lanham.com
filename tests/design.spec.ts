import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const DEMO_PAGES = ['Selection_Engine', 'Instinct_Engine', 'Difference_Engine', 'Perceptron_Game', 'MLP_Game', 'Autoencoder_Game']
// Each concept game credits the book it plays: [link name, book page].
const COMPANIONS: Record<string, [string, string]> = {
  Selection_Engine: ['A companion to Self-Improving Agents (Manning)', '/books/self-improving-agents/'],
  Instinct_Engine: ['A companion to The Instinctual Learning Agent Harness (Packt)', '/books/instinctual-learning-agent-harness/'],
  Difference_Engine: ['A companion to The Instinctual Learning Agent Harness (Packt)', '/books/instinctual-learning-agent-harness/'],
}

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

test('the home bookshelf shows every book newest first, and only the home page closes on an iron band', async ({ page }) => {
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

  await page.goto('/demos/selection-engine/')
  const demos = page.getByRole('region', { name: 'More demos' })
  await expect(demos.getByRole('link')).toHaveCount(5)
  await expect(demos.locator('a[href="/demos/selection-engine/"]')).toHaveCount(0)
})

test('the iron lab band leads into every demo', async ({ page }) => {
  await page.goto('/')
  const lab = page.locator('#demos')
  expect(await lab.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(23, 19, 14)')
  // The concept games are engines: each names its subject, states two readouts and can be played.
  const engines = lab.getByRole('list', { name: 'Concept games' }).getByRole('listitem')
  await expect(engines).toHaveCount(3)
  for (const engine of await engines.all()) {
    await expect(engine.locator('.gauge')).toHaveCount(2)
    await expect(engine.getByRole('link', { name: /^Play The / })).toHaveAttribute('href', /^\/demos\/[A-Za-z_]+\/index\.html$/)
  }
  await expect(lab.getByRole('link', { name: 'Play The Selection Engine' })).toHaveAttribute('href', '/demos/Selection_Engine/index.html')
  await expect(lab.getByRole('link', { name: 'See all six demos' })).toHaveAttribute('href', '/demos/')
  for (const slug of ['instinct-engine', 'difference-engine', 'perceptron', 'multilayer-perceptron', 'autoencoder']) await expect(lab.locator(`a[href="/demos/${slug}/"]`)).toBeVisible()

  await page.goto('/demos/')
  const featured = await page.locator('.demo-preview-featured').boundingBox()
  const second = await page.locator('.lab-library-grid .demo-preview').first().boundingBox()
  expect(featured!.width).toBeGreaterThan(second!.width * 1.8)
  await expect(page.locator('.lab-library-grid .demo-preview')).toHaveCount(5)
  // Every concept game can be played straight from the library.
  for (const title of ['The Selection Engine', 'The Instinct Engine', 'The Difference Engine']) await expect(page.locator('.lab-library').getByRole('link', { name: `Play ${title}`, exact: true })).toBeVisible()
})

test('standalone demo pages share the site header, landmarks and footer', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    for (const demo of DEMO_PAGES) {
      await page.goto(`/demos/${demo}/index.html`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
      await expect(page.getByRole('banner')).toBeVisible()
      expect(await page.getByRole('banner').evaluate(el => [el.getBoundingClientRect().left, el.getBoundingClientRect().top]), `${demo} header is flush with the window`).toEqual([0, 0])
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('link', { name: 'All demos' })).toHaveAttribute('href', '/demos/')
      if (COMPANIONS[demo]) await expect(page.getByRole('link', { name: COMPANIONS[demo][0] })).toHaveAttribute('href', COMPANIONS[demo][1])
      const nav = page.getByRole('navigation', { name: 'Main navigation' })
      if (width === 390) await nav.locator('summary').click()
      for (const [name, href] of [['Books', '/books/'], ['Demos', '/demos/'], ['About', '/#about'], ['Contact', '/#contact'], ['Work with me', '/work/']]) await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
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
  await page.goto('/demos/selection-engine/')
  await page.getByRole('button', { name: 'Play on this page', exact: true }).click()
  const frame = page.frameLocator('iframe')
  await expect(frame.locator('main h2').first()).toBeVisible()
  for (const selector of ['header', 'footer', 'h1', '.ml-skip']) await expect(frame.locator(selector)).toBeHidden()
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
