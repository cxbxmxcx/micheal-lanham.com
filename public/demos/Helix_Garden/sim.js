/* ============================================================
   Helix Garden — simulation core.
   Pure logic, no DOM: runs in the browser page and headless in
   Node for tuning/tests. The UI (index.html) renders on top.

   Two nested loops:
   - Inner (per creature, per tick): SENSE -> PLAN -> ACT -> LEARN.
     The "brain" (this file's fixed code) never changes; behaviour
     comes from the creature's POLICY CARD (L1 artifact) and its
     in-life MEMORY (L2).
   - Outer (the harness, per generation): ACT -> SIGNAL -> SEARCH
     -> APPLY, with promote() as the deploy gate.
   ============================================================ */
(function (root) {
  'use strict'

  /* ---------- seeded RNG (mulberry32) ---------- */
  function rng(seed) {
    let a = seed >>> 0
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  const TAU = Math.PI * 2
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
  function angTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax) }
  function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d }
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay)

  /* ---------- world ---------- */
  const W = 960, H = 560
  const LIFE_TICKS = 1400
  const EAT_R = 12
  const GROVE_REGROW = 170

  /* Trials. Each returns a fresh world layout; deterministic per trial. */
  function scatter(r, cx, cy, spread, n, v, tag) {
    const out = []
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * spread
      out.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, v, tag })
    }
    return out
  }

  const TRIALS = {
    /* T1 — open meadow: the loop and the ratchet, working. */
    meadow: {
      key: 'meadow', name: 'Trial 1 · The Ratchet', goal: 40, gens: 18, seed: 61,
      blurb: 'An open meadow. Hill-climbing should ratchet the policy card up to the goal.',
      build() {
        const r = rng(101)
        let foods = []
        foods = foods.concat(scatter(r, 300, 280, 150, 26, 1, 'near'))
        foods = foods.concat(scatter(r, 620, 180, 120, 20, 1, 'near'))
        foods = foods.concat(scatter(r, 640, 430, 120, 20, 1, 'near'))
        return { foods, hazards: [], spawn: { x: 180, y: 280 } }
      },
    },
    /* T2 — the valley: a modest patch near home, a rich field across a
       hazard ridge. Single-lineage ratchets park on the near patch. */
    valley: {
      key: 'valley', name: 'Trial 2 · The Valley', goal: 110, gens: 40, seed: 5,
      blurb: 'A safe patch near home; a far field across a ridge. The ratchet parks on the near peak.',
      build() {
        const r = rng(202)
        let foods = []
        foods = foods.concat(scatter(r, 130, 300, 95, 24, 1, 'near'))      // near patch: caps ~24
        foods = foods.concat(scatter(r, 760, 280, 150, 46, 3, 'far'))      // far field: rich
        const hazards = []
        for (let y = 30; y < H - 10; y += 104) hazards.push({ x: 440, y, r: 46, dps: 0.85 })
        for (let y = 82; y < H - 10; y += 104) hazards.push({ x: 512, y, r: 46, dps: 0.85 })
        return { foods, hazards, spawn: { x: 120, y: 300 } }
      },
    },
    /* T3 — the mirage: a dense field that permanently depletes and a sparse,
       regenerating grove. Populations converge on the mirage; the archive can
       reach back to an early grove-touching branch. */
    mirage: {
      key: 'mirage', name: 'Trial 3 · The Mirage', goal: 120, gens: 50, seed: 42,
      blurb: 'A dense field that runs dry mid-life; a sparse grove that regrows. Convergence is the trap.',
      build() {
        const r = rng(303)
        let foods = []
        foods = foods.concat(scatter(r, 300, 280, 170, 60, 1, 'mirage'))   // plentiful, non-renewing
        foods = foods.concat(scatter(r, 800, 120, 100, 12, 7, 'grove'))    // sparse, renewing, rich, far corner
        const hazards = [{ x: 640, y: 330, r: 90, dps: 0.9 }, { x: 560, y: 90, r: 66, dps: 0.9 }]
        return { foods, hazards, spawn: { x: 150, y: 430 } }
      },
    },
    sandbox: {
      key: 'sandbox', name: 'Sandbox', goal: Infinity, gens: Infinity, seed: 44,
      blurb: 'No goal. Every dial exposed. Watch what the loop does with what you give it.',
      build() { return TRIALS.valley.build() },
    },
  }

  /* ---------- the policy card: the L1 artifact ---------- */
  /* A genome is a readable rule card plus three body traits. Everything the
     harness evolves lives here; agent.step() below never changes. */
  function genesisGenome() {
    return {
      rules: {
        seek:    { on: true,  w: 0.6 },              // IF food sensed  -> approach
        avoid:   { on: true,  w: 0.9, thr: 120 },    // IF hazard < thr -> flee
        explore: { on: true,  w: 0.4, bias: 0 },     // ELSE wander (biased)
        gofar:   { on: false, w: 0.3 },              // push away from home
        memory:  { on: true,  w: 0.5 },              // no food? return to remembered cluster
        rest:    { on: false, thr: 25 },             // IF energy < thr -> slow down
      },
      traits: { speed: 1.1, sense: 110, hazsense: 110 },
    }
  }
  const cloneGenome = (g) => JSON.parse(JSON.stringify(g))

  const NUMERIC = [
    ['rules.seek.w', 0, 1.6], ['rules.avoid.w', 0, 1.6], ['rules.avoid.thr', 30, 200],
    ['rules.explore.w', 0, 1.2], ['rules.explore.bias', -Math.PI, Math.PI],
    ['rules.gofar.w', 0, 1.6], ['rules.memory.w', 0, 1.2], ['rules.rest.thr', 5, 60],
    ['traits.speed', 0.6, 2.3], ['traits.sense', 60, 210], ['traits.hazsense', 40, 190],
  ]
  const TOGGLES = ['rules.seek.on', 'rules.avoid.on', 'rules.explore.on', 'rules.gofar.on', 'rules.memory.on', 'rules.rest.on']
  function getPath(o, p) { return p.split('.').reduce((a, k) => a[k], o) }
  function setPath(o, p, v) { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v }

  /* Mutation. `guide` (from reflection) lists paths to hit harder; `temp`
     anneals: wide early steps seed diversity, later steps refine. */
  function mutate(g, r, guide, temp) {
    const T = temp || 1
    const child = cloneGenome(g)
    const strong = new Set(guide || [])
    const nEdits = 1 + Math.floor(r() * 2) + (strong.size ? 1 : 0)
    for (let i = 0; i < nEdits; i++) {
      if (r() < 0.14 * T) {
        const t = TOGGLES[Math.floor(r() * TOGGLES.length)]
        setPath(child, t, !getPath(child, t))
      } else {
        let pick
        if (strong.size && r() < 0.65) {
          const arr = [...strong]
          pick = NUMERIC.find(([p]) => p === arr[Math.floor(r() * arr.length)]) || NUMERIC[Math.floor(r() * NUMERIC.length)]
        } else pick = NUMERIC[Math.floor(r() * NUMERIC.length)]
        const [p, lo, hi] = pick
        const span = hi - lo
        const step = (r() - 0.5) * span * (strong.has(p) ? 0.5 : 0.22) * T
        setPath(child, p, clamp(getPath(child, p) + step, lo, hi))
      }
    }
    return child
  }

  function crossover(a, b, r) {
    const child = cloneGenome(a)
    for (const key of Object.keys(child.rules)) if (r() < 0.5) child.rules[key] = JSON.parse(JSON.stringify(b.rules[key]))
    for (const key of Object.keys(child.traits)) if (r() < 0.5) child.traits[key] = b.traits[key]
    return child
  }

  /* ---------- one life: the SPAL inner loop ---------- */
  function makeAgent(genome, world, seed) {
    return {
      genome, r: rng(seed),
      x: world.spawn.x + (rng(seed + 7)() - 0.5) * 30,
      y: world.spawn.y + (rng(seed + 13)() - 0.5) * 30,
      heading: rng(seed + 3)() * TAU,
      energy: 100, alive: true, score: 0,
      eaten: new Map(),                         // per-agent food state: index -> tick eaten (ghost worlds)
      memory: { hazards: [], cluster: null },   // L2: in-life memory
      telem: { dist: 0, hazardHits: 0, starveTicks: 0, maxR: 0, farFood: 0, nearFood: 0, groveVisits: 0 },
      last: { sense: null, plan: null, act: null, learn: null }, // inspector taps
    }
  }

  function agentStep(a, world, tick) {
    if (!a.alive) return
    const g = a.genome, rules = g.rules, traits = g.traits

    /* --- SENSE --- */
    let food = null, fd = Infinity
    for (let i = 0; i < world.foods.length; i++) {
      const f = world.foods[i]
      if (a.eaten.has(i)) {
        /* the grove regrows after a rest; everything else is gone for good */
        if (f.tag !== 'grove' || tick - a.eaten.get(i) < GROVE_REGROW) continue
      }
      const d = dist(a.x, a.y, f.x, f.y)
      if (d < fd) { fd = d; food = { i, f, d } }
    }
    let haz = null, hd = Infinity
    for (const h of world.hazards) {
      const d = dist(a.x, a.y, h.x, h.y) - h.r
      if (d < hd) { hd = d; haz = h }
    }
    const sense = {
      food: food && fd <= traits.sense ? { d: fd, ang: angTo(a.x, a.y, food.f.x, food.f.y) } : null,
      hazard: haz && hd <= traits.hazsense ? { d: hd, ang: angTo(a.x, a.y, haz.x, haz.y) } : null,
      energy: a.energy,
    }
    a.last.sense = sense

    /* --- PLAN: weighted vote of the policy card's active rules --- */
    let vx = 0, vy = 0
    const votes = []
    const cast = (name, ang, w) => { vx += Math.cos(ang) * w; vy += Math.sin(ang) * w; votes.push({ name, w }) }
    if (rules.seek.on && sense.food) cast('seek-food', sense.food.ang, rules.seek.w * (1 - fd / (traits.sense * 1.4)))
    if (rules.avoid.on && sense.hazard && sense.hazard.d < rules.avoid.thr)
      cast('avoid-hazard', sense.hazard.ang + Math.PI, rules.avoid.w * (1 - Math.max(sense.hazard.d, 0) / rules.avoid.thr))
    for (const m of a.memory.hazards) {
      const d = dist(a.x, a.y, m.x, m.y)
      if (rules.avoid.on && d < 90) cast('memory-hazard', angTo(a.x, a.y, m.x, m.y) + Math.PI, 0.5 * (1 - d / 90))
    }
    if (rules.memory.on && !sense.food && a.memory.cluster) {
      const md = dist(a.x, a.y, a.memory.cluster.x, a.memory.cluster.y)
      if (md < 34) { a.memory.cluster = null; a.clearedNote = 'stale memory cleared' }
      else cast('memory-cluster', angTo(a.x, a.y, a.memory.cluster.x, a.memory.cluster.y), rules.memory.w)
    }
    if (rules.gofar.on) cast('go-far', angTo(world.spawn.x, world.spawn.y, a.x, a.y), rules.gofar.w * 0.85)
    if (rules.explore.on && !sense.food) {
      a.wander = (a.wander == null ? a.heading : a.wander) + (a.r() - 0.5) * 0.7
      cast('explore', a.wander + rules.explore.bias, rules.explore.w * 0.6)
    }
    let target = a.heading
    if (vx || vy) target = Math.atan2(vy, vx)
    const top = votes.slice().sort((p, q) => q.w - p.w)[0]
    a.last.plan = { intent: top ? top.name : 'drift', votes }

    /* --- ACT --- */
    const turn = clamp(angDiff(a.heading, target), -0.3, 0.3)
    a.heading += turn
    let sp = traits.speed
    if (rules.rest.on && a.energy < rules.rest.thr) sp *= 0.45
    a.x = clamp(a.x + Math.cos(a.heading) * sp, 6, W - 6)
    a.y = clamp(a.y + Math.sin(a.heading) * sp, 6, H - 6)
    a.telem.dist += sp
    a.telem.maxR = Math.max(a.telem.maxR, dist(a.x, a.y, world.spawn.x, world.spawn.y))
    a.last.act = { turn, speed: sp }

    /* metabolism: living costs energy; long senses cost more */
    a.energy -= 0.055 + sp * 0.02 + traits.sense * 0.00022
    let learned = null

    /* hazards bite */
    if (haz && hd < 0) {
      a.energy -= haz.dps
      a.telem.hazardHits++
      if (a.r() < 0.25) {
        a.memory.hazards.push({ x: a.x, y: a.y })
        if (a.memory.hazards.length > 4) a.memory.hazards.shift()
        learned = 'hazard noted'
      }
    }

    /* --- eat + LEARN --- */
    if (food && fd < EAT_R) {
      a.eaten.set(food.i, tick)
      a.score += food.f.v
      a.energy = Math.min(a.energy + 9 + food.f.v * 2.2, 130)
      if (food.f.tag === 'far') a.telem.farFood++
      else if (food.f.tag === 'grove') a.telem.groveVisits++
      else a.telem.nearFood++
      a.memory.cluster = { x: a.x, y: a.y }
      learned = 'cluster remembered'
    }
    if (a.energy < 20) a.telem.starveTicks++
    if (a.energy <= 0) { a.alive = false; a.telem.cause = a.telem.hazardHits > 6 ? 'hazard' : 'starved' }
    a.last.learn = { note: learned || a.clearedNote || null, memBits: a.memory.hazards.length + (a.memory.cluster ? 1 : 0) }
    a.clearedNote = null
  }

  /* run one full life headlessly */
  function evaluate(genome, world, seed) {
    const a = makeAgent(genome, world, seed)
    for (let t = 0; t < LIFE_TICKS && a.alive; t++) agentStep(a, world, t)
    return { trueScore: a.score, telem: a.telem, survived: a.alive }
  }

  /* ---------- SIGNALS: how the harness measures the gap ---------- */
  /* judge: available for every run, but noisy and biased toward busy-looking
     lives (the "longer answer" bias). gt: precise, but availability costs —
     in gt mode the harness can afford fewer candidates per generation. */
  const SIGNALS = {
    judge: {
      key: 'judge', label: 'LLM-as-Judge', popCap: 12,
      score(res, r) { return Math.max(0, res.trueScore * (1 + (r() - 0.5) * 0.8) + res.telem.dist * 0.028) },
    },
    gt: {
      key: 'gt', label: 'Ground truth', popCap: 6,
      score(res) { return res.trueScore },
    },
    both: {
      key: 'both', label: 'Judge + GT top-4', popCap: 12,
      score(res, r) { return Math.max(0, res.trueScore * (1 + (r() - 0.5) * 0.8) + res.telem.dist * 0.028) },
      rerank: true, // ground-truth the judge's top 4 before selection
    },
  }

  /* reflection: read the trajectory, name the gap, guide the mutation */
  function reflect(res) {
    const t = res.telem, guide = []
    if (t.cause === 'hazard' || t.hazardHits > 4) guide.push('rules.avoid.w', 'rules.avoid.thr')
    if (t.cause === 'starved' && t.dist < 350) guide.push('rules.explore.w', 'traits.speed')
    if (t.farFood === 0 && t.groveVisits === 0 && t.maxR < 460) guide.push('rules.gofar.w', 'traits.sense', 'rules.explore.bias')
    if (t.starveTicks > 220) guide.push('rules.rest.thr', 'traits.speed')
    if (t.groveVisits > 0 && res.trueScore < 160) guide.push('rules.memory.w', 'traits.sense', 'rules.seek.w', 'rules.gofar.w', 'rules.explore.bias')
    return guide
  }

  /* ---------- SEARCHES ---------- */
  /* Each returns the candidate genomes for the next generation, given the
     archive. All are (parents -> children); selection happens in the loop. */
  const SEARCHES = {
    hill: {
      key: 'hill', label: 'Hill-climb (1+λ)',
      propose(harness, n, r) {
        const champ = harness.champion
        const T = harness.gen < 2 ? 2.1 : 1
        const out = [{ genome: cloneGenome(champ.genome), parent: champ.id, note: 'champion (re-run)' }]
        for (let i = 1; i < n; i++) out.push({ genome: mutate(champ.genome, r, harness.reflection ? champ.guide : null, T), parent: champ.id, note: 'mutation of champion' })
        return out
      },
    },
    pop: {
      key: 'pop', label: 'Population (GEPA-style)',
      propose(harness, n, r) {
        const ranked = harness.lastRanked && harness.lastRanked.length ? harness.lastRanked : [harness.champion]
        const parents = ranked.slice(0, 4)
        const out = []
        out.push({ genome: cloneGenome(harness.champion.genome), parent: harness.champion.id, note: 'champion (re-run)' })
        if (parents.length >= 2) out.push({ genome: crossover(parents[0].genome, parents[1].genome, r), parent: parents[0].id, note: 'crossover of top two' })
        const T = harness.gen < 2 ? 2.1 : 1
        let i = 0
        while (out.length < n) {
          const p = parents[i % parents.length]
          out.push({ genome: mutate(p.genome, r, harness.reflection ? p.guide : null, T), parent: p.id, note: 'mutation of rank ' + ((i % parents.length) + 1) })
          i++
        }
        return out
      },
    },
    archive: {
      key: 'archive', label: 'Archive + QD (DGM-style)',
      propose(harness, n, r) {
        const arc = harness.archive
        /* quality-diversity: a high score attracts, each use halves the weight,
           and neglect lets a taxed branch earn its turns back */
        for (const e of arc) e.uses = (e.uses || 0) * 0.7
        const weight = (e) => Math.max(e.signalScore, 1) / Math.pow(2, e.uses || 0)
        const pick = () => {
          let best = null, bw = -1
          for (const e of arc) { const w0 = weight(e) * (0.7 + r() * 0.6); if (w0 > bw) { bw = w0; best = e } }
          best.uses = (best.uses || 0) + 1
          /* measure on selection: the first time a branch is chosen, its claimed
             score is re-measured for real — the DGM's evidence gate */
          if (!best.grounded && best.trueScore != null) { best.signalScore = best.trueScore; best.grounded = true }
          return best
        }
        const out = [{ genome: cloneGenome(harness.champion.genome), parent: harness.champion.id, note: 'champion (re-run)' }]
        if (arc.length > 3) {
          const a = pick(), b = pick()
          out.push({ genome: crossover(a.genome, b.genome, r), parent: a.id, note: 'archive crossover #' + a.id + ' × #' + b.id })
        }
        const T = harness.gen < 2 ? 2.1 : 1
        while (out.length < n) {
          const p = pick()
          out.push({ genome: mutate(p.genome, r, harness.reflection ? p.guide : null, T), parent: p.id, note: 'branched from archive #' + p.id })
        }
        return out
      },
    },
  }

  /* ---------- THE OUTER LOOP: act -> signal -> search -> apply ---------- */
  function makeHarness(trialKey, opts) {
    const trial = TRIALS[trialKey]
    const world = trial.build()
    const o = Object.assign({ search: 'hill', signal: 'both', reflection: true, autoGate: true, seed: trial.seed }, opts)
    const genesis = { id: 0, parent: null, genome: genesisGenome(), note: 'genesis (handwritten)', gen: 0 }
    const h = {
      trial, world, opts: o,
      gen: 0, nextId: 1,
      search: o.search, signal: o.signal, reflection: o.reflection, autoGate: o.autoGate,
      champion: genesis, archive: [genesis], lastRanked: [],
      history: [], pending: null,
      r: rng(o.seed * 7919 + 17),
    }
    /* score the genesis so the archive has a ranked root */
    const res = evaluate(genesis.genome, world, o.seed * 1013 + 77) /* same life seed as all candidates */
    genesis.trueScore = res.trueScore
    genesis.signalScore = res.trueScore
    genesis.guide = reflect(res)
    h.champion = genesis
    return h
  }

  /* Phase 1: SEARCH proposes the generation's candidates. The caller then
     runs each life (animated in the page, or evaluate() headlessly) and hands
     the results to finishGeneration. */
  function beginGeneration(h) {
    const sig = SIGNALS[h.signal]
    const candidates = SEARCHES[h.search].propose(h, sig.popCap, h.r)
    h.gen++
    const lifeSeed = h.opts.seed * 1013 + 77 /* fixed per trial: fair comparison */
    for (const c of candidates) { c.id = h.nextId++; c.gen = h.gen }
    return { candidates, lifeSeed }
  }

  /* Phase 2: SIGNAL scores the lived results, the ranking forms, and the
     APPLY gate proposes (or auto-promotes) a champion. */
  function finishGeneration(h, candidates) {
    const sig = SIGNALS[h.signal]
    for (const c of candidates) {
      c.trueScore = c.res.trueScore
      c.signalScore = sig.score(c.res, h.r)
      c.guide = reflect(c.res)
    }
    let ranked
    for (const c of candidates) c.judgeScore = c.signalScore /* pre-grounding opinion, for the chart */
    if (sig.rerank) {
      const byJudge = candidates.slice().sort((a, b) => b.signalScore - a.signalScore)
      const short = byJudge.slice(0, 4), rest = byJudge.slice(4)
      for (const c of short) { c.signalScore = c.trueScore; c.grounded = true } /* ground-truth the shortlist */
      short.sort((a, b) => b.signalScore - a.signalScore)
      ranked = short.concat(rest)
    } else {
      ranked = candidates.slice().sort((a, b) => b.signalScore - a.signalScore)
    }
    h.lastRanked = ranked
    for (const c of candidates) if (c.note !== 'champion (re-run)') h.archive.push(c)

    /* SEARCH bred the candidates; the APPLY gate always ratchets: only a
       candidate the signal scores above the deployed champion is proposed.
       If the signal dial changed since the champion shipped, its stored score
       is on the wrong scale — re-baseline from this generation's re-run. */
    if (h.champion.signalMode !== undefined && h.champion.signalMode !== h.signal) {
      const rerun = candidates.find((c) => c.note === 'champion (re-run)')
      if (rerun) {
        h.champion.signalScore = sig.rerank && !rerun.grounded ? rerun.trueScore : rerun.signalScore
        h.champion.signalMode = h.signal
      }
    }
    const bar = h.champion.signalScore ?? h.champion.trueScore ?? -1
    /* in rerank mode only ground-truthed candidates may claim the bar —
       otherwise a judge-inflated score ships and poisons the ratchet */
    const pool = sig.rerank ? ranked.filter((c) => c.grounded) : ranked
    const proposed = pool.find((c) => c.note !== 'champion (re-run)' && c.signalScore > bar) || null
    h.pending = proposed
    let bestTrue = -Infinity, bestJudge = -Infinity
    for (const c of candidates) {
      if (c.trueScore > bestTrue) bestTrue = c.trueScore
      const j = c.judgeScore ?? c.signalScore
      if (j > bestJudge) bestJudge = j
    }
    h.history.push({
      gen: h.gen,
      bestTrue,
      bestSignal: bestJudge,
      championTrue: h.champion.trueScore,
    })
    if (h.autoGate && proposed) promote(h)
    return { ranked, proposed: h.pending }
  }

  /* headless convenience: both phases with evaluate() as the life-runner */
  function runGeneration(h) {
    const { candidates, lifeSeed } = beginGeneration(h)
    for (const c of candidates) c.res = evaluate(c.genome, h.world, lifeSeed)
    return finishGeneration(h, candidates)
  }

  function promote(h) {
    if (!h.pending) return false
    h.champion = h.pending
    h.champion.signalMode = h.signal
    h.pending = null
    /* the deployed line reflects this generation whether the gate was manual or auto */
    const last = h.history[h.history.length - 1]
    if (last && last.gen === h.gen) last.championTrue = h.champion.trueScore
    return true
  }
  function rejectPending(h) { h.pending = null }

  /* headless experiment: run G generations, return the history */
  function headless(trialKey, opts, gens) {
    const h = makeHarness(trialKey, opts)
    for (let i = 0; i < gens; i++) runGeneration(h)
    return { history: h.history, champion: h.champion, archiveSize: h.archive.length }
  }

  root.HelixSim = {
    W, H, LIFE_TICKS, GROVE_REGROW, TRIALS, SIGNALS, SEARCHES,
    rng, genesisGenome, mutate, crossover, reflect,
    makeAgent, agentStep, evaluate, makeHarness, beginGeneration, finishGeneration, runGeneration, promote, rejectPending, headless,
  }
})(typeof window !== 'undefined' ? window : globalThis)
