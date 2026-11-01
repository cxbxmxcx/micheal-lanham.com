import { test, expect, devices } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

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

test('service inquiries start in the first phone screen, with a copy-email fallback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.setViewportSize({ width: 390, height: 844 })
  for (const [url, cta] of [['/work/architecture-reviews/', 'Request an architecture review'], ['/work/workshops/', 'Discuss a team workshop']]) {
    await page.goto(url)
    const link = page.getByRole('link', { name: cta, exact: true }).first()
    await expect(link).toBeVisible()
    expect((await link.boundingBox())!.y, url).toBeLessThan(844)
  }
  await page.getByRole('button', { name: 'Copy email address', exact: true }).first().click()
  await expect(page.getByRole('status').filter({ hasText: 'Email address copied.' })).toHaveCount(1)
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('cxbxmxcx@micheal-lanham.com')
})

test('the Work with me button marks the current section', async ({ page }) => {
  await page.goto('/work/workshops/')
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Work with me', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.goto('/books/')
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Work with me', exact: true })).not.toHaveAttribute('aria-current')
})

test('book topic filters keep matching books and open a detail page', async ({ page }) => {
  await page.goto('/books/')
  await page.getByRole('button', { name: 'AI agents', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'AI Agents in Action, Second Edition', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Game Audio Development with Unity 5.X', exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: /^Explore this book\W+AI Agents in Action, Second Edition$/ }).click()
  await expect(page).toHaveURL(/\/books\/ai-agents-in-action-second-edition\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AI Agents in Action, Second Edition')
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your next book.')
})

test('Back restores the reading position after opening a book near the library bottom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/books/')
  const book = page.getByRole('link', { name: /^Explore this book\W+Game Audio Development with Unity 5\.X$/ })
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

test('every Proof Gate scene meets WCAG contrast, and advancing moves focus to the new scene', async ({ page }) => {
  test.slow() // about 25 axe runs; CI runners are slower than a workstation
  await page.goto('/demos/Proof_Gate/index.html')
  await page.locator('#n').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#scene h2')).toHaveText('Claim 1 of 3')
  await expect(page.locator('#scene h2')).toBeFocused()
  // Walk the whole story (keeping every version), checking each scene.
  for (let step = 0; step < 40; step++) {
    const report = await new AxeBuilder({ page }).include('#scene').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(report.violations, JSON.stringify(await page.evaluate(() => (window as unknown as { __gate: { state(): unknown } }).__gate.state()))).toEqual([])
    const next = page.locator('#n, #k').first()
    if (!await next.count()) break
    await next.click()
  }
  await expect(page.getByRole('button', { name: '↺ play again' })).toBeVisible()
})

test('Helix Garden keeps focus on the intro and fits a 320 px screen after it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/demos/Helix_Garden/index.html')
  await page.locator('#gNext').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#guide h2')).toHaveText('One life, four steps, forever')
  await expect(page.locator('#guide h2')).toBeFocused()
  await page.locator('#gSkip').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#btnPause')).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  const report = await new AxeBuilder({ page }).withRules(['link-in-text-block', 'color-contrast']).analyze()
  expect(report.violations).toEqual([])
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

test('an embedded Unity game at 1,024 px keeps its left edge and can scroll to its right edge', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto('/demos/perceptron/')
  await page.getByRole('button', { name: 'Play here', exact: true }).click()
  const game = page.frameLocator('iframe[title="The Perceptron Game"]').locator('#unityContainer')
  await expect(game).toBeAttached()
  // The 1,050 px canvas is wider than the iframe here; none of it may be out of reach.
  const box = await game.evaluate(element => {
    const stage = element.closest('.stage')!
    const start = element.getBoundingClientRect(), view = stage.getBoundingClientRect()
    stage.scrollLeft = stage.scrollWidth
    return { left: start.left - view.left, right: element.getBoundingClientRect().right - view.right, overflow: stage.scrollWidth - stage.clientWidth }
  })
  expect(box.left, 'left edge hidden').toBeGreaterThanOrEqual(0)
  expect(box.right, 'right edge out of reach').toBeLessThanOrEqual(1)
  expect(box.overflow).toBeGreaterThan(0)
})

test.describe('Unity games on a phone', () => {
  // iPhone emulation in the configured browser: touch, a coarse pointer and a 390 px screen.
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices['iPhone 13']
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch })

  test('the game page shows a desktop-required notice and downloads nothing until the visitor continues', async ({ page }) => {
    const downloads: string[] = []
    page.on('request', request => { if (/(\.unityweb|Web\.json)$/.test(new URL(request.url()).pathname)) downloads.push(request.url()) })
    await page.goto('/demos/Perceptron_Game/index.html', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Desktop required' })).toBeVisible()
    expect(downloads).toEqual([])
    expect((await new AxeBuilder({ page }).include('.unity-panel').withTags(WCAG).analyze()).violations).toEqual([])
    const manifest = page.waitForRequest(request => request.url().endsWith('/Perceptron_Game/Build/Web.json'))
    await page.getByRole('button', { name: 'Continue anyway' }).click()
    await manifest
    await expect(page.getByRole('heading', { name: 'Desktop required' })).toHaveCount(0)
  })

  test('the demo page offers the notice in place of the play buttons, for Unity games only', async ({ page }) => {
    await page.goto('/demos/perceptron/')
    await expect(page.getByRole('heading', { name: 'Desktop required' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Play The Perceptron Game' })).toBeHidden()
    await expect(page.getByRole('link', { name: 'Continue anyway' })).toHaveAttribute('href', '/demos/Perceptron_Game/index.html?device=any')
    await page.goto('/demos/proof-gate/')
    await expect(page.getByRole('link', { name: 'Play The Proof Gate', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Desktop required' })).toHaveCount(0)
  })
})

test('a standalone Unity game that cannot load says so in the page and can try again, without an alert', async ({ page }) => {
  test.slow() // where WebGL is available the real 5 MB game loads after the retry
  const dialogs: string[] = []
  page.on('dialog', dialog => { dialogs.push(dialog.message()); void dialog.dismiss() })
  await page.route('**/Perceptron_Game/Build/Web.json', route => route.fulfill({ status: 503, body: 'Temporarily unavailable' }))
  await page.goto('/demos/Perceptron_Game/index.html')
  const error = page.getByRole('heading', { name: 'The game didn’t load' })
  await expect(error).toBeFocused()
  await expect(page.getByRole('link', { name: 'Back to the game’s page' })).toHaveAttribute('href', '/demos/perceptron/')
  expect((await new AxeBuilder({ page }).include('.unity-panel').withTags(WCAG).analyze()).violations).toEqual([])
  await page.unroute('**/Perceptron_Game/Build/Web.json')
  const manifest = page.waitForResponse(response => response.url().endsWith('/Perceptron_Game/Build/Web.json') && response.ok())
  await page.getByRole('button', { name: 'Try again' }).click()
  await manifest
  await expect(error).toHaveCount(0)
  // Where the browser provides WebGL the game then starts, with a labelled canvas.
  if (await page.evaluate(() => !!document.createElement('canvas').getContext('webgl'))) {
    await expect(page.getByRole('status')).toHaveText('The Perceptron Game is ready.', { timeout: 60_000 })
    await expect(page.getByRole('img', { name: /The Perceptron Game, an interactive Unity game/ })).toHaveAttribute('aria-describedby', 'game-summary')
  }
  expect(dialogs).toEqual([])
})

test('an embedded Unity game that cannot load is reported straight away', async ({ page }) => {
  await page.route('**/Perceptron_Game/Build/Web.json', route => route.fulfill({ status: 503, body: 'Temporarily unavailable' }))
  await page.goto('/demos/perceptron/')
  await page.getByRole('button', { name: 'Play here', exact: true }).click()
  await expect(page.locator('.demo-player [role="status"]')).toHaveText('The demo could not start.')
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
})

test('each Unity game explains how to play, with the same text on its site page and beside the game', async ({ page }) => {
  for (const [slug, folder] of [['perceptron', 'Perceptron_Game'], ['multilayer-perceptron', 'MLP_Game'], ['autoencoder', 'Autoencoder_Game']]) {
    await page.goto(`/demos/${slug}/`)
    await expect(page.getByRole('heading', { name: 'How to play' })).toBeVisible()
    const steps = await page.locator('#how-to-play ~ ol li').allTextContents()
    const summary = await page.locator('h2:has-text("What the game shows") + p').textContent()
    const html = await (await page.request.get(`/demos/${folder}/index.html`)).text()
    const section = html.slice(html.indexOf('<section class="howto"'), html.indexOf('</section>'))
    expect(steps.length, slug).toBeGreaterThanOrEqual(3)
    expect([...section.matchAll(/<li>(.*?)<\/li>/g)].map(match => match[1]), slug).toEqual(steps)
    expect(section.match(/<p id="game-summary">(.*?)<\/p>/)?.[1], slug).toBe(summary)
  }
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

test('headings do not skip levels, and visible labels are part of accessible names', async ({ page }) => {
  // Neither rule runs under the WCAG tags above: heading-order is a best
  // practice and label-content-name-mismatch (WCAG 2.5.3) is experimental.
  for (const url of ['/', '/books/', '/books/self-improving-agents/', '/work/', '/work/workshops/', '/demos/', '/demos/perceptron/', '/404.html']) {
    await page.goto(url)
    await expect(page.locator('h1')).toBeVisible()
    const report = await new AxeBuilder({ page }).withRules(['heading-order', 'label-content-name-mismatch']).analyze()
    expect(report.violations, url).toEqual([])
  }
})

test('pages and companion demos load their fonts from this site and contact no other origin', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const external: string[] = []
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(origin)) external.push(request.url()) })
  for (const url of ['/', '/books/self-improving-agents/', '/demos/Proof_Gate/index.html', '/demos/Helix_Garden/index.html']) {
    await page.goto(url, { waitUntil: 'networkidle' })
    const families = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter(face => face.status === 'loaded').map(face => face.family) })
    expect(families, url).toEqual(expect.arrayContaining(['Inter', 'Space Grotesk']))
  }
  expect(external).toEqual([])
})

test('pages hydrate without errors after the year changes', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && /react|hydrat|#4\d\d/i.test(message.text())) errors.push(message.text()) })
  // The prerendered footer carries the build year. A visitor whose clock has
  // reached a later year must still hydrate the same markup (React error #418).
  await page.clock.setFixedTime(new Date('2027-01-02T09:00:00Z'))
  for (const url of ['/', '/books/', '/work/architecture-reviews/', '/demos/']) {
    await page.goto(url)
    await expect(page.locator('h1')).toBeVisible()
    // Layout's first effect runs only once hydration has committed.
    await expect.poll(() => page.evaluate(() => window.history.scrollRestoration), { message: url }).toBe('manual')
  }
  expect(errors).toEqual([])
})

test('index.html aliases open the folder page instead of the 404 page', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (const [alias, route] of [['/index.html', '/'], ['/books/index.html?topic=AI+agents', '/books/?topic=AI+agents'], ['/books/self-improving-agents/index.html', '/books/self-improving-agents/'], ['/work/index.html#contact', '/work/#contact']]) {
    await page.goto(alias)
    await expect(page, alias).toHaveURL(route)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText('This page isn’t here.')).toHaveCount(0)
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://micheal-lanham.com${route.replace(/[?#].*/, '')}`)
  }
  expect(errors).toEqual([])
})

test('the 404 page has no canonical, and leaving it restores one', async ({ page }) => {
  await page.goto('/404.html')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page isn’t here.')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  await expect(page.locator('link[rel="canonical"], meta[property="og:url"]')).toHaveCount(0)
  await page.getByRole('link', { name: 'Browse books', exact: true }).click()
  await expect(page).toHaveURL(/\/books\/$/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://micheal-lanham.com/books/')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://micheal-lanham.com/books/')
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
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
