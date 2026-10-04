# micheal-lanham.com

Personal website for Micheal Lanham: books, interactive AI demos, architecture reviews, and training workshops.

Live at https://micheal-lanham.com/ on GitHub Pages.

## Stack and structure

Vite 7, React 19, TypeScript, Tailwind 3, and React Router. The homepage is a curated overview; books, services, and demos have collection and detail pages. A small canvas animation is decorative and respects reduced-motion preferences.

`scripts/prerender.mjs` uses `src/entry-server.tsx` to generate HTML for every content route, plus a 404 page, sitemap, and robots.txt. The browser hydrates the same route tree. Keep `PAGE_PATHS` in `src/lib/metadata.ts` aligned with the data and router when adding page types.

## Editing content

- **Book bibliography:** `src/components/books/booksData.ts`. Verify titles, dates, ISBNs, and destinations against publisher listings before editing.
- **Book discovery, audiences, early access, covers:** `src/data/books.ts`.
- **Services and inquiry prompts:** `src/data/services.ts`. Scope and schedule are agreed per engagement; do not add unconfirmed promises.
- **Demos:** `src/data/demos.ts`. Original standalone game URLs are preserved under `public/demos/`.
- **Biography and homepage copy:** `src/sections/`.
- **Email address:** `src/data/contact.ts`.
- **Page metadata:** `src/lib/metadata.ts`; shared social artwork and font loading: `index.html`.
- **Image sources:** `public/asset-sources.txt` documents the publisher-sourced author photograph and book covers.

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

Tests cover narrow layouts, keyboard focus, book filters, direct shared links, demo loading/recovery, reduced motion, automated accessibility, and HTML without JavaScript. `npm test` runs the canonical Helix Garden simulation regression.

## Publish

Push to `main`. `.github/workflows/deploy.yml` installs dependencies, lints, runs the simulation checks, builds all static pages, runs browser checks, and publishes `dist/` to GitHub Pages. Verify the workflow succeeds and inspect the live site after deployment.

Do not hand-edit `dist/`. GitHub Pages serves the generated `index.html` files at nested routes and the generated `404.html` for missing pages. The original game folders, CNAME, and social assets are copied from `public/`.

## Demos

The Proof Gate and Helix Garden are native browser companions to *Self-Improving Agents*. The Perceptron, Multilayer Perceptron, and Autoencoder games are the original Unity WebGL teaching builds. Phones open dedicated game pages; desktop visitors may also choose an embedded player.

## History and licence

The first version (August 2026) was a single handwritten `index.html`, retained in git history at `7bb898d`. The repository uses GPL-3.0. Publisher names and book cover artwork remain the property of their respective owners.
