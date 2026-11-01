# The Selection Engine

A browser concept game for *Self-Improving Agents* (Manning, in early access). It replaces The Proof Gate and Helix Garden.

- **Page:** `public/demos/Selection_Engine/index.html`, with the game in `game.js`.
- **Slug:** `selection-engine`.
- **Tests:** `tests/selection-engine.spec.ts`.
- **Style:** the Darwin engine kit, `public/demos/kit/darwin-engine.css`. The page adds only layout CSS.
- **Length:** about 6 to 10 minutes. It is deterministic, with no model calls and no network requests.

## Look

The game follows the owner's mockup (`mockups/darwin-engine/index.html` on `release/site-2026-11`):
- **Paper for reading.** Scene headings and prose sit straight on the notebook paper, at the mockup's game-screen heading size.
- **Specimen labels.** Each claim and proposed edit sits on a specimen card with a pinned `de-label`. The intro and finale label the four parts "Part 1" to "Part 4". The chart and the tree are captioned as plates: "Plate I · trust against availability" and "Plate II · the family of cards".
- **Brass bezels for machines.** The engine panel carries the mockup's Selection Engine emblem and a "Self-Improving Agents" kicker.
- **The mockup's game-screen board.** Instrument scenes and search runs use its layout: the machine on the left (the instrument rack, or the tree plate), and a gearbox column on the right with cyan gauges in an iron panel, the controls and a muted note. Below 860 px the board stacks into one column.
- **Lab cards for searches.** Chapter 3's three searches are engine cards like the mockup's laboratory: emblem, kicker, name, description, the last run's result as a gauge, and a brass button.
- **Iron instruments.** The GEPA front and the DGM archive table are iron panels, with brass headers and cyan chances.

## Learning goals

A player who has not read the book should leave knowing that a system needs four parts to improve itself:

1. **Good:** a definition of what a good answer is.
2. **Signal:** a measurement of the gap to good. Signals differ in cost, noise and bias:
   - proof is certain and free, but only exists for computable checks;
   - ground-truth labels are exact, but costly and scarce;
   - LLM-as-Judge is cheap and always available, but noisy and biased toward confident, busy answers;
   - Jev-as-Judge gives a typed yes/no with a probability. It is strong on narrow checks and blind outside them;
   - reflection names the problem in words, with no number.
3. **Search:** a way to turn the gap into better variants. Hill climbing parks on local peaks. GEPA's front and the Darwin Gödel Machine's archive keep the odd branch that leads past them.
4. **Gate:** a rule for what ships. It ships only on a better measured score, and keeps what it rejects.

They should also leave knowing two more things:
- a checker has to be checked before it is trusted;
- a loop climbs only as high as its signal can see.

## Scene flow

The **engine panel** stays at the top of the stage. It shows:
- the four parts as stations, each marked *not yet*, *working now* or *in place*, in text as well as colour;
- the chapter chips;
- gauges for each chapter, such as deployed quality, labels and critiques left, the search method and the round.

| Scene | What the player does | What it teaches |
|---|---|---|
| `intro` | Reads the four parts. | The frame for the whole game. |
| `c1-good` | Picks a definition of good for "1 + 1 + 1". The two wrong picks explain why and leave focus in place. | Good comes first. |
| `c1-proof` | Sees the proof and the gate opening. | When good is computable, proof measures the gap. |
| `c1-count` | Reads any of five instruments on "8 r's", then keeps or rejects the answer. | Each signal has its own cost, noise and bias. |
| `c1-count-result` | Sees a table of what each instrument said. The judge was fooled, and the proof was free and certain. | Proof is the best signal when it exists. |
| `c1-sum` | Reads instruments on a five-word summary, then gates it. Proof jams. | The verifiability line. |
| `c1-sum-result` | Reads the debrief. | Measure rather than prove, search rather than solve. |
| `c2-task` | Meets the revenue question and its six hidden rules: the $508 leaderboard against the $358 truth. | Good means the canonical pipeline's answer. |
| `c2-check` | Checks the checker: genesis scores 63 and the oracle 100. | Validate a checker before trusting it. |
| `c2-version` ×6 | Gates six proposed edits, one at a time. Has three labels, two critiques, a free judge and Jev. | Combining signals, and being the gate. |
| `c2-result` | Sees each edit's true effect. | Feedback on each call. |
| `c2-debrief` | Compares their gate with a judge-only gate, and sees the trust-against-availability chart. | A judge can be gamed. The signal ceiling. |
| `c3-intro` | Picks a search: hill climbing, GEPA or the Darwin Gödel Machine. | The engine runs without the player. |
| `c3-run` | Steps through rounds, or runs to the end. The archive tree grows in the style of Darwin's 1837 "I think" sketch. | Ratchet, front and archive. |
| `end` | Reads the four parts with their book terms, then follows the book link or plays again. | The order of the parts matters. |

Chapter 3 needs at least one search that passes 86 before "See the whole engine" appears. Every search can be rerun, and a comparison line shows each one's result.

## Mechanics and numbers

Every number is fixed and consistent across scenes.

### Chapter 1

The line is "strawberry fields are forever and ever". It has 7 r's.
- The judge's reading is "9/10", which is wrong.
- Jev reads `count_is_correct: no · p 0.93`.
- For the summary, Jev answers only the five-word check and declines to judge quality.

