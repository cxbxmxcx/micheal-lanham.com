# The Instinct Engine — design note

Concept game 2 of 3 for *The Instinctual Learning Agent Harness* (Packt, in development).

- **Folder:** `public/demos/Instinct_Engine/`
- **Slug:** `instinct-engine`
- **Files:**
  - `index.html`: the page shell, scenes and rendering.
  - `engine.js`: the deterministic simulation, with no DOM and no randomness.
  - `tests/instinct-engine.spec.ts`: the tests.

## Learning goals

A player who has not read the book should leave knowing four things:

1. **The model is frozen; the harness learns.** The language model at the centre never changes. Everything that improves is the harness around it: what the model is shown, what the harness remembers, and where it sends the work.
2. **Slow thinking can become fast thinking.**
   - System 2 (step-by-step reasoning) is slow, costly and reliable.
   - When it solves a kind of task, the harness writes down what it worked out as a memory card.
   - Next time, System 1 (a plain fast answer) reads the card and gets it right.
3. **Decisions can leave the model.** A yes-or-no decision that repeats can be compiled into Jev, a decision model:
   - It returns a typed judgment with a probability.
   - When the probability is low, it hands the case to System 2.
4. **Memories need checking.** A stale card gives fast, confident wrong answers. Signals catch it, and each one costs something:
   - a System 2 spot check;
   - a ground-truth label, here a customer complaint.

   This ties the game to the signals idea in *The Selection Engine*.

## Setting

The player runs the help desk of an invented clock-repair shop for four days, with five customer messages a day. The messages come in four kinds:

| Kind | Example | What works |
|---|---|---|
| Clock-care question | "How often should I wind an eight-day clock?" | System 1: it is common knowledge. |
| Warranty question | "Bought here 4 months ago, it stopped. Covered?" | System 2 the first time, then a memory card, then Jev. |
| Quote request | "How much to replace the mainspring?" | System 2 the first time, then a memory card. There is no Jev for this kind. |
| One-off request | "Can you fit quartz into my grandfather clock?" | Always System 2: there is nothing worth remembering. |

**The shop's rules:**
- **Warranty:** covered if bought here within 12 months and not dropped or water-damaged. The warranty follows the clock, so with no receipt the sales ledger has the date.
- **Quotes:** $40 service on every job, plus parts:
  - mainspring $25;
  - gear $12;
  - glass $18;
  - pendulum rod $30;
  - chime hammer $9.

## Routes and their costs

These are illustrative game units, not measurements. The page footnote says so.

| Route | Time | Cost | Right when |
|---|---|---|---|
| System 1 | 2 s | 1¢ | the answer is common knowledge (clock care) |
| System 2 | 30 s | 20¢ | always: it reads the current policy book and price list |
| Memory card | 2 s | 2¢ | a card exists and what it says is still true |
| Jev | 0.1 s | 0.1¢ | warranty only, after day 2. Below a probability of 0.80 it escalates to System 2, so the case costs 30.1 s and 20.1¢ in total |
| Spot check | +30 s | +20¢ | offered after a memory or Jev answer. System 2 re-solves the case and repairs any memory that disagrees |

**Learning rules,** all in `engine.js`:
- **First System 2 solve of a warranty or quote message:** the harness writes the card.
- **System 2 finds a rule the card lacked:** the harness adds it. This is the gift case on day 3.
- **System 2 disagrees with a stale card or Jev:** the harness rewrites the card and recompiles Jev under the current policy.
- **Jev:** compiled at the end of day 2 from the warranty cases seen so far, plus 120 settled claims from the shop's ledger.

## Scene flow

1. **A brass oracle that cannot learn.** Introduces the frozen model, fast and slow thinking, and the player as the harness.
2. **Four routes for every message.** Explains each route in plain words, with its time and cost.
3. **Day 1 · Everything is new.** There are no cards and no Jev.
   - System 1 is fast and wrong on the shop's own facts.
   - System 2 is right, and its solves leave memory cards behind.
4. **Day 2 · Instinct.** Cards turn yesterday's System 2 work into 2-second recall. The one-off request stays with System 2.
5. **Overnight · Compiling Jev.** Shows the typed judgment `warranty_decision { covered, probability }` and the 0.80 threshold.
6. **Day 3 · Jev.** Warranty questions skip the model.
   - The gift case (no receipt) has a probability of 0.61, so Jev escalates it to System 2.
   - The memory card answers the same case quickly and wrongly, because the card does not know what it does not know.
7. **Day 4 · The stale card.** The shop cut the warranty to 6 months overnight, and the harness was not told. From now on the player sees only what the harness sees: answers, speed and probability, but not whether each answer is right.
   - **A trusting player:** after two stale wrong answers, a complaint arrives. The harness benches the card and Jev until System 2 re-solves a warranty case.
   - **A careful player:** a spot check, or routing the first warranty case to System 2, catches the change at once.
