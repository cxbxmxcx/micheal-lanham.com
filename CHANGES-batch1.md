# Batch 1: quick fixes, performance, Unity "fix now"

Branch `fix/review-batch1`, from `main` at `23869cc`. Local only: nothing is pushed or merged. Item IDs are from `website-improvements.md`.

## Checks

- **On the final commit:** `npm run lint` is clean; `npm test` passes (the Helix Garden regression and the new image check); `npm run build` makes 26 pages, the 404 page, the sitemap and robots.txt.
- **Browser tests:** 33 of 33 pass against a production preview (`SITE_URL=http://127.0.0.1:4174 STATIC_CHECK=1`).
  - They ran on a build with the same asset hashes as the final build. Only `README.md` and this file changed after that run, and neither is part of the build.
  - 15 of the tests are new. All 15 fail against the pre-change build.
  - Two existing tests were updated for the new book-link names (W-15).

## Before and after

### Lighthouse

The "after" run has not happened yet:

- My first attempt stopped when one run wrote no report.
- Claude Code stopped the second attempt, and my preview server, because the machine was low on memory.
- I have not restarted either. I can run it on request.

**Before** (pre-change build): mobile, simulated throttling, median of 3 runs, served by `vite preview` on this machine. The fonts came from Google over the real network. On the live site, the reviewers measured mobile LCP of 2.9–3.6 s on book pages and 3.3 s on `/books/`.

| Page | Score | FCP | LCP | Fonts | Requests to other origins |
|---|---:|---:|---:|---:|---:|
| `/books/ai-agents-in-action-second-edition/` | 95 | 1.49 s | 2.80 s | 102,182 B | 4 |
| `/books/` | 96 | 1.50 s | 2.72 s | 102,182 B | 4 |
| `/` | 100 | 1.49 s | 1.49 s | 102,182 B | 4 |

**After**, measured in Chrome rather than by Lighthouse:

- **Other origins:** no request leaves the site on any page, including the demos (a test covers this).
- **Fonts:** 73,368 bytes, preloaded from this site.
- **LCP image:** loads eagerly with `fetchpriority=high`, and is a 9–18 KB WebP instead of a 42–45 KB JPEG.

### Bytes

| | Before | After |
|---|---:|---:|
| JavaScript per page (raw / gzip) | 301,832 / 96,238 | 286,402 / 90,234 |
| JavaScript a content edit invalidates (app chunk) | 253,092 / 78,989 | 55,749 / 16,613 |
| CSS (raw / gzip) | 19,819 / 5,355 | 22,157 / 5,858 |
| Font files on a site page | 102,182 in 3 files, plus a stylesheet, from 2 other origins | 73,368 in 3 files from this site |
| SIA cover on a card, 1x screen | 44,523 | 10,178 |
| Author portrait, 1x screen | 249,650 | 9,276 |
| Unity engine files in the deploy | 3 × 3,732,720 | 1 × 3,732,720 |
| Second Unity game, engine download | its own copy, about 3.6 MB | two 300-byte 304s (on a server that honours If-Modified-Since, as GitHub Pages does) |
| Whole deploy (`dist/`) | 18,908,568 | 11,553,962 |

Gzip sizes are from `gzip -9`.

## Item by item

