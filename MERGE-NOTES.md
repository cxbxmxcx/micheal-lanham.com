# Release notes: merge, deploys and next steps (2026-11-01)

## State

**Branch:** `release/site-2026-11` in `C:\Users\Micheal\website-fixes`. It is `fix/review-batch1` plus the merge of `design/hero-and-demo-shell` at `fc0556f`, plus the follow-ups below. Per-item detail for batch 1 is in `CHANGES-batch1.md`.

**Pushed to origin main twice, both runs green:**

| Commit | Run | Contents | Checks |
|---|---|---|---|
| `e756c13` | 41322616633 | The merged site: new hero, demo shell, bookshelf and all batch 1 fixes | lint, test, build, 43 browser tests, deploy |
| `cbcde43` | 41324867478 | W-25 at 60ch; W-61 to W-63 (structured data, descriptions within 160 characters, sitemap `lastmod`, game pages noindex with share tags); W-66 (axe on all 31 pages); W-72 (PR check workflow, pinned actions, Pages write only in the deploy job) | all green |

**Live check:**
- New hero, self-hosted fonts and WebP covers.
- "How to play" on the Unity game pages.
- Shared Unity engine served (`/demos/unity-2019.3/`).
- `noindex` on the standalone game pages.
- Sitemap `lastmod` present.

**Things I left alone:**
- **Main checkout** (`C:\Users\Micheal\website`): untouched, now behind origin, and still has the owner's uncommitted `.gitignore` change. `git pull --ff-only` there is safe.
- **Ports:** 4173 is the Kimi review's leftover preview and 4190 is site-design's. Neither is mine; leave both.

## Lighthouse

Mobile, local `vite preview`, median of 3 runs.

| Page | Before (score / FCP / LCP) | After (score / FCP / LCP) |
|---|---|---|
| Book page (AIA 2e) | 95 / 1.49 s / 2.80 s | 98 / 0.76 s / 2.41 s |
| `/books/` | 96 / 1.50 s / 2.72 s | 96 / 0.76 s / 2.78 s |
| `/` | 100 / 1.49 s / 1.49 s | 100 / 0.76 s / 0.76 s |
| `/demos/` | (not measured) | 97 / 0.76 s / 2.63 s |

**Fonts:** 102 KB from 4 third-party requests before; 74 KB from this site after, with no third-party requests.

## Shipped as built: site-design choices the owner has not confirmed

