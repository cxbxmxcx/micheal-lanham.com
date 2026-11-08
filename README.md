# micheal-lanham.com

Personal website for Micheal Lanham: books, interactive AI demos, architecture reviews, and training workshops.

Live at https://micheal-lanham.com/ on GitHub Pages.

## Stack and structure

Vite 7, React 19, TypeScript, Tailwind 3, and React Router. The homepage is a curated overview; books, services, and demos have collection and detail pages. The visual system uses the games' notebook paper, sepia ink, brass, and dark iron, with cyan instrument readouts. Shared colour tokens come from `public/demos/kit/darwin-engine.css` and are copied into `src/index.css`. An interactive agent learning loop introduces the work. Diagram motion is brief and respects reduced-motion preferences. All 12 published books have verified cover artwork.

`scripts/prerender.mjs` uses `src/entry-server.tsx` to generate HTML for every content route, plus a 404 page, sitemap, and robots.txt. The browser hydrates the same route tree. Keep `PAGE_PATHS` in `src/lib/metadata.ts` aligned with the data and router when adding page types.

## Editing content

- **Book bibliography:** `src/components/books/booksData.ts`. Verify titles, dates, ISBNs, and destinations against publisher listings before editing.
- **Book discovery, audiences, early access, covers:** `src/data/books.ts`.
- **Services and inquiry prompts:** `src/data/services.ts`. Scope and schedule are agreed per engagement; do not add unconfirmed promises.
- **Demos:** `src/data/demos.ts`, including `UNITY_GUIDES` (How to play and a text description for the Unity games, repeated in each game's `index.html`; a test keeps the two identical). Original standalone game URLs are preserved under `public/demos/`.
- **Biography and homepage copy:** `src/sections/`.
- **Email address:** `src/data/contact.ts`.
- **Page metadata:** `src/lib/metadata.ts`; default social tags and font preloads: `index.html`.
- **Fonts:** self-hosted subsets in `public/fonts/` (with their OFL licences), declared in `src/index.css` for the site and `public/fonts/fonts.css` for the demo pages. `scripts/subset-fonts.py` rebuilds them; it is needed only to change the character set or weights.
- **Image sources:** `public/asset-sources.txt` documents the publisher-sourced author photograph and book covers. After adding or replacing a cover in `public/books/` or the portrait, run `npm run images` to rebuild the responsive WebP files in `public/img/` and `src/data/images.json`; `npm test` fails until you do.
- **Icons:** after changing `public/logo.svg`, run `npm run icons` to rebuild `apple-touch-icon.png` and `favicon.ico`.
- **Social cards:** after changing a book, a demo, the portrait or the logo, run `npm run social` (needs Chrome) to rebuild `public/social/` and `src/data/social.json`; `npm test` fails until you do.

## Run and verify

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
npm run preview -- --port 4173
```

Browser tests use installed Google Chrome locally. Against a running production preview, set `SITE_URL=http://127.0.0.1:4173` and `STATIC_CHECK=1`, then run `npm run test:browser`. Without these variables, tests target the development server on port 3000 and skip the static HTML check. CI installs Chromium and starts its own production preview.

Tests cover narrow layouts, keyboard focus, book filters, direct shared links and `index.html` aliases, hydration after the year changes, the 404 metadata, service inquiries, demo loading/recovery (including the Unity phone notice, standalone errors and the embed at 1,024 px), all three concept games, scene by scene, reduced motion, automated accessibility (WCAG tags plus heading order and label-in-name), self-hosted fonts with no third-party requests, and HTML without JavaScript. `npm test` checks that the responsive images, the social cards and the palette are current.

## Publish

Push to `main`. `.github/workflows/deploy.yml` installs dependencies, lints, runs `npm test`, builds all static pages, runs browser checks, and publishes `dist/` to GitHub Pages. Verify the workflow succeeds and inspect the live site after deployment.

Do not hand-edit `dist/`. GitHub Pages serves the generated `index.html` files at nested routes and the generated `404.html` for missing pages. The original game folders, CNAME, and social assets are copied from `public/`.

## Demos

The Selection Engine (a companion to *Self-Improving Agents*), The Instinct Engine and The Difference Engine (companions to *The Instinctual Learning Agent Harness*) are native browser games. The retired Proof Gate and Helix Garden addresses redirect to The Selection Engine. The Perceptron, Multilayer Perceptron, and Autoencoder games are the original Unity WebGL teaching builds. They share one copy of the Unity 2019.3 engine in `public/demos/unity-2019.3/`, where `unity-player.js` starts each game with a status line, in-page errors with Try again, and a desktop-required notice on phones (skipped with `?device=any`). Desktop visitors may also choose an embedded player.

## History and licence

The first version (August 2026) was a single handwritten `index.html`, retained in git history at `7bb898d`. The repository uses GPL-3.0. Publisher names and book cover artwork remain the property of their respective owners.
