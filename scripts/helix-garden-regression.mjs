// Regression check for the Helix Garden simulation (public/demos/Helix_Garden/sim.js).
// Run with: node scripts/helix-garden-regression.mjs
// Fails (exit 1) if any canonical trial result drifts from the shipped story.
import '../public/demos/Helix_Garden/sim.js'
const S = globalThis.HelixSim
const run = (t, se, si, g) => Math.round(S.headless(t, { search: se, signal: si }, g).champion.trueScore)

const CASES = [
  ['meadow', 'hill', 'both', 18, (v) => v >= 40, 'T1: hill reaches the goal (>=40)'],
  ['valley', 'hill', 'both', 40, (v) => v < 60, 'T2: hill stalls short of the ridge (<60)'],
  ['valley', 'pop', 'both', 40, (v) => v >= 110, 'T2: population crosses (>=110)'],
  ['mirage', 'pop', 'both', 50, (v) => v < 90, 'T3: population converges on the mirage (<90)'],
  ['mirage', 'archive', 'both', 50, (v) => v >= 120, 'T3: archive recovers (>=120)'],
]
let ok = true
for (const [t, se, si, g, test, label] of CASES) {
  const v = run(t, se, si, g)
  const pass = test(v)
  ok = ok && pass
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + label + ' -> ' + v)
}
const j = S.headless('meadow', { search: 'hill', signal: 'judge' }, 18)
const last = j.history[j.history.length - 1]
const gap = last.bestSignal / Math.max(j.champion.trueScore, 1)
const pass = gap > 1.6
ok = ok && pass
console.log((pass ? 'PASS' : 'FAIL') + '  judge-only inflation visible (judged/true > 1.6) -> ' + gap.toFixed(2))
process.exit(ok ? 0 : 1)