1. The hero H1: "Micheal Lanham, author of AI Agents in Action."
2. The portrait appears twice on the home page, in the hero and in About.
3. The dark lab band colours (near-black #0B0A08 with amber) on the home page and `/demos/`.
4. The Proof Gate end card says "This is chapter 3 of Self-Improving Agents", although the game covers chapters 3–4.
5. Two new section headlines:
   - "Reviews and training for teams building agents." (Work)
   - "Twelve published books since 2017, and one in early access." (Books)
6. The phone library grid (two covers per row) hides each card's audience line.

## Still open from the review list

- **W-60, per-page social cards:** deferred until the new look is chosen.
- **`/books/` LCP:** did not improve (2.72 → 2.78 s). Check it after the redesign.
- **GitHub Node 20 deprecation notices:** the actions still run, forced onto Node 24. The next majors would clear the notices, but `upload-pages-artifact` v4 drops dotfiles, so check that first.
- **Lockfile:** one entry that predates this work resolves from `registry.npmmirror.com`.

## Next: the owner's new direction (asked 2026-11-01)

**Look:** high-tech steampunk combined with Darwin's drawings:
- engraved line art on parchment: the "I think" tree, finches, specimen labels;
- brass instruments;
- modern type and glowing cyan readouts.

**Games:** the Unity games stay. Proof Gate and Helix Garden are to be updated or replaced by three concept games.

1. **The Selection Engine** (Self-Improving Agents). Define "good", measure the gap, then search.
   - Signals: proof, ground-truth labels, LLM-as-Judge, Jev-as-Judge and reflection.
   - Searches: hill climbing, GEPA (Pareto front) and the Darwin Gödel Machine (archive drawn as Darwin's tree).
   - Chapters: a task with proof; a task where a judge can be gamed; a deceptive task where hill climbing stalls and the archive recovers.
2. **The Instinct Engine** (the instinctual harness).
   - A frozen LLM. Route each task to System 1 (fast), System 2 (reasoning), a learned memory card, or Jev, a decision model for typed judgments that escalates when unsure.
   - Cost and time fall as System 2 work becomes instinct. The trap is a stale memory.
3. **The Difference Engine** (metacognition).
   - The child-learns-maths story: fingers (System 2), then a 10×10 table (recall), then a search for a learning mechanism built from rule gears.
   - A mechanism passes only if it rebuilds the table, including held-back cells. It then generalizes to a 20×20 table.
   - Last screen: table = shared memory; mechanism = the harness's learning skill.

**Waiting on the owner:**
1. Scope: the whole site (mockup first) or the games only.
2. Retire or keep Proof Gate and Helix Garden.
3. Build order: sequential, or the three games in parallel sessions.

**Recommended:** the whole site with a mockup first, retire the old games, and build in parallel after the mockup is approved.

## Progress: the new direction (2026-11-01)

**Owner's decisions:** restyle the whole site (mockup first), retire The Proof Gate and Helix Garden, and build the three games in parallel.

**Shared foundation**, on `release/site-2026-11`:

| Commit | What it adds |
|---|---|
| `f410d15` | The kit (`public/demos/kit/darwin-engine.css`), Fraunces in the self-hosted fonts, `GAMES-BRIEF.md` |
| `bb3f637` | The kit chip fix, and the mockup |

**Mockup:** `mockups/darwin-engine/index.html` (outside `public/`, so it doesn't ship). Serve it with `npx vite --port 4176` and open `/mockups/darwin-engine/`. It is waiting for the owner's approval.

**Game sessions**, children of site-fixes, each in its own worktree and branched from `f410d15`:

| Session | Game | Worktree | Branch | Preview port |
|---|---|---|---|---|
| game-selection | The Selection Engine | `website-game-selection` | `games/selection-engine` | 4191 |
| game-instinct | The Instinct Engine | `website-game-instinct` | `games/instinct-engine` | 4192 |
| game-difference | The Difference Engine | `website-game-difference` | `games/difference-engine` | 4193 |

Each session was told to pull the latest kit with `git checkout release/site-2026-11 -- public/demos/kit/darwin-engine.css`.

**Integration**, by site-fixes once the games are done:
1. Merge the three branches.
2. Add the games to `src/data/demos.ts`, with posters.
3. Retire Proof_Gate and Helix_Garden: point their pages and site pages to The Selection Engine, and update the tests that use them.
4. Restyle the site with the approved kit.
5. Build the social cards in the new look (W-60).
6. Run every check, then deploy.

### Game 3 done: The Difference Engine (game-difference)

**Branch:** `games/difference-engine`

| Commit | Contents |
|---|---|
| `fa7a22c` | The game |
| `32752b5` | Its tests |
| `72d31ab` | `docs/games/difference-engine.md` |

**Checks:** lint, `npm test` and the build pass. Its own spec is 8/8 against a preview: playthroughs by mouse and by keyboard, axe on 11 states, 320 px, reduced motion, the embed, and a model check over all 127 gear combinations.

**Wiring needed:**
- Add the game to `src/data/demos.ts`. Until then the prerender doesn't stamp noindex or share tags on it.
- Its credit links to `/books/instinctual-learning-agent-harness/`.

**Owner questions:**
1. Credit Self-Improving Agents as well?
2. Keep the 150-step budget, which is what forces the player to find Split?
3. Keep the Babbage/Darwin line? It is in the footnote only.
4. Is a deliberately false gear ("Just add") acceptable?
5. Should the debrief note that a three-cell check can miss errors in general?
6. The h1 uses the shell's Space Grotesk until the shell is restyled.

### Game 2 done: The Instinct Engine (game-instinct)

**Branch:** `games/instinct-engine`

| Commit | Contents |
|---|---|
| `b26a47a` | `engine.js`, the simulation |
| `368815d` | The game page |
| `ff19ab0` | Its tests |
| `249b12c` | `docs/games/instinct-engine.md` |

**Checks:** lint, `npm test` and the build pass. Its own spec is 9/9 against a preview, with axe on every scene type, keyboard play, 320 px, reduced motion, the embed and description length.

**Story:** a clock-repair help desk, 4 days with 5 messages a day.
- Day 1: System 2 answers write memory cards.
- Day 2: the cards turn into recall.
- Overnight: warranty decisions are compiled into Jev (threshold 0.80).
- Day 3: Jev escalates a 0.61 case.
- Day 4: a stale card, because the warranty went from 12 to 6 months, with a check or a complaint as the signal.
- Debrief: compares against a tuned reference harness.

**Wiring needed:**
- Add demo data, a poster and share tags.
- The credit pill is text only, because the book has no cover.
- Its "memories need checking" lesson can link to The Selection Engine once that exists.

**Owner questions:**
1. Is the clock-repair setting OK, or should it use an agent task from the book?
2. Do the term labels match the book's wording?
3. Is the Jev wording OK, and should the page link to TypeSafe?
4. Does hiding right and wrong on day 4 land?
5. Length is 6–8 minutes. Is a shorter cut wanted?

### Game 1 done: The Selection Engine (game-selection)

**Branch:** `games/selection-engine`

| Commit | Contents |
|---|---|
| `56766d4` | The game |
| `8697e40` | Its tests |
| `a8cb56e` | `docs/games/selection-engine.md` |

**Checks:** lint, `npm test` and the build pass. Its own spec is 5/5: all 15 scenes played with axe on each, the judge-only counterfactual, keyboard play, 320 px, no requests to other origins, and the embed.

**Story:** about 8 minutes, in three chapters.
- Chapter 1, proof: arithmetic, the r-count with the five-instrument rack, and the summary jam.
- Chapter 2, no proof: the revenue task with the gate, where a judge-only gate keeps junk (truth 78, judge believes 100).
- Chapter 3, a false peak: hill climbing parks at 86; GEPA's front and the DGM archive (drawn as the "I think" tree) reach 92.

**Owner questions:**
1. It drops The Proof Gate's 7th edit ("count only paid orders") so that chapter 2 peaks at 86. Should it keep the edit and reach 92?
2. The DGM parent draws are one scripted run, with computed weights; A3 has been used twice, where The Proof Gate said four times.
3. Is splitting GEPA's front into "totals" and "dates" questions OK?
4. Should the page link to TypeSafe for Jev?
5. It cites no chapter numbers; the old games cited chapters 1–4.

**Integration:**
- The tree labels are about 8.5 px at 320 px, but the round log repeats everything as text.
- The finale could link to The Instinct Engine.

### Integrated locally, not pushed

Merges `6d70cf5`, `8eca7ca` and `03b175c` brought in the three game branches. `79e2a68` then wired the games into the site, added posters, retired The Proof Gate and Helix Garden with redirects, removed Helix Garden's simulation and regression script, and updated the tests. Lab tiles are five across on wide screens.

**Checks:** lint, `npm test` and the build pass. All five spec files pass, 67/67 against a production preview.

**Local previews:**
- Integrated build: `http://127.0.0.1:4175/`
- Mockup: `http://127.0.0.1:4176/mockups/darwin-engine/`

**Next:**
1. The owner approves the mockup; then restyle the whole site with the kit.
2. Build social cards in the new look (W-60).
3. Run every check, then push to origin main once the owner says publish.

### Games restyled to the mockup's game screen (owner's request, 2026-11-01)

The owner asked game-instinct and game-selection directly to match the mockup.

| Commit | Contents |
|---|---|
| `c272928`, `0a3416a` | The Difference Engine holds back the mockup's nine cells (`05bd2f7`), with a new poster |
| `a7c1e46`, `827d2b2` | Merge of The Instinct Engine restyle (`31f8983`), with a new poster |
| `1069039` | Merge of The Selection Engine restyle (`995dd40`) |
| `96ab17c` | `demo-shell.css` zeroes the body margin on every game page, which fixes an inset header on Selection and Difference; a test checks the header is flush; both posters re-captured |

**Checks:** 67/67 against the production preview, plus lint and `npm test`.

**In progress:** site-fixes asked game-difference to match The Difference Engine to the mockup's game screen, including the wording "held back" for "covered". Once it lands: merge it, re-capture the poster with `scratchpad/posters.mjs`, then run every check.

### Owner's decisions (2026-11-01, 11:00)

1. **The mockup is approved.** Restyle the whole site with the Darwin-engine kit. The work goes on branch `design/darwin-engine` in worktree `C:\Users\Micheal\website-restyle`, branched from release, so it stays out of the games publish.
2. **Publish once The Difference Engine merges.** Push `release/site-2026-11` to origin main, watch the run, check the live site, then report to primary. The site restyle ships in a later publish.

### Games publish (2026-11-01)

**Merged:**
- `736a866`: The Difference Engine restyle (`2097587`). The mockup's board layout and "held back" wording; 9 of its own tests.
- `318bda4`: its poster, re-captured.

**Checks:** 68/68 against the production preview, plus lint and `npm test`.

**`GAMES-BRIEF.md` is no longer tracked.** It quotes the owner's request verbatim and describes the ideas of an unpublished book, so it stays a local file in this worktree and out of the public repo. The games' design notes in `docs/games/` describe only the games, so they ship.
