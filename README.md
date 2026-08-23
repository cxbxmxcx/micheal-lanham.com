# micheal-lanham.com

Personal site for Micheal Lanham — author, AI agents and evolutionary computation.
Live at https://micheal-lanham.com/ on GitHub Pages.

## Stack

Vite 7 · React 19 · TypeScript · Tailwind 3 · Framer Motion · GSAP · Lenis.
Single page, sections in `src/sections/`, shared pieces in `src/components/`.

## Editing content

- **Books** — `src/components/books/booksData.ts`. Every title, subtitle, year, ISBN
  and URL was checked against the publisher listing; look a book up before editing.
- **Consulting copy** — `src/sections/Work.tsx` and `src/components/work/ProcessStrip.tsx`.
- **Bio / facts** — `src/sections/About.tsx`, `src/sections/Hero.tsx`.
- **Contact address** — `src/components/contact/TransmissionPanel.tsx`,
  `src/components/work/ServicePanel.tsx`, `src/components/Footer.tsx`.
- **Page title / description / social card** — `index.html`.

## Running locally

    npm ci
    npm run dev        # http://localhost:3000
    npm run build      # production build into dist/
    npm run preview    # serve dist/ locally

## Deploying

Push to `main`. `.github/workflows/deploy.yml` builds and publishes `dist/` to
GitHub Pages; the site is live about a minute later.

## Static assets (`public/`)

- `demos/` — three Unity WebGL teaching games (Perceptron, Multilayer Perceptron,
  Autoencoder), migrated from the 2020 site at `cxbxmxcx.github.io`. Each has a themed
  wrapper page that hides its own chrome when embedded in the site's demo cards.
- `CNAME` — custom domain. `404.html` — sends unknown paths home.
- Images are WebP; `og-image.png` stays PNG for social crawlers.

## History

The first version of this site (August 2026) was a single hand-written `index.html`;
it is in git history at commit `7bb898d` if ever needed.

## Licence

GPL-3.0, carried over from the original repository.
