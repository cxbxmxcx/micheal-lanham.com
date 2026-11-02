# The Difference Engine (metacognition)

- **Page:** `public/demos/Difference_Engine/index.html`, with `difference.js` (game and model) and `difference.css` (layout only; colours and type come from the kit).
- **Slug:** `difference-engine`.
- **Tests:** `tests/difference-engine.spec.ts`.
- **Test hook:** `window.__difference` (`state`, `click`, `setGears`, `grade`, `print`).
- **Length:** about 6–8 minutes.

## Learning goals

A player who has not read either book should leave able to say:

1. Working an answer out (System 2) is reliable but costs the same every time. Recall (System 1) costs one step, but only inside what has been learned.
2. A table of answers is learned memory, shared by every question of one kind. Outside its edges you are back to reasoning.
3. Learning to learn means searching for the method that writes the table. You check a candidate on cells it never saw, because a method that only memorises passes on everything it was shown.
4. A method that passes a test has only been checked on the gears the test made run. Check its output on new ground before trusting it.
5. The verified method prints a bigger table, so more of the task family becomes recall. In a harness, the table is the learned input added to a task, and metacognition is the search for and verification of the skill that writes it.

## Scene flow

| Stage | Scene | The player… | What it shows |
|---|---|---|---|
| — | Intro | reads, starts | The four stages; *metacognition* as a book-term annotation. |
| 1 Fingers | 3 + 4 | presses **Count a finger** four times (counting on from 3) | 4 steps. System 2. |
| | 4 × 3 | presses **Count a group of four** three times | 12 steps: one per finger. |
| | 4 × 3 again | counts all twelve again | Nothing was kept. 28 steps for three questions. |
| 2 The table | The table | sees the 10 × 10 | System 1 recall; the table is *learned memory*. |
| | 3 × 4, 7 × 8 | **Look it up** | 1 step each (12 and 56 by counting). |
| | 13 × 7 | **Look it up**, then **Reason it out** | No row 13. Five steps of reasoning with known rules: turn, split, add a zero, recall, add. The same rules return as gears. |
| | Summary | — | Fast inside the edges, slow outside. Where did the table come from? |
| 3 The search | The test | sees the table with 9 cells held back (the nine in the owner's mockup) | Three checks: visible cells, held-back cells, at most 150 steps. |
| | Candidate 1 | rebuilds with **Copy what you saw** | Visible 91/91, held back 0/9. Overfitting. |
| | Gear rack | toggles gear chips, tests the mechanism, reads the notebook | A free search. It advances only when all three checks pass. |
| 4 Generalise | Print | prints the 20 × 20, then checks 13 × 7, 12 × 15 and 19 × 18 by counting | A method that passed the 10 × 10 can still fail here. If it does, the player goes back to the rack with the reason. |
| | Task family | asks eight questions up to 20 × 20 | Given table: 2 recalled, 6 reasoned. Printed table: 8 recalled. |
| 5 What it means | Debrief | — | Table = shared memory; method = learning skill; search = metacognition. Link to the book page. Play again. |

The ledger (recalled, reasoned, steps answering) runs across the game and ends at 10, 4 and 43. Learning work (tests, the print, the check) is reported separately, because it is spent once.

## Layout

The game follows the owner's mockup (`mockups/darwin-engine/index.html`, "Game screen"):

- Scenes sit straight on the notebook paper, with the mockup's game-screen heading (`clamp(1.7rem, 3vw, 2.3rem)`).
- The stage 2, 3 and 4 instrument scenes use the board. On the left, the machine is an iron engine panel holding the times table (or the printed 20 × 20). On the right, a gearbox column holds:
  - the rule gears as kit chips, with their rules written out;
  - three cyan gauges: Visible cells, Held back, and Steps to rebuild (the mockup's "Turns per answer");
  - the brass **Test the mechanism** button, with **Print a 20 × 20 table** as the ghost secondary;
  - a short note.
- Below 860 px the board stacks into one column.
- Held-back cells use the mockup's `.held` hatch. Rebuilt-right cells use its cyan `.ok`. The game adds a dashed, struck-through frame for wrong cells and a dash for blank ones.
- Players see "held back" everywhere, never "covered".

## Mechanics

The engine builds an N × N table cell by cell, row by row. For each cell it tries the gears in the engine in the rack's order and uses the first that works.

| Gear | Rule | Cost | Book or maths term |
|---|---|---|---|
| Copy what you saw | copy a cell you were shown | 1 | memorising |
| Turn it around | a × b = b × a, if b × a is built | 1 | commutativity |
| Add a zero | a × 10 = a with a 0 on the end (either factor a multiple of 10) | 1 | ×10 shift |
| Double it | a × 2c = (a × c) doubled | 1 | doubling |
| Split it | a × b = a × c + a × (b − c), from two built cells (tens first when b > 10) | 1 | distributive law |
| Just add | a × b = a + b | 1 | a false rule (right only for 2 × 2) |
| Count it out | count every finger | a × b | repeated addition |

**Stage 3 test.** Rebuild the 10 × 10. Copy may use the 91 visible cells only. The 9 held-back cells match the owner's mockup (`mockups/darwin-engine/index.html`): 3×5, 4×7, 5×3, 6×8, 7×4, 8×6, 9×2, 9×9 and 10×10. Three are mirror pairs (3×5 and 5×3, 4×7 and 7×4, 6×8 and 8×6), so Turn it around cannot recover them from copied cells. A pass needs all 91 visible cells right, all 9 held-back cells right, and at most 150 steps (one and a half a cell; counting the whole table takes 3,025).

Numbers worth knowing (all computed, and covered by the tests):

- Copy alone: 91/91 visible, 0/9 held back, 91 steps.
- Copy + Count it out: right everywhere, but 472 steps. Copy + Turn + Double + Count gets down to 221. No method passes the budget without Split it: building cells from cells already built is the insight.
- Split it + Count it out: 145 steps. Turn + Split + Count: 100 steps, and 400 steps for the 20 × 20.

**Stage 4 print.** The verified 10 × 10 becomes memory and the method prints a 20 × 20. The print view shows printed cells and blanks, never right or wrong: the engine can't know until someone checks. The check counts three new cells (13 × 7, 12 × 15, 19 × 18; 613 steps).

**The second overfitting beat.** Some methods pass Stage 3 and fail here. Every one of them contains Copy + Split and no Turn it around, so the first cell of each new row comes from nowhere (no Count it out) or from Just add, which the engine tries before Count it out:

- **Copy + Split:** rows 11–20 come out blank. Inside the 10 × 10, Copy always supplied the ×1 column.
- **Copy + Split + Just add:** Just add never ran on the 10 × 10, so 11 × 1 = 12 and everything built on it is wrong.

The tests run all 127 gear combinations and confirm that each method which passes Stage 3 and then fails on the 20 × 20 also fails at least one of the three checked cells.

## Book-term mapping

Plain language comes first. Book terms appear as "Book term" annotations.

| In the game | Book term |
|---|---|
| Counting on fingers, reasoning out 13 × 7 | System 2 |
| Recalling from the table | System 1 |
| The times table | learned memory: shared, for a task family; the learned input added to a task |
| The method that rebuilds the table | the harness's learning skill |
| Searching for and verifying the method | metacognition |
| Held-back cells | held-out cells (marked "Term", not "Book term": an ML term) |
| Copy alone passing open cells | overfitting ("Term") |

The page names *The Instinctual Learning Agent Harness* (Packt, in development) and links to `/books/instinctual-learning-agent-harness/`. It quotes nothing from the book and gives no chapter numbers.

## Accessibility

- Every control is a native button. Gears are toggle chips (`aria-pressed`) with a visible ✓ when in the mechanism, and each chip is described by its written-out rule (`aria-describedby`).
- When a scene replaces the focused control, focus moves to the new `h2`. When part of a scene replaces it, focus moves to the new `h3`.
- Results go to a polite `role="status"` region.
- Right/wrong uses ✓/✗ text, strike-through, hatching, dashed and double frames, never colour alone. Every 10 × 10 is a real table with row and column headers; held-back, wrong and blank cells carry screen-reader text, and the gearbox note lists wrong and blank cells in words.
- The 20 × 20 print fades in only with `prefers-reduced-motion: no-preference`, and nothing waits on it.
- Checked at 320 px, with targets at least 44 px.

## Open questions for the owner

1. **Which book?** The game names *The Instinctual Learning Agent Harness* as its companion, because metacognition is the third harness concept you described. Should it also point to *Self-Improving Agents*, or to the other two concept games once they exist?
2. **The step budget (150).** It forces the player to find Split it (the distributive law) and is explained as "one and a half steps a cell". Keep it, loosen it, or drop it and let any correct method pass?
3. **Babbage and Darwin.** They are mentioned once, in the footnote under the game ("Darwin was a regular guest at Babbage's evening parties"). Keep, cut, or move into the intro?
4. **"Just add".** The deliberately false gear is what makes the "passed here, failed on new ground" beat possible. Is a false rule acceptable in the rack, or would you rather the second beat rest only on Copy + Split leaving rows blank?
5. **Three-cell check.** Checking three of 300 cells is enough to catch every failing method in this game (the tests prove it), but in general a sample can miss errors. Should the debrief say so?
6. **Look.** Everything uses the kit and the mockup's board (paper scenes, iron engine panels, brass buttons, chips and gauges). If the approved mockup changes the kit, the game should follow without edits. The shell's header and `h1` use Fraunces, like the rest of the site.
