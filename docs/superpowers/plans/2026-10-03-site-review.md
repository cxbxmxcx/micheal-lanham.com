# Website Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Implement all approved review findings and republish micheal-lanham.com.

**Architecture:** Reuse the React/Vite site and established palette. Share typed content records between compact homepage sections, collection pages, detail pages and build-time prerendering. Native links/scrolling and static panels make content reliable before hydration.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind; Playwright and axe for behavioral verification.

**Spec:** `docs/superpowers/specs/2026-10-03-site-review-design.md`

## Global Constraints

- Preserve the existing amber/teal identity, book bibliography and five playable demos.
- Do not invent personal facts, commercial commitments or testimonials.
- Keep unrelated user edits in `.gitignore` out of this change.
- Deployment is explicitly authorized; implement and verify before publishing.

## Review Focus

- Direct visits to nested URLs and refresh on GitHub Pages must return prerendered route content.
- Keyboard menu dismissal and destination navigation require different focus outcomes.
- 320px and reduced-motion layouts must expose essential content without clipping or waiting.
- Unavailable demo runtimes must retain retry/close/full-page escape paths.
- Content counts and publication statuses must agree across cards, details and metadata.

## Task 1: Behavioral regression coverage

Files: `playwright.config.ts`, `tests/site.spec.ts`, `package.json`.
- [x] Add tests for mobile overflow, hero click errors, menu destination focus, immediate service scope visibility, mobile full-window demo action, topic filtering, detail navigation and direct-route HTML.
- [x] Run existing behavior and record expected failures before implementation. Tests use real browser interactions; no copy snapshots.

## Task 2: Content and accessible site structure

Files: `src/components/{Navbar,Layout,Footer,SectionShell}.tsx`, `src/lib/scroll.ts`, `src/sections/*.tsx`, `src/components/books/*`, `src/data/*`, `src/pages/*`, `src/App.tsx`, `src/index.css`.
- [x] Verify author image and covers against primary public sources; record asset provenance.
- [x] Implement shared catalog/service/demo data and concise first-person copy.
- [x] Implement compact homepage, collection and detail pages with topic filters, real next-step links and engagement guidance.
- [x] Simplify surfaces/motion and fix focus, overflow and canvas timing. Keep a single running demo and honest load failure feedback.
- [x] Run the behavioral suite and inspect desktop/mobile screenshots; correct failures and accessibility violations.

## Task 3: Static delivery and route metadata

Files: `src/entry-server.tsx`, `src/main.tsx`, `src/lib/metadata.ts`, `scripts/prerender.mjs`, `package.json`, `public/404.html`, `README.md`.
- [x] Prerender all content routes using React server rendering; hydrate the same route tree and set unique metadata.
- [x] Generate sitemap and real 404; confirm no-JavaScript readability and direct nested routes.
- [x] Run build, lint, browser/axe checks, and existing Helix simulation regression.

## Task 4: Review and publish

- [x] Fresh code review of the whole change, resolve material findings and rerun affected checks.
- [x] Commit only task files, integrate to main and push through the existing deployment workflow.
- [x] Verify Actions success, live route HTML, assets and key interactions. Report the published URL and verification result.

## Execution ledger

- Design derives from the user-approved review. Work proceeds inline on a task branch in the existing checkout to preserve the available preview and avoid unnecessary setup. All project changes remain reviewable before deployment.
- Public content inputs are optional; missing commercial details are described as scoped by agreement rather than invented.
- Baseline: four core bug/route tests failed, followed by four collection/demo tests failing before implementation. All eleven initial production checks subsequently passed, including no-JavaScript content.
- Visual verification found cover images escaping their grid cells: added a failing geometric regression and corrected their dimensions.
- Shared topic query hydration produced React error 418: added a failing direct-link test and synchronized the initial render with static HTML.
- Removed replaced animation components and their unused dependencies. Scoped ESLint to this site, excluding unrelated nested project copies whose baseline errors do not belong to this change.
- Dependency maintenance applied compatible updates. Production dependency audit is clean; five dev-only Tailwind 3 transitive advisory entries remain because the proposed fix is a breaking Tailwind 4 upgrade, outside this visual/content change.
- Tasks 1–3 complete: 14 production browser tests pass, including automated WCAG checks and static HTML with JavaScript disabled. Build, lint and six Helix simulation assertions pass. Visual inspection covered 320, 390, 768 and 1440px, with all images loaded, no overflow and no browser errors. The deployment workflow now runs the same build and checks before publishing.
- Fresh review identified lost library scroll position on Back, a mobile menu left open by history navigation, and stale structured data after client navigation. Three new regressions reproduced these failures. Entry-specific scroll restoration, history-driven menu dismissal, and shared schema generation fix all three; all 17 production browser checks now pass alongside build, lint, and the simulation regression.
- Reviewer scope rulings: standalone game internals remain unchanged and are outside this site redesign; their five entry URLs pass the internal-link audit and the Helix simulation checks pass. External publisher availability is outside our control; content and new image/link sources were verified against public primary pages. Actual deployment remains part of Task 4 and will be checked after publication.
- Static audit: all 26 content pages return readable HTML, one main heading, matching canonical metadata, and valid structured data without JavaScript. All 47 internal link/asset destinations checked successfully.
- Published application commit `7d4dd71f96cd8a9c10015f9af0691bc9d5372bb4` through [successful Actions run 37170834980](https://github.com/cxbxmxcx/micheal-lanham.com/actions/runs/37170834980). All 17 browser checks passed again against https://micheal-lanham.com/, and the live audit passed all 26 pages and 47 internal destinations. An unknown live URL returns HTTP 404 with noindex, no hydration errors, and a working home link. The pre-existing `.gitignore` modification remains untouched and uncommitted.