### Chapter 2

The stream comes from The Proof Gate's Act 2, without its seventh edit ("count only paid orders"). That keeps the best result at 86, the same peak where chapter 3's ratchet parks.

| Edit | True change | Judge's error | Jev: changes which orders count? |
|---|---|---|---|
| v1 refunds | +8 | +5 | yes, p 0.97 |
| v2 executive summary | 0 | +18 | no, p 0.98 |
| v3 cancelled/returned | +9 | −2 | yes, p 0.96 |
| v4 restate question | 0 | +11 | no, p 0.97 |
| v5 internal channel | +6 | +7 | yes, p 0.95 |
| v6 drop refunds | −8 | +9 | yes, p 0.94 |

- v6 only appears if the refund rule is deployed.
- The judge's reading is the deployed score plus the true change plus the judge's error, clamped to the range 1–100.
- A gate run by the judge alone keeps all six edits. Its truth is 78, while the judge believes 126, shown as 100, pinned at the top.
- Jev filters out the junk but cannot see direction, which is why v6 needs a label or a critique.

### Chapter 3

The scores come from The Proof Gate's Act 3:
- genesis 63;
- A1 71, A2 80 and A3 86;
- A4 84, A5 85 and A6 86;
- B1 55 (the dated checklist), B2 70 (the 2026-Q1 window on line 1) and B3 92 (carries the A-line's rules).

The three searches:
- **Hill climbing:** 7 rounds. It throws B1 away in round 4 and parks at 86.
- **GEPA:** 6 rounds. Its front is the set of cards that are each best on part of the task, either the totals questions or the date questions. B1 joins the front for its date answers. Reflection's critique writes each next change, and B3 wins on both parts.
- **Darwin Gödel Machine:** 8 rounds. It keeps every card. The parent weight is score ÷ 2^uses, and the table shows each card's weight and chance before every round. The draws are authored, one plausible run, and the page says so. B1's chance is 18% when it is drawn and B2's is 20%.

## Book-term mapping

Plain language comes first in the game. The book terms appear as small "Book term" annotations.

| In the game | Book term |
|---|---|
| What counts as good? | definition of good |
| How far short is it? | signal |
| A truth you can compute | proof |
| A person checks | ground-truth labels |
| The free judge | LLM-as-Judge |
| Jev, a typed yes/no with p | Jev-as-Judge (TypeSafe) |
| The critic | reflection |
| Below the line where proof works | verifiability line |
| None is enough alone | signal ceiling |
| Keep-if-better | hill climbing, the ratchet |
| A front of specialists, with critique-written changes | GEPA (genetic-Pareto) |
| Keep everything, and taxed reuse | Darwin Gödel Machine, quality-diversity sampling |
| Ship only on a better measured score | evidence gate |

## Accessibility

- Every control is a native button of at least 44 px, from kit `de-btn` and `de-btn-ghost`.
- When a step replaces the focused control, focus moves to the new `h2`. Reading an instrument keeps focus on its button, which becomes "Read *name* again".
- Results go to a polite live region (`#status`).
- Meaning never rides on colour alone: ✓, ✕, ✗, ◆ and text labels carry every state.
- The two charts are inline SVG with a text alternative: a `figcaption`, or an `aria-label` that lists every card and its fate. The round log repeats the tree as text.
- There are no animations to wait for. Rounds advance only on a button press, and the kit turns off the meter transition under `prefers-reduced-motion`.
- There is no horizontal scroll at 320 px. Tables are kept to four columns or fewer.

## Test hook

`window.__selection` provides:
- `state()`: the current scene, chapter, parts in place and the state of each chapter;
- `actions()`: the ids of the enabled buttons in the scene;
- `click(id)`: presses a button in the scene;
- `start(chapter)`: resets and jumps to chapter 1–3, or 4 for the finale;
- `judgeOnly()`: the judge-only counterfactual.

## Open questions for the owner

1. **Dropping the paid-orders edit.** Chapter 2 drops The Proof Gate's seventh edit ("count only paid orders", +6), so chapter 2's best (86) matches chapter 3's peak. Is that acceptable, or should chapter 2 keep it and reach 92?
2. **The DGM parent draws are authored.** The weights and chances are computed from score ÷ 2^uses, but the draws themselves are scripted to show one plausible run, and the page says so. In The Proof Gate, A3 had been "used four times"; here, at the moment B1 is drawn, A3 has been used twice. Is that simplification acceptable?
3. **GEPA's "parts of the task".** The game splits the eval questions into totals questions and date questions, and names which card is best on each, without per-question counts. Does that match how the book explains the Pareto front?
4. **Jev's wording.** Jev is described only as "TypeSafe's fast decision model: a typed yes or no with a probability", strong on narrow checks and blind outside them. Should TypeSafe's site be linked, or is this the right amount?
5. **Chapter numbers.** The game does not cite book chapters, because the brief forbids new chapter claims. The old games cited chapters 1–4. Should those references come back?
6. **Next game.** The finale links only to the book. Once The Instinct Engine ships, should the finale link to it, the way The Proof Gate linked to Helix Garden?