| ID | What changed | Test |
|---|---|---|
| W-01 | The footer year is now the build year (`__BUILD_YEAR__`, set in `vite.config.ts`). It was the visitor's clock, which would have broken hydration (React #418) on every page from 1 Jan 2027. | Hydration with the clock set to 2027-01-02 |
| W-02 | The embedded Unity canvas is centred with auto margins. Before, the overflow went off the left edge, out of reach: 62 px at 1,024 px and 166 px at 800 px. It is now fully reachable at any width. | Embed at 1,024 px |
| W-03, W-04, W-05 | Not touched; site-design owns them. | |
| W-06 | Proof Gate: the red token moved from #C25B4A to #D06656 (5.12:1 on panels). Jammed cards were dimmed to 1.96:1 with `opacity: .45`; they now keep their text colour and use a dashed border. | axe on every Proof Gate scene |
| W-07 | Helix Garden: links in the footnote are underlined. The link was colour-only at 1.62:1. | axe `link-in-text-block` |
| W-08 | Helix Garden: the transport row wraps, so the page fits 320 px after the intro. | Width after the intro at 320 px |
| W-09 | Both companion demos: when a step change replaces the focused button, focus moves to the new heading. Leaving the Helix intro focuses the run/pause button. | Focus after Enter, both demos |
| W-10 | Perceptron and Autoencoder posters: the missing-glyph boxes are replaced with subscript i and ℝ. There are no poster sources, so both were patched in place. The Proof Gate poster was re-captured so that no line is cut. | Checked visually |
| W-11 | The book detail cover and the first library cover and demo poster load eagerly with `fetchpriority=high`. The rest of the first row loads eagerly; everything below stays lazy. | |
| W-12 | Each service CTA has a copy-email fallback (`useCopyEmail`, shared with Contact). | Copies the address |
| W-13 | Below `lg`, the service CTA and the fallback also appear right after the intro: 393 px from the top at 390×844, down from about 2,064 px. | CTA in the first phone screen |
| W-14 | Book and service cards take their heading level from the caller (h2 on `/books/` and `/work/`). | axe `heading-order` on 8 routes |
| W-15 | Book links keep "Explore this book" and add the title as hidden text. The loop buttons no longer override their visible text with `aria-label`. | axe `label-content-name-mismatch` |
| W-16 | Hero loop labels went from 8.8–9.6 px to 12 px. CSS only; they still fit at 320 px. `Hero.tsx` is untouched. | |
| W-17 | Not touched; site-design owns it. | |
| W-18 | `*/index.html` URLs drop the suffix before hydration, so they render their folder page instead of the 404 page. | 4 aliases, with query and hash |
| W-19 | Pages marked `noindex` (the 404 page) have no canonical or `og:url`. Both are restored on client navigation. | 404 metadata |
| W-20 | The 404 page links to `/demos/`. | |
| W-21 | Headings in notice boxes are ink, not grey. | |
| W-22 | `#root` is a full-height flex column, so the footer sits at the bottom of short pages. | |
| W-23 | Outside the hero: → for internal links, ↗ for other sites, and an envelope icon on mailto buttons. Bare arrows are wrapped in `aria-hidden`. The hero button is left to the design branch. | |
| W-24 | "Work with me" (desktop and mobile menu) has `aria-current="page"` and an active style on `/work/*`. | aria-current |
| W-25 | `.reading-copy` paragraphs and lists stop at 68ch, as specified. Measured at 1,440 px, the About lead now runs 86 and 80 characters a line, down from 99. | |
| W-48 | Phones and small touch tablets now see "Desktop required" before anything downloads, with a "Continue anyway" option. This applies on the Unity game pages and on the site's demo pages. | No download before Continue; demo-page notice |
| W-49 | `unity-player.js` adds a status line to the standalone Unity pages and checks the manifest first. Errors (didn't load, no WebGL, stopped) appear in the page with "Try again"; there are no `alert()` dialogs. After 45 s without loading, it offers "Try again". Embedded games report errors at once. | 503 manifest → error, no dialog, retry works; embed failure reported at once |
| W-50 | Self-hosted woff2 subsets on all pages, including the five demos. `scripts/subset-fonts.py` builds them from google/fonts at a pinned commit, and the OFL licences are included. No page now contacts another origin. | No third-party requests |
| W-51 | The portrait is now WebP: 9 KB at 220 px and 19 KB at 350 px. The source is only 350 px wide, so there is no true 2× version. | |
| W-52 | `npm run images` (sharp) builds WebP covers at 240/480/720 px, never larger than the original, with a manifest for `srcset` and real width/height. Four `.png` files that were really JPEGs are renamed `.jpg`. `npm test` fails if the WebP files are stale. | `build-images --check` |
| W-53 | `manualChunks` uses the function form, so all of `node_modules` goes to `vendor`. | |
| W-54 | Removed `tailwind-merge` and `tailwindcss-animate`. `cn()` is now `clsx`. | |
| W-55 | The three games share one copy of UnityLoader.js and the wasm/framework files in `public/demos/unity-2019.3/`. The game URLs are unchanged. | Checked in Chrome (see the Bytes table) |
| W-56 | Deleted `about-portrait.webp`, `dendrite-books.webp` and `og-image.png` (557,260 bytes). Nothing referenced them. | |
| W-65 (minimum) | Each Unity game has "How to play" and "What the game shows" on its site page and on its game page. The canvas has an accessible name and description. | Text identical in both places |

## For the owner

- **Review the "How to play" text for the three Unity games.** It is in `src/data/demos.ts` (`UNITY_GUIDES`) and is repeated in each game page.
  - I wrote it from the games running in Chrome.
  - I checked these controls in all three games: selecting a training example, typing a weight, and dragging a weight. The canvas cannot be reached by keyboard.
  - The Perceptron "challenge" step is my suggestion. It is solvable: the weights 0, 0.5 and 0.5 give a loss of 0 on all three examples.
- **The Unity game titles now use Space Grotesk** instead of Fraunces (per D2). Arrows now render in Inter instead of a fallback font.
- **The footer shows the year of the last deploy.** One deploy in the new year updates it.
- **W-25: the measure is still long.** In Inter, one `ch` (the width of "0") is wider than an average letter, so 68ch gives 80–86 characters a line, not 68. About 60ch would give about 70–75. I left 68ch because that is what the item specifies and what the tests ran against.
- **A sharper portrait needs a larger photo.** The only source is 350×436, and Manning's copy is the same file.
- **The *AI Agents in Action* 1e cover is still 192 px wide** (W-38, design batch).
- **One lockfile entry predates this branch:** `@babel/helper-plugin-utils` 7.28.6 resolves from `registry.npmmirror.com`. npm still checks its integrity, but you could regenerate it from registry.npmjs.org.
- **Incidental changes:**
  - The Unity pages now post their ready message to the site's origin instead of `'*'` (part of W-75).
  - `sharp` is a new dev dependency.

## Merging with design/hero-and-demo-shell

A trial merge (`git merge-tree`) conflicts in 11 files:

- the five demo pages;
- `DemoPreview.tsx`, `Navbar.tsx` and `index.css`;
- `BookLibrary.tsx`, `DemoLibrary.tsx` and `Demos.tsx`.

In each case, keep the design structure and re-apply these:

- **Demo page `<head>`:** use `<link rel="stylesheet" href="/fonts/fonts.css">`. The design branch still loads Google Fonts.
- **Unity pages:**
  - keep the loader block (`../unity-2019.3/UnityLoader.js`, `unity-player.css`, `unity-player.js` with its `data-` attributes);
  - keep the auto-margin `.embedded` rules;
  - keep the guarded fullscreen `onclick`;
  - move the `<section class="howto">` block into `.ml-after`, before `.note`.
- **`Navbar.tsx`:** keep `aria-current={current(...)}` on the links and on Work with me.
- **`BookLibrary.tsx`:** keep `heading="h2"` and `priority={listPriority(index)}`. The heading-order test fails without them.
- **`DemoPreview.tsx`, `DemoLibrary.tsx`, `Demos.tsx`:** use `loadingProps`/`listPriority` for the first poster. Keep the `aria-hidden` arrows.
- **The new hero:** use `responsiveImage('/micheal-lanham.png', …)` for the portrait, and `BookArtwork priority="high"` (or `loadingProps('high')`) for the LCP image.

After the merge, run the browser suite. The heading, Unity, font and alias tests cover the points above.