8. **Day 4 · Closing time.** The ledger reveals the truth for the day.
9. **Debrief: the oracle never changed.**
   - Time and cost per day, compared with a well-tuned harness.
   - Four lessons.
   - A link to the book page.
   - Play again.

**Each day closes** with a ledger (route, time, cost, right or wrong), a bar of time per day so far, and a short lesson written from what the player actually did.

**The reference harness** is computed by the same engine (`InstinctEngine.simulate(idealRoute)`). It recalls what it can, reasons when it must, and spot-checks once the policy book changes. Its totals are pinned by a test:

| Day | Time | Cost |
|---|---|---|
| 1 | 94 s | 63¢ |
| 2 | 38 s | 27¢ |
| 3 | 32.4 s | 22.4¢ |
| 4 | 32.3 s | 22.3¢ |

The curve flattens rather than reaching zero. New requests, edge cases and checks stay with System 2 by design, and the debrief says so.

## Book-term mapping

The page uses plain language first. A small "Term:" label adds the book's vocabulary afterwards.

| In the game | Term |
|---|---|
| The brass oracle, frozen | the LLM, frozen |
| You, routing messages | the harness, the learner around the model |
| Answer at once / reason it out | System 1 / System 2 |
| Memory card | learned memory: System 2 work turned into System 1 work |
| Jev | moving the decision to a decision model (Jev, TypeSafe) |
| Spot check, complaint | signals: a System 2 re-solve, a ground-truth label |

## Layout

The game screen follows the owner's Darwin-engine mockup (`mockups/darwin-engine/index.html`, game screen):
- **On the paper:** a kicker naming the game, day and message, then the scene heading in Fraunces.
- **Left, the instrument:** an iron panel with the machine drawing, the conveyor belt and chips for what the harness has learned. The oracle is drawn like the mockup's Instinct Engine emblem. On wide screens the panel stays in view while the right column scrolls.
- **Right, the gearbox:** a gauges panel (day, time, cost, System 2 load, wrong), then the scene:
  - customer messages and memory cards as specimen labels;
  - the route levers in an iron panel;
  - Jev's typed judgment as gauges;
  - charts as brass-framed meters;
  - actions on the paper.
- **Below 860 px:** the board stacks into one column.

## Accessibility and testing

**Accessibility:**
- **Focus:** every control is a native button. When a step replaces the focused control, focus moves to the scene heading (`#sceneTitle`).
- **Live region:** results are announced in a polite live region (`#status`).
- **Not colour alone:** right and wrong use ✓/✗ and words.
- **Belt:** each slot has screen-reader text.
- **Closed routes:** they stay visible, with the reason printed on the button.
- **Machine drawing:** the SVG is decorative (`aria-hidden`); everything it shows is also in text.
- **Size and motion:**
  - Targets are at least 44 px.
  - There is no horizontal scroll at 320 px.
  - Nothing animates, so reduced motion has nothing to wait for.
- **Embedding:** inside the site's demo player, the page adds `.embedded`, hides the shell, and posts `unity-ready` to `window.location.origin`.
- **Test hook:** `window.__instinct` exposes `state()`, `reference()`, `ideal()` and `click(id)`.

**`tests/instinct-engine.spec.ts` covers:**
- the pinned reference numbers;
- a full keyboard playthrough, with focus checks and axe (WCAG 2.0, 2.1 and 2.2 A/AA) on every new kind of scene, and no requests to other origins;
- day 1 cards;
- the day 3 gift case, both ways;
- the day 4 trap, both through a complaint and through a spot check;
- a mouse playthrough at 320 px with reduced motion;
- the embed handshake;
- the length of the description.

## Open questions for the owner

1. **Setting.** A clock-repair help desk keeps the rules learnable in one line and fits the brass look. Would you rather use an agent task from the book, such as the revenue task?
2. **Terms.** These follow your request: harness, System 1/System 2, learned memory, moving the decision to a decision model, signals. Should any of them change to match the book's wording?
3. **Jev.** The game describes Jev only as TypeSafe's decision model that returns a typed judgment with a probability and escalates when unsure. Its speed and cost (0.1 s, 0.1¢) are game units. Is that wording acceptable, and should the page link to TypeSafe?
4. **Hidden truth on day 4.** The narrator stops showing right and wrong on day 4 so that the player feels the harness's blindness. Does that land, or is it confusing?
5. **Links.** The page does not mention *The Selection Engine* yet. Once site-fixes wires up that slug, the "Memories need checking" lesson could link to it. The book credit has no cover image, because there is none yet for this book.
6. **Length.** 20 messages plus 9 framing scenes take about 6 to 8 minutes. A shorter cut could drop day 2's one-off request and one warranty case a day.
