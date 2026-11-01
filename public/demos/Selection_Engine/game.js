/* The Selection Engine: a playable companion to Self-Improving Agents.
   Three chapters build the four parts of a self-improving machine:
   a definition of good, a signal, a search and a gate.
   Everything is authored and deterministic: no model calls, no network. */
(function () {
  'use strict'

  const $ = (id) => document.getElementById(id)
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const clamp = (v) => Math.max(1, Math.min(v, 100))
  const LINE = 'strawberry fields are forever and ever'

  /* ---------------- the four parts ---------------- */
  const PARTS = [
    { key: 'good', name: 'Good', ask: 'What counts as good?', term: 'definition of good' },
    { key: 'signal', name: 'Signal', ask: 'How far short is it?', term: 'signal' },
    { key: 'search', name: 'Search', ask: 'How do we make better versions?', term: 'search' },
    { key: 'gate', name: 'Gate', ask: 'What gets to ship?', term: 'gate' },
  ]
  const CHAPTERS = [[1, 'Proof'], [2, 'No proof'], [3, 'A false peak']]

  /* ---------------- instruments ---------------- */
  const INST = {
    proof: { name: 'Proof', cost: 'free', noise: 'none', limit: 'exists only for checks you can compute' },
    label: { name: 'Ground-truth label', cost: 'costly: a person checks', noise: 'none', limit: 'scarce' },
    judge: { name: 'LLM-as-Judge', cost: 'cheap, always on', noise: 'high', limit: 'likes confident, busy answers' },
    jev: { name: 'Jev-as-Judge', cost: 'near-free, fast', noise: 'low on its question', limit: 'blind outside narrow yes/no checks' },
    reflect: { name: 'Reflection', cost: 'one critique', noise: 'no number to be noisy', limit: 'names the problem in words; never scores' },
  }
  const INST_ORDER = ['proof', 'label', 'judge', 'jev', 'reflect']

  /* Chapter 1 readings. Every instrument is honest about what it is. */
  const C1_READ = {
    count: {
      proof: 'LINE.count("r") = 7. The claim of 8 is false. Certain.',
      label: 'A person counted by hand: 7.',
      judge: '9/10: “Clear, direct and confident.”',
      jev: 'count_is_correct: no · p 0.93',
      reflect: '“No working shown. Recount the r’s in strawberry, are, forever and ever.”',
    },
    sum: {
      proof: '∅ Nothing to compute. No formula decides whether a summary is good.',
      label: 'No label exists. One person’s reference summary would fail a different good one.',
      judge: '8/10: “Fluent and faithful.”',
      jev: 'is_five_words: yes · p 0.99. “Is it a good summary?” is not its kind of question: no judgment.',
      reflect: '“Faithful, but it drops the repetition, forever and ever, that gives the line its feeling.”',
    },
  }
  const C1_VERDICT = {
    proof: ['right', 'Certain, and free.'],
    label: ['right', 'Exact, but it cost a person’s time.'],
    judge: ['wrong', 'Fooled by a confident answer.'],
    jev: ['right', 'Right, with a probability: a narrow yes/no check is its home ground.'],
    reflect: ['hint', 'No verdict, but it pointed straight at the error.'],
  }

  /* Chapter 2: the revenue task's stream of proposed edits (from The Proof Gate,
     checked against the book). delta is the true change to the checker's score
     if kept; judge is the free judge's error on top of it. */
  const STREAM = [
    { id: 'v1', edit: '+ Subtract refunds from every line item', delta: 8, judge: 5, kind: 'good', counts: true, p: 0.97, refunds: true,
      truth: 'Real improvement. Refunds were inflating every total.',
      reflect: 'The totals still include cancelled and returned orders.' },
    { id: 'v2', edit: '+ Add a confident executive-summary paragraph', delta: 0, judge: 18, kind: 'junk', counts: false, p: 0.98,
      truth: 'The prose changed; the numbers did not. The judge loved the confidence.',
      reflect: 'The summary paragraph restates the leaderboard. No rule changed.' },
    { id: 'v3', edit: '+ Exclude cancelled and returned orders', delta: 9, judge: -2, kind: 'good', counts: true, p: 0.96,
      truth: 'Real improvement, and the judge under-rated it. Noise cuts both ways.',
      reflect: 'Internal-channel orders are still being counted as revenue.' },
    { id: 'v4', edit: '+ Restate the question before answering', delta: 0, judge: 11, kind: 'junk', counts: false, p: 0.97,
      truth: 'Politeness, not progress. Not one total moved.',
      reflect: 'The restated question changes nothing downstream.' },
    { id: 'v5', edit: '+ Exclude the internal sales channel', delta: 6, judge: 7, kind: 'good', counts: true, p: 0.95,
      truth: 'Real improvement. Internal orders are not revenue.',
      reflect: '“Last quarter” is still read as the latest month, not 2026-Q1.' },
    { id: 'v6', edit: '− Simplify: drop the refund subtraction', delta: -8, judge: 9, kind: 'regress', counts: true, p: 0.94, needsRefunds: true,
      truth: 'A regression in a clean shirt. The card got shorter, more confident, and wrong.',
      reflect: 'This removes the refund rule. Totals will inflate again.' },
  ]

  /* Chapter 3: one card family, ten versions. Scores are the validated
     checker's, from The Proof Gate's Act 3. */
  const NODES = {
    G: { score: 63, edit: 'genesis: “You are a data analyst. Answer the user’s question using the tools.”', x: 64, y: 64 },
    A1: { score: 71, edit: '+ subtract refunds', x: 104, y: 124 },
    A2: { score: 80, edit: '+ exclude cancelled and returned orders', x: 134, y: 184 },
    A3: { score: 86, edit: '+ exclude the internal sales channel', x: 156, y: 244 },
    A4: { score: 84, edit: '+ tighten the wording', x: 100, y: 304, left: true },
    A5: { score: 85, edit: '+ add an example', x: 136, y: 372 },
    A6: { score: 86, edit: '+ reorder the rules', x: 196, y: 330 },
    B1: { score: 55, edit: 'rewrite the card as a dated checklist', x: 240, y: 264 },
    B2: { score: 70, edit: '+ 2026-Q1 window on line 1', x: 270, y: 322 },
    B3: { score: 92, edit: '+ carry the A-line’s three rules', x: 284, y: 386 },
  }

  const METHODS = {
    hill: {
      name: 'Hill climbing', plain: 'Keep the one best card. Try a small change; keep it only if it scores higher.',
      term: 'a ratchet: one champion, keep-if-better',
      rounds: [
        { parent: 'G', child: 'A1', verdict: 'ship', note: 'Scores 71, higher than 63. Kept: it becomes the champion.' },
        { parent: 'A1', child: 'A2', verdict: 'ship', note: 'Scores 80. Kept.' },
        { parent: 'A2', child: 'A3', verdict: 'ship', note: 'Scores 86. Kept.' },
        { parent: 'A3', child: 'B1', verdict: 'discard', note: 'A whole new structure, a dated checklist. It scores 55, lower than 86, so the ratchet throws it away.' },
        { parent: 'A3', child: 'A4', verdict: 'discard', note: 'Scores 84. Lower: thrown away.' },
        { parent: 'A3', child: 'A5', verdict: 'discard', note: 'Scores 85. Lower: thrown away.' },
        { parent: 'A3', child: 'A6', verdict: 'discard', note: 'Scores 86, a tie. Not higher, so thrown away. Every small change to A3 scores the same or worse.' },
      ],
    },
    gepa: {
      name: 'GEPA', plain: 'Keep a front of cards that each win on part of the task. A critic reads each failure and writes the next change.',
      term: 'genetic-Pareto: a Pareto front, mutation by reflection',
      rounds: [
        { parent: 'G', child: 'A1', verdict: 'ship', reflect: 'Totals include refunded orders.', front: [['A1', 'totals']], note: 'Scores 71. Best so far on the totals questions.' },
        { parent: 'A1', child: 'A2', verdict: 'ship', reflect: 'Cancelled and returned orders still count.', front: [['A2', 'totals']], note: 'Scores 80. It beats A1 on everything, so it replaces A1 on the front.' },
        { parent: 'A2', child: 'A3', verdict: 'ship', reflect: 'Internal-channel orders are still counted.', front: [['A3', 'totals']], note: 'Scores 86. It replaces A2 on the front.' },
        { parent: 'A3', child: 'B1', verdict: 'front', reflect: 'The totals are right, but “last quarter” is read as the latest month.', front: [['A3', 'totals'], ['B1', 'dates']], note: 'The change rewrites the card as a dated checklist. It scores 55, lower overall, but it is the only card that gets the date questions right, so it joins the front.' },
        { parent: 'B1', child: 'B2', verdict: 'front', reflect: 'The dates are right, but the quarter is buried mid-card.', front: [['A3', 'totals'], ['B2', 'dates']], note: 'Scores 70. It beats B1 on everything, so it takes B1’s place on the front.' },
        { parent: 'B2', child: 'B3', verdict: 'ship', reflect: 'Refunds, cancelled and internal orders still count. A3 already carries those rules.', front: [['B3', 'totals and dates']], note: 'Scores 92: past the peak where the ratchet parked. It wins on both parts and the front shrinks to one card.' },
      ],
    },
    dgm: {
      name: 'Darwin Gödel Machine', plain: 'Keep every card ever made. Pick parents by score, and by how little each has been used.',
      term: 'an open-ended archive with quality-diversity parent sampling',
      rounds: [
        { parent: 'G', child: 'A1', verdict: 'ship', note: 'Scores 71, higher than the deployed 63: the gate ships it. Both stay in the archive.' },
        { parent: 'A1', child: 'A2', verdict: 'ship', note: 'Scores 80. Shipped.' },
        { parent: 'A2', child: 'A3', verdict: 'ship', note: 'Scores 86. Shipped.' },
        { parent: 'A3', child: 'A4', verdict: 'archive', note: 'Scores 84. Not better than 86, so it does not ship, but it stays in the archive.' },
        { parent: 'A3', child: 'B1', verdict: 'archive', note: 'The dated checklist scores 55. Hill climbing threw this card away. The archive keeps it.' },
        { parent: 'A4', child: 'A5', verdict: 'archive', note: 'Scores 85. Archived.' },
        { parent: 'B1', child: 'B2', verdict: 'archive', note: 'Scores 70: better than its parent, not yet better than the deployed 86. Archived.' },
        { parent: 'B2', child: 'B3', verdict: 'ship', note: 'Scores 92, past the plateau. Shipped. The recovery exists only because nothing was thrown away.' },
      ],
    },
  }
  const METHOD_ORDER = ['hill', 'gepa', 'dgm']

  /* ---------------- state ---------------- */
  let S
  function fresh() {
    return {
      scene: 'intro', chapter: 0,
      learned: { good: false, signal: false, search: false, gate: false },
      c1: { goodWrong: [], read: { count: {}, sum: {} }, keepCount: null, keepSum: null },
      c2: { ix: 0, labels: 3, critiques: 2, quality: 63, refunds: false, junk: 0, regress: 0, kept: 0, missed: 0, read: {}, last: null, },
      c3: { method: null, round: 0, runs: {} },
    }
  }

  /* ---------------- rendering ---------------- */
  function say(text) {
    const el = $('status')
    el.textContent = ''
    window.setTimeout(() => { el.textContent = text }, 30)
  }

  function renderEngine(now) {
    const chapters = CHAPTERS.map(([n, name]) => {
      const done = S.chapter > n
      const cur = S.chapter === n
      return '<li class="de-chip' + (cur ? ' is-on' : '') + '"' + (cur ? ' aria-current="step"' : '') + '>' +
        (done ? '✓ ' : '') + n + ' · ' + name + (done ? '<span class="de-sr"> (done)</span>' : '') + '</li>'
    }).join('')
    $('chapters').innerHTML = chapters
    $('stations').innerHTML = PARTS.map((p, i) => {
      const isNow = now.includes(p.key)
      const done = S.learned[p.key]
      const state = isNow ? '▸ working now' : done ? '✓ in place' : '· not yet'
      return '<li class="se-station' + (isNow ? ' is-now' : '') + (done ? ' is-done' : '') + '">' +
        '<small>' + (i + 1) + ' · ' + esc(p.term) + '</small><b>' + esc(p.ask) + '</b><span class="se-state">' + state + '</span></li>'
    }).join('')
  }

  function gauge(label, value, meter) {
    return '<div class="de-gauge"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong>' +
      (meter != null ? '<span class="de-meter" aria-hidden="true" style="margin-top:.3rem"><i style="--value:' + (meter / 100) + '"></i></span>' : '') + '</div>'
  }
  function renderGauges() {
    let html = ''
    if (S.chapter === 2 && S.scene !== 'c2-task') {
      html = gauge('Deployed quality', S.c2.quality + ' / 100', S.c2.quality) +
        gauge('Labels left', S.c2.labels + ' of 3') + gauge('Critiques left', S.c2.critiques + ' of 2')
    } else if (S.chapter === 3 && S.c3.method) {
      const m = METHODS[S.c3.method]
      html = gauge('Deployed score', deployedScore() + ' / 100', deployedScore()) + gauge('Search', m.name) +
        gauge('Round', S.c3.round + ' of ' + m.rounds.length)
    }
    $('gauges').innerHTML = html
  }

  /* Swap the scene. If the control that advanced the story had focus, move
     focus to the new heading so keyboard and screen-reader users land on it. */
  function show(id, html, now, wire) {
    const box = $('scene')
    const hadFocus = box.contains(document.activeElement) || document.activeElement === document.body
    S.scene = id
    box.innerHTML = html
    renderEngine(now || [])
    renderGauges()
    if (wire) wire()
    const h = box.querySelector('h2')
    if (h) { h.id = 'scene-title'; h.tabIndex = -1 }
    if (hadFocus && h && started) h.focus()
  }
  let started = false

  const next = (label) => '<div class="se-row"><button class="de-btn" id="se-next" type="button">' + label + ' <span aria-hidden="true">▸</span></button></div>'
  const onNext = (fn) => { const b = $('se-next'); if (b) b.onclick = fn }
  const note = (cls, head, body) => '<div class="se-note ' + cls + '"><b>' + head + '</b> ' + body + '</div>'
  const term = (t) => '<p class="se-term">Book term: ' + t + '</p>'
  /* Mockup vocabulary: a specimen card on paper, a captioned plate, and a
     board with the machine on the left and a gearbox of gauges and controls. */
  const specimen = (label, body) => '<div class="de-panel se-specimen"><span class="de-label">' + esc(label) + '</span>' + body + '</div>'
  const board = (main, gear) => '<div class="se-board"><div class="se-board-main">' + main + '</div><div class="se-gearbox">' + gear + '</div></div>'
  const EMBLEMS = {
    /* after the Selection Engine emblem in the owner's mockup */
    dgm: '<path d="M60 104 V70 M60 70 C 40 60 30 44 24 22 M60 70 C 76 58 86 46 92 24 M60 86 C 74 82 92 76 104 64 M24 22 h -8 M92 24 h 8 M104 64 l 8 -4"/><circle cx="24" cy="22" r="4"/><circle cx="92" cy="24" r="4"/><circle cx="104" cy="64" r="4"/>',
    hill: '<path d="M8 100 C 30 96 40 40 58 36 C 72 34 76 70 88 72 C 98 74 104 50 114 44"/><path d="M58 36 v-14 M52 22 h12"/><circle cx="58" cy="36" r="4"/><path d="M20 104 l6 -8 l6 8 M34 104 l6 -8 l6 8"/>',
    gepa: '<path d="M14 18 V100 H112"/><path d="M26 30 C 40 34 52 50 60 62 C 70 76 86 84 104 88"/><circle cx="30" cy="32" r="4"/><circle cx="56" cy="56" r="4"/><circle cx="80" cy="78" r="4"/><circle cx="102" cy="88" r="4"/><circle cx="48" cy="80" r="3"/><circle cx="76" cy="94" r="3"/>',
  }
  const emblem = (k) => '<div class="se-emblem" aria-hidden="true"><svg viewBox="0 0 120 110" fill="none" stroke="currentColor" stroke-width="2">' + EMBLEMS[k] + '</svg></div>'
  /* The gearbox beside an instrument rack: how many readings you have taken. */
  const readGauge = (n, total) => '<div class="de-gauge"><span>Instruments read</span><strong id="g-read">' + n + ' of ' + total + '</strong></div>'

  function gate(state, label) {
    const doors = {
      open: '<path d="M14 58V26l-8-6v34M50 58V26l8-6v34"/><path d="M14 58h36" stroke-dasharray="3 4"/>',
      shut: '<path d="M14 58V22h18v36M32 58V22h18v36"/><path d="M27 40h10"/>',
      jam: '<path d="M14 58V22h15v36M35 58V22h15v36"/><circle cx="32" cy="40" r="4"/><path d="M32 33v-3M32 47v3M25 40h-2M39 40h2"/>',
    }[state]
    const mark = { open: '✓ OPEN', shut: '✕ SHUT', jam: '∅ JAMMED' }[state]
    return '<div class="se-gate de-sketch"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 60V20a24 24 0 0 1 48 0v40"/>' + doors + '</svg>' +
      '<strong>Gate ' + mark + '</strong><span>' + label + '</span></div>'
  }

  /* An instrument rack. readings: map of key -> text, or a function(key) that
     returns {text, cost} when read. used: map of keys already read. */
  function rack(keys, opts) {
    const cards = keys.map((k) => {
      const m = INST[k]
      const extra = opts.extra && opts.extra[k] ? opts.extra[k] : null
      const off = opts.off && opts.off[k]
      const done = opts.used[k]
      return '<div class="se-inst' + (off ? ' is-off' : '') + '"><h3>' + esc(m.name) + '</h3>' +
        '<dl><dt>Cost</dt><dd>' + esc(extra && extra.cost ? extra.cost : m.cost) + '</dd><dt>Noise</dt><dd>' + esc(m.noise) + '</dd><dt>Catch</dt><dd>' + esc(extra && extra.limit ? extra.limit : m.limit) + '</dd></dl>' +
        '<p class="se-read" id="out-' + k + '"' + (done ? ' data-read="1"' : '') + '>' + (done ? esc(done) : off ? esc(off) : opts.disabled && opts.disabled[k] ? 'None left.' : '—') + '</p>' +
        (off ? '' : '<button class="de-btn-ghost" type="button" id="read-' + k + '"' + (opts.disabled && opts.disabled[k] && !done ? ' disabled' : '') + '>' +
          'Read ' + esc(m.name) + (done ? ' again' : '') + '</button>') +
        '</div>'
    }).join('')
    return '<div class="de-engine se-rack" role="group" aria-label="Instrument rack">' + cards + '</div>'
  }
  function wireRack(keys, onRead) {
    for (const k of keys) {
      const b = $('read-' + k)
      if (!b) continue
      b.onclick = () => {
        const text = onRead(k)
        if (text == null) return
        $('out-' + k).textContent = text
        $('out-' + k).dataset.read = '1'
        const g = $('g-read')
        if (g) g.textContent = document.querySelectorAll('#scene .se-read[data-read]').length + ' of ' + document.querySelectorAll('#scene .se-inst button').length
        b.textContent = 'Read ' + INST[k].name + ' again'
        say(INST[k].name + ': ' + text)
        renderGauges()
      }
    }
  }

  /* ================= INTRO ================= */
  function intro() {
    S.chapter = 0
    show('intro',
      '<h2>Build a machine that improves itself</h2>' +
      '<p>Picture a machine that answers questions and can rewrite its own instructions. For it to get <b>better</b>, not just different, it needs four parts. They light up on the engine above as you build them:</p>' +
      '<ol class="se-parts">' +
      '<li class="de-panel"><span class="de-label">Part 1</span><b>Good</b>A clear idea of what a good answer is.</li>' +
      '<li class="de-panel"><span class="de-label">Part 2</span><b>Signal</b>A way to measure how far an answer falls short of good.</li>' +
      '<li class="de-panel"><span class="de-label">Part 3</span><b>Search</b>A way to turn that gap into better versions.</li>' +
      '<li class="de-panel"><span class="de-label">Part 4</span><b>Gate</b>A rule for which version gets to ship.</li>' +
      '</ol>' +
      '<p>Chapter 1 hands you a question with a provable answer. Chapter 2 takes the proof away. Chapter 3 hides the summit behind a false peak.</p>' +
      next('Chapter 1: a question with proof'),
      [], () => onNext(c1Good))
  }

  /* ================= CHAPTER 1 · proof ================= */
  const GOOD_CHOICES = [
    ['a', 'The answer the machine sounds most sure of', 'Confidence is how the machine feels, not whether it is right. A sure, wrong answer would pass.'],
    ['b', 'The answer you get by doing the arithmetic', ''],
    ['c', 'The answer most people would give', 'Crowds can be wrong, and you would have to go and ask them. Here you can simply compute it.'],
  ]
  function c1Good() {
    S.chapter = 1
    show('c1-good',
      '<p class="de-kicker">Chapter 1 · Proof</p><h2>First, decide what good means</h2>' +
      '<p>Your machine answers questions about one line of text:</p>' +
      '<div class="se-quote">“' + LINE + '”</div>' +
      specimen('Claim 1 of 3', '<div class="se-quote"><span class="dim">Q: What is 1 + 1 + 1?</span>\nThe machine says: 3</div>') +
      '<p>Before you can judge the answer, you need a definition of a good one. Which do you pick?</p>' +
      '<div class="se-choices">' + GOOD_CHOICES.map(([k, t]) => '<button class="de-btn-ghost" type="button" id="good-' + k + '">' + esc(t) + '</button>').join('') + '</div>' +
      '<div id="good-feedback"></div>' + term('the definition of good'),
      ['good'], () => {
        for (const [k, , why] of GOOD_CHOICES) {
          $('good-' + k).onclick = () => {
            if (k === 'b') { S.learned.good = true; return c1Proof() }
            if (!S.c1.goodWrong.includes(k)) S.c1.goodWrong.push(k)
            $('good-feedback').innerHTML = note('bad', 'Not quite.', esc(why) + ' Try another.')
            say('Not quite. ' + why)
          }
        }
      })
  }
  function c1Proof() {
    show('c1-proof',
      '<p class="de-kicker">Chapter 1 · Claim 1 of 3</p><h2>Good is something you can compute</h2>' +
      '<div class="se-quote"><span class="dim">Q: What is 1 + 1 + 1?</span>\nThe machine says: 3\nThe proof:       1 + 1 + 1 = 3   <span class="dim">(computed, not guessed)</span></div>' +
      gate('open', 'Accepted, with certainty.') +
      '<p>When good can be computed, the gap to good can be computed too, and that is a <b>proof</b>. Nobody argues with arithmetic. The proof is free, certain and impossible to fool.</p>' +
      term('a proof: a signal you can compute') +
      next('Claim 2'),
      ['good', 'gate'], () => onNext(c1Count))
  }
  function c1Board(used, keep, reject) {
    return board(rack(INST_ORDER, { used }),
      '<div class="de-engine se-gauge-row">' + readGauge(Object.keys(used).length, INST_ORDER.length) + '<div class="de-gauge"><span>Gate</span><strong>waiting</strong></div></div>' +
      '<div class="se-row"><button class="de-btn" type="button" id="se-keep">' + keep + '</button><button class="de-btn-ghost" type="button" id="se-reject">' + reject + '</button></div>' +
      '<p class="de-muted se-small">Readings are free to repeat. Only the decision counts.</p>')
  }
  function c1Count() {
    const used = S.c1.read.count
    show('c1-count',
      '<p class="de-kicker">Chapter 1 · Proof</p><h2>Five instruments, one claim</h2>' +
      specimen('Claim 2 of 3', '<div class="se-quote"><span class="dim">Q: How many times does the letter r appear in the line?</span>\nThe machine says: 8</div>') +
      '<p>It sounds sure. This time you have a full rack of instruments. Each one measures the gap to good in its own way, with its own cost, noise and bias. ' +
      '<b>Jev</b> is TypeSafe’s fast decision model: it gives a typed yes or no with a probability.</p>' +
      '<p>Read as many as you like, then keep or reject the answer.</p>' +
      c1Board(used, 'Keep the answer', 'Reject it'),
      ['signal', 'gate'], () => {
        wireRack(INST_ORDER, (k) => { used[k] = C1_READ.count[k]; return used[k] })
        $('se-keep').onclick = () => { S.c1.keepCount = true; c1CountResult() }
        $('se-reject').onclick = () => { S.c1.keepCount = false; c1CountResult() }
      })
  }
  function c1CountResult() {
    const kept = S.c1.keepCount
    const used = Object.keys(S.c1.read.count)
    S.learned.signal = true
    const rows = INST_ORDER.map((k) => {
      const [v, why] = C1_VERDICT[k]
      const mark = v === 'right' ? '<span class="se-good">✓ right</span>' : v === 'wrong' ? '<span class="se-bad">✕ wrong</span>' : '<span>~ no verdict</span>'
      return '<tr><th scope="row">' + esc(INST[k].name) + (used.includes(k) ? '' : ' <span class="de-muted">(not read)</span>') + '</th><td>' + mark + '</td><td>' + esc(why) + '</td></tr>'
    }).join('')
    const verdict = kept
      ? note('bad', 'You kept a wrong answer.', 'The line has 7 r’s, not 8.' + (used.includes('judge') && !used.includes('proof') ? ' The judge’s 9 out of 10 was the voice you heard.' : ''))
      : note('good', 'Rightly rejected.', 'The line has 7 r’s, not 8.')
    say((kept ? 'You kept a wrong answer.' : 'Rightly rejected.') + ' The line has 7 r’s.')
    show('c1-count-result',
      '<p class="de-kicker">Chapter 1 · Claim 2 of 3</p><h2>The count was 7</h2>' + verdict +
      gate('shut', 'Rejected, with certainty, by the proof.') +
      '<div class="se-table-wrap"><table class="se-table"><caption class="de-sr">What each instrument said</caption><thead><tr><th scope="col">Instrument</th><th scope="col">Verdict</th><th scope="col">Why</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p>When good is computable, proof is the best signal there is. Every other instrument is a stand-in for it, and the cheapest stand-in, the judge, was the one that got fooled.</p>' +
      term('the signal: measuring the gap to good') +
      next('Claim 3'),
      ['signal', 'gate'], () => onNext(c1Sum))
  }
  function c1Sum() {
    const used = S.c1.read.sum
    show('c1-sum',
      '<p class="de-kicker">Chapter 1 · Proof</p><h2>Now summarize it</h2>' +
      specimen('Claim 3 of 3', '<div class="se-quote"><span class="dim">Q: Summarize the line in five words.</span>\nThe machine says: “Strawberry fields last for ever”</div>') +
      '<p>Reach for your instruments again.</p>' +
      c1Board(used, 'Keep the summary', 'Reject it'),
      ['signal', 'gate'], () => {
        wireRack(INST_ORDER, (k) => { used[k] = C1_READ.sum[k]; return used[k] })
        $('se-keep').onclick = () => { S.c1.keepSum = true; c1SumResult() }
        $('se-reject').onclick = () => { S.c1.keepSum = false; c1SumResult() }
      })
  }
  function c1SumResult() {
    say('You ' + (S.c1.keepSum ? 'kept' : 'rejected') + ' the summary, without proof.')
    show('c1-sum-result',
      '<p class="de-kicker">Chapter 1 · Done</p><h2>You just measured instead of proving</h2>' +
      gate('jam', 'No expression decides whether a summary is good.') +
      '<p>You ' + (S.c1.keepSum ? 'kept' : 'rejected') + ' the summary, and you did it <b>without proof</b>. You can count its words (five, so that part checks out). You cannot compute whether it is <em>good</em>.</p>' +
      '<p>Almost everything a real agent produces, from answers to plans to tool choices, lives here, below the line where proof works. A gate that waits for proof never opens again. So the field makes a trade: <b>measure rather than prove, search rather than solve.</b></p>' +
      term('the verifiability line') +
      next('Chapter 2: no proof'),
      ['signal'], () => onNext(c2Task))
  }

  /* ================= CHAPTER 2 · no proof ================= */
  function c2Task() {
    S.chapter = 2
    show('c2-task',
      '<p class="de-kicker">Chapter 2 · The revenue question</p><h2>One vague question, six hidden rules</h2>' +
      '<p>The machine is now a data agent. A manager asks:</p>' +
      '<div class="se-quote">“Today is 2026-04-15. Who were our top three reps last quarter, and how much did they bring in?”</div>' +
      '<p>Six rules hide in that sentence and it states none of them: revenue is <b>net of refunds</b>; “last quarter” means <b>2026-Q1</b>; <b>cancelled, returned, internal and unpaid</b> orders don’t count; totals are <b>grouped by rep</b>.</p>' +
      '<p>The machine’s instruction card is the honest first draft: “You are a data analyst. Answer the user’s question using the tools.” It knows none of the rules, and answers confidently:</p>' +
      '<div class="se-quote">The machine’s leaderboard:  Cy $508 · Ben $446 · Dee $260\nThe true leaderboard:       Cy $358 · Ben $296 · Dee $220  <span class="dim">(canonical pipeline)</span></div>' +
      '<p>Right names, right order, every number inflated. Here, <b>good</b> means matching the leaderboard the canonical pipeline computes.</p>' +
      term('genesis card; ground truth from a canonical pipeline') +
      next('Check the checker'),
      ['good'], () => onNext(c2Check))
  }
  function c2Check() {
    show('c2-check',
      '<p class="de-kicker">Chapter 2 · Before you trust a score</p><h2>Check the checker</h2>' +
      '<p>A checker turns “how close is this leaderboard to the truth?” into a score out of 100. Ground truth is only as good as the code behind it: every label has a labeler. So first, run it on two cards you already understand:</p>' +
      '<div class="se-quote">GENESIS  (knows no rules)    → 63    <span class="dim">the floor: how far there is to climb</span>\nORACLE   (carries all six)   → 100   <span class="dim">the ceiling: proof the top is reachable</span></div>' +
      '<p>The oracle scores 100, every time, so the scale can be trusted. An unvalidated checker is an opinion in a lab coat.</p>' +
      '<p>Now rewrites of the card arrive one at a time and <b>you are the gate</b>. Proof is jammed for the rest of the game. You have three ground-truth labels, two critiques, a free judge, and Jev, set up to answer one narrow question: does this edit change which orders count?</p>' +
      term('the gate: deciding what ships') +
      next('Open the gate'),
      ['signal', 'gate'], () => onNext(() => { S.c2.ix = 0; c2Version() }))
  }

  function c2Version() {
    const c = S.c2
    while (c.ix < STREAM.length && STREAM[c.ix].needsRefunds && !c.refunds) c.ix++
    if (c.ix >= STREAM.length) return c2Debrief()
    const v = STREAM[c.ix]
    c.read = {}
    const n = c.ix + 1, shown = STREAM.length
    show('c2-version',
      '<p class="de-kicker">Chapter 2 · Version ' + n + ' of ' + shown + '</p><h2>Version ' + n + ' is at the gate</h2>' +
      specimen('Proposed edit', '<div class="se-quote">' + esc(v.edit) + '</div>') +
      board(rack(INST_ORDER, {
        used: {},
        off: { proof: '∅ Jammed: nothing to compute here.' },
        extra: {
          label: { cost: 'one label (3 in all)' },
          reflect: { cost: 'one critique (2 in all)' },
          jev: { limit: 'asks only: does this edit change which orders count?' },
        },
        disabled: { label: c.labels === 0, reflect: c.critiques === 0 },
      }),
      '<div class="de-engine se-gauge-row">' + readGauge(0, 4) + '<div class="de-gauge"><span>Deployed now</span><strong>' + c.quality + ' / 100</strong></div></div>' +
      '<div class="se-row"><button class="de-btn" type="button" id="se-keep">Keep: ship it</button><button class="de-btn-ghost" type="button" id="se-reject">Reject</button></div>' +
      '<p class="de-muted se-small">Labels and critiques are spent across all six versions. The judge and Jev are free.</p>'),
      ['signal', 'gate'], () => {
        wireRack(INST_ORDER, (k) => {
          if (c.read[k]) return c.read[k]
          let text
          if (k === 'judge') text = '≈ ' + clamp(c.quality + v.delta + v.judge) + ' (opinion)'
          else if (k === 'label') { if (!c.labels) return null; c.labels--; text = '= ' + clamp(c.quality + v.delta) + ' (exact)' }
          else if (k === 'reflect') { if (!c.critiques) return null; c.critiques--; text = '“' + v.reflect + '”' }
          else if (k === 'jev') text = 'changes_counted_orders: ' + (v.counts ? 'yes' : 'no') + ' · p ' + v.p.toFixed(2)
          c.read[k] = text
          return text
        })
        $('se-keep').onclick = () => c2Decide(true)
        $('se-reject').onclick = () => c2Decide(false)
      })
  }
  function c2Decide(keep) {
    const c = S.c2, v = STREAM[c.ix]
    const better = v.delta > 0
    if (keep) {
      c.quality = clamp(c.quality + v.delta)
      if (v.kind === 'junk') c.junk++
      if (v.kind === 'regress') c.regress++
      if (better) c.kept++
      if (v.refunds) c.refunds = true
      if (v.needsRefunds) c.refunds = false
    } else if (better) c.missed++
    const right = keep === better
    const verdict = keep
      ? (v.kind === 'good' ? 'Shipped a real improvement.' : v.kind === 'regress' ? 'Shipped a regression.' : 'Shipped nothing, dressed up as something.')
      : (v.kind === 'good' ? 'Rejected a real improvement.' : 'Rightly rejected.')
    c.last = { id: v.id, keep, right }
    say(verdict + ' Deployed quality is now ' + c.quality + '.')
    const more = STREAM.slice(c.ix + 1).some((s) => !(s.needsRefunds && !c.refunds))
    show('c2-result',
      '<p class="de-kicker">Chapter 2 · The truth</p><h2>' + esc(verdict) + '</h2>' +
      '<div class="se-quote">' + esc(v.edit) + '\nTrue effect: ' + (v.delta > 0 ? '+' + v.delta : v.delta === 0 ? '0 (no change)' : v.delta) + '    Deployed quality now: ' + c.quality + '</div>' +
      note(right ? 'good' : 'bad', right ? '✓' : '✕', esc(v.truth)) +
      next(more ? 'Next version' : 'Chapter 2 debrief'),
      ['gate'], () => onNext(() => { c.ix++; c2Version() }))
  }

  /* What the free judge would have shipped running the gate alone. */
  function judgeOnly() {
    let truth = 63, judged = 63, refunds = false, kept = 0, good = 0, junk = 0, regress = 0
    for (const v of STREAM) {
      if (v.needsRefunds && !refunds) continue
      if (v.delta + v.judge > 0) {
        truth += v.delta; judged += v.delta + v.judge; kept++
        if (v.kind === 'good') good++
        if (v.kind === 'junk') junk++
        if (v.kind === 'regress') regress++
        if (v.refunds) refunds = true
        if (v.needsRefunds) refunds = false
      }
    }
    return { truth: clamp(truth), judged: clamp(judged), raw: judged, kept, good, junk, regress }
  }

  function trustChart() {
    /* x: how often you can use it; y: how far you can trust it. */
    const pts = [
      ['Proof', 60, 40, 'start'], ['Ground-truth labels', 110, 80, 'start'], ['Jev (narrow yes/no)', 330, 136, 'end'],
      ['Reflection (words)', 300, 185, 'end'], ['LLM-as-Judge', 372, 236, 'end'],
    ]
    return '<figure class="se-figure de-sketch" style="max-width:520px"><svg viewBox="0 0 420 300" role="img" aria-labelledby="trust-cap">' +
      '<path d="M40 260H404M40 260V18"/>' +
      '<path d="M300 22h96v78h-96z" stroke-dasharray="4 5"/>' +
      '<text x="348" y="52" text-anchor="middle" font-size="13" fill="currentColor" stroke="none" font-family="JetBrains Mono, monospace">certain</text>' +
      '<text x="348" y="70" text-anchor="middle" font-size="13" fill="currentColor" stroke="none" font-family="JetBrains Mono, monospace">and free:</text>' +
      '<text x="348" y="88" text-anchor="middle" font-size="13" fill="currentColor" stroke="none" font-family="JetBrains Mono, monospace">empty</text>' +
      pts.map(([t, x, y, a]) => '<circle cx="' + x + '" cy="' + y + '" r="6" fill="currentColor"/>' +
        '<text x="' + (a === 'start' ? x + 12 : x - 12) + '" y="' + (y + 5) + '" text-anchor="' + a + '" font-size="14" fill="currentColor" stroke="none" font-family="JetBrains Mono, monospace">' + esc(t) + '</text>').join('') +
      '<text x="222" y="290" text-anchor="middle" font-size="13" fill="currentColor" stroke="none" font-family="JetBrains Mono, monospace">how often you can use it →</text>' +
      '<text x="16" y="140" text-anchor="middle" font-size="13" fill="currentColor" stroke="none" font-family="JetBrains Mono, monospace" transform="rotate(-90 16 140)">how far you can trust it →</text>' +
      '</svg><span class="de-label">Plate I · trust against availability</span><figcaption id="trust-cap">Trust against availability. Proof is the most trusted and the rarest; ground-truth labels are next; Jev is trusted only on its narrow question; reflection gives words, not scores; the LLM judge is always available and the least trusted. The corner that is both certain and free is empty.</figcaption></figure>'
  }

  function c2Debrief() {
    const c = S.c2, j = judgeOnly()
    S.learned.gate = true
    const clean = !c.junk && !c.regress && !c.missed
    say('Chapter 2 done. Deployed quality ' + c.quality + '.')
    show('c2-debrief',
      '<p class="de-kicker">Chapter 2 · Debrief</p><h2>A family of signals, and none is enough alone</h2>' +
      '<div class="se-table-wrap"><table class="se-table"><caption class="de-sr">Your gate against a judge-only gate</caption><thead><tr><th scope="col"></th><th scope="col">You</th><th scope="col">Judge alone</th></tr></thead><tbody>' +
      '<tr><th scope="row">True quality</th><td>' + c.quality + '</td><td>' + j.truth + '</td></tr>' +
      '<tr><th scope="row">What the judge believes</th><td>—</td><td>' + j.judged + (j.raw > 100 ? ' (pinned at the top)' : '') + '</td></tr>' +
      '<tr><th scope="row">Real improvements shipped</th><td>' + c.kept + '</td><td>' + j.good + '</td></tr>' +
      '<tr><th scope="row">Junk shipped</th><td>' + c.junk + '</td><td>' + j.junk + '</td></tr>' +
      '<tr><th scope="row">Regressions shipped</th><td>' + c.regress + '</td><td>' + j.regress + '</td></tr>' +
      '</tbody></table></div>' +
      (clean ? note('good', 'A clean gate.', 'You shipped every real improvement and nothing else: 86 is the best this stream allows.')
        : note('bad', 'The gate leaked.', 'The best this stream allows is 86: all three real improvements, nothing else.')) +
      '<p>Running the gate alone, the free judge would have kept every edit, because each one <em>looked</em> better to it. It would report ' + j.judged + ' out of 100 while the truth sat at ' + j.truth + ', with two pieces of junk shipped and the refund rule quietly removed. The judge was <b>gamed</b> by confident prose, which is the $508 leaderboard all over again.</p>' +
      trustChart() +
      '<p>No instrument is both certain and free, and each sees less than the whole gap. A score is the symptom without its cause; a critique is the diagnosis without its measure. That is the <b>signal ceiling</b>, and it is why real loops combine signals: cheap ones to filter, exact ones to decide.</p>' +
      term('LLM-as-Judge, ground truth, reflection, the signal ceiling') +
      next('Chapter 3: a false peak'),
      ['signal', 'gate'], () => onNext(c3Intro))
  }

  /* ================= CHAPTER 3 · search ================= */
  function deployedScore() {
    const m = S.c3.method
    if (!m) return 63
    let best = 63
    for (const r of METHODS[m].rounds.slice(0, S.c3.round)) if (r.verdict === 'ship') best = NODES[r.child].score
    return best
  }

  function c3Intro() {
    S.chapter = 3
    S.c3.method = null
    const ran = Object.keys(S.c3.runs)
    show('c3-intro',
      '<p class="de-kicker">Chapter 3 · A deceptive task</p><h2>Take yourself out of the gate</h2>' +
      '<p>You now have a checker you trust: the ground truth you validated in chapter 2. So the engine can run on its own. A <b>search</b> proposes a new card, the checker scores it, and the gate ships it only if it scores <b>higher</b> than the deployed card.</p>' +
      '<p>Start again from the genesis card at 63. The first three rules are easy to add one at a time. The quarter rule, “last quarter means 2026-Q1, not the latest month”, is not: it does not fit this card’s structure one sentence at a time. To reach it, the search has to go <b>downhill first</b>.</p>' +
      '<p>Goal: get the deployed card <b>past 86</b>. Pick a search:</p>' +
      '<div class="se-methods">' + METHOD_ORDER.map((k) => {
        const m = METHODS[k]
        return '<article class="de-engine se-method">' + emblem(k) + '<p class="de-kicker">' + esc(m.term) + '</p><h3>' + esc(m.name) + '</h3>' +
          '<p class="de-muted">' + esc(m.plain) + '</p>' +
          (ran.includes(k) ? '<div class="de-gauge"><span>Last run</span><strong>' + esc(runSummary(k)) + '</strong></div>' : '') +
          '<button class="de-btn" type="button" id="run-' + k + '">Run ' + esc(k === 'hill' ? 'hill climbing' : m.name) + '</button></article>'
      }).join('') + '</div>' +
      term('search: hill climbing, GEPA, the Darwin Gödel Machine'),
      ['search', 'gate'], () => { for (const k of METHOD_ORDER) $('run-' + k).onclick = () => c3Start(k) })
  }

  function runSummary(k) {
    const r = S.c3.runs[k]
    if (!r) return 'not run yet'
    return r.best > 86 ? 'reached ' + r.best + ' in ' + r.rounds + ' rounds' : 'parked at ' + r.best
  }

  function c3Start(k) {
    S.c3.method = k
    S.c3.round = 0
    c3Run()
  }

  /* DGM parent weights before a round: score ÷ 2^uses over the archive. */
  function dgmWeights(roundIx) {
    const rounds = METHODS.dgm.rounds
    const archive = ['G'].concat(rounds.slice(0, roundIx).map((r) => r.child))
    const uses = {}
    for (const r of rounds.slice(0, roundIx)) uses[r.parent] = (uses[r.parent] || 0) + 1
    const rows = archive.map((id) => ({ id, score: NODES[id].score, uses: uses[id] || 0, w: NODES[id].score / Math.pow(2, uses[id] || 0) }))
    const total = rows.reduce((a, r) => a + r.w, 0)
    for (const r of rows) r.share = r.w / total
    return rows
  }

  function treeSvg(k, upto) {
    const m = METHODS[k]
    const rounds = m.rounds.slice(0, upto)
    const shown = ['G'].concat(rounds.map((r) => r.child))
    const status = { G: 'ship' }
    const parent = {}
    for (const r of rounds) { status[r.child] = r.verdict === 'front' ? 'archive' : r.verdict; parent[r.child] = r.parent }
    if (k === 'gepa' && rounds.length) {
      const front = rounds[rounds.length - 1].front.map((f) => f[0])
      for (const id of shown) if (front.includes(id)) status[id] = status[id] === 'ship' ? 'ship-front' : 'front'
    }
    const mark = (s) => s === 'discard' ? ' ✗' : s.startsWith('ship') ? ' ✓' : ''
    const deployedLine = new Set()
    let champ = 'G'
    for (const r of rounds) if (r.verdict === 'ship') champ = r.child
    for (let c = champ; c; c = parent[c]) deployedLine.add(c)
    let edges = '', dots = '', labels = ''
    for (const id of shown) {
      const n = NODES[id]
      if (parent[id]) {
        const p = NODES[parent[id]]
        const cls = status[id] === 'discard' ? ' class="dash"' : deployedLine.has(id) ? ' class="ship"' : ''
        edges += '<path' + cls + ' d="M' + p.x + ' ' + p.y + 'Q' + (p.x + 4) + ' ' + ((p.y + n.y) / 2) + ' ' + n.x + ' ' + n.y + '"/>'
      }
      const s = status[id]
      const filled = deployedLine.has(id)
      dots += '<circle class="' + (filled ? 'dot-fill' : 'dot-open') + '" cx="' + n.x + '" cy="' + n.y + '" r="5"/>'
      if (s === 'front' || s === 'ship-front') dots += '<circle cx="' + n.x + '" cy="' + n.y + '" r="10"/>'
      /* Darwin's crossbar on every living tip */
      const isTip = !rounds.some((r) => r.parent === id)
      if (isTip && s !== 'discard') dots += '<path d="M' + (n.x - 8) + ' ' + (n.y + 9) + 'h16"/>'
      labels += '<text x="' + (n.left ? n.x - 12 : n.x + 14) + '" y="' + (n.y + 4) + '"' + (n.left ? ' text-anchor="end"' : '') + '>' + (id === 'G' ? '1 · G' : id) + ' · ' + n.score + mark(s) + (s === 'front' || s === 'ship-front' ? ' ◆' : '') + '</text>'
    }
    const alt = shown.map((id) => id + ' ' + NODES[id].score + ' (' + ({ ship: 'shipped', 'ship-front': 'shipped, on the front', front: 'on the front', archive: 'archived', discard: 'thrown away' }[status[id]] || 'shipped') + ')').join('; ')
    return '<figure class="se-figure de-sketch se-tree"><svg viewBox="0 0 400 420" role="img" aria-label="Family tree of card versions: ' + esc(alt) + '">' +
      '<text class="think" x="12" y="30">I think</text>' + edges + dots + labels + '</svg><span class="de-label">Plate II · the family of cards</span>' +
      '<figcaption>Drawn after Darwin’s 1837 “I think” sketch. Filled dots and thick lines: the deployed line. ✓ shipped · ✗ thrown away · open dot: kept, not shipped' + (k === 'gepa' ? ' · ◆ on the front' : '') + '. A crossbar marks a living tip.</figcaption></figure>'
  }

  function c3Run() {
    const k = S.c3.method, m = METHODS[k], i = S.c3.round
    const done = i >= m.rounds.length
    const log = m.rounds.slice(0, i).map((r, ix) => {
      const n = NODES[r.child]
      return '<li><strong>Round ' + (ix + 1) + ' · ' + r.child + ' from ' + r.parent + ':</strong> “' + esc(n.edit) + '” ' +
        (r.reflect ? '<span class="de-muted">Critic: “' + esc(r.reflect) + '”</span> ' : '') + esc(r.note) + '</li>'
    }).reverse().join('')
    let side = ''
    if (k === 'gepa' && i > 0) {
      side = '<div class="de-engine se-front"><p class="de-kicker">The front now</p><p>' + m.rounds[i - 1].front.map(([id, part]) => id + ' (' + NODES[id].score + ', best on ' + part + ')').join(' · ') + '</p></div>'
    }
    if (k === 'dgm' && !done) {
      const rows = dgmWeights(i)
      const pick = m.rounds[i].parent
      side = '<div class="de-engine se-iron-table"><p class="de-kicker">The archive before round ' + (i + 1) + '</p><table class="se-table"><caption class="de-sr">Archive weights before round ' + (i + 1) + '</caption><thead><tr><th scope="col">Card</th><th scope="col">Used</th><th scope="col">Weight</th><th scope="col">Chance</th></tr></thead><tbody>' +
        rows.map((r) => '<tr><th scope="row">' + r.id + ' · ' + r.score + (r.id === pick ? ' ◀ next' : '') + '</th><td>' + r.uses + '×</td><td>' + (Math.round(r.w * 10) / 10) + '</td><td>' + Math.round(r.share * 100) + '%</td></tr>').join('') +
        '</tbody></table></div><p class="de-muted se-small">Weight = score ÷ 2<sup>uses</sup>. Every use halves a card’s pull, so neglected branches earn turns. A real run draws at random by these chances; this is one authored draw.</p>'
    }
    const head = done ? (deployedScore() > 86 ? 'Past the peak: ' + deployedScore() : 'Parked at ' + deployedScore()) : i === 0 ? m.name : m.name + ' · round ' + i + ' of ' + m.rounds.length
    let tail
    if (!done) {
      tail = '<div class="se-row"><button class="de-btn" type="button" id="se-step">' + (i === 0 ? 'Run round 1' : 'Run round ' + (i + 1)) + ' <span aria-hidden="true">▸</span></button>' +
        '<button class="de-btn-ghost" type="button" id="se-runall">Run to the end</button></div>'
    } else {
      S.c3.runs[k] = { best: deployedScore(), rounds: m.rounds.length }
      const win = deployedScore() > 86
      if (win) S.learned.search = true
      const lesson = {
        hill: note('bad', 'The ratchet parked.', 'Every neighbour of A3 scores the same or worse, and the one card that led past the peak, the dated checklist, scored 55 and was thrown away in round 4. Keep-if-better cannot go downhill first.'),
        gepa: note('good', 'The front recovered.', 'B1 was worse overall but best on the date questions, so the front kept it. The critic’s words then told each mutation what to fix, and B3 combined both parts.'),
        dgm: note('good', 'The archive recovered.', 'B1 sat in the archive at 55. Every use of the A-line halved its pull, so the neglected branch earned its turn, and two steps later it passed the peak.'),
      }[k]
      const others = METHOD_ORDER.filter((x) => x !== k)
      tail = lesson +
        '<p><b>Search compared:</b> ' + METHOD_ORDER.map((x) => METHODS[x].name + ': ' + runSummary(x)).join(' · ') + '.</p>' +
        '<div class="se-row">' + others.map((x) => '<button class="de-btn-ghost" type="button" id="run-' + x + '">Try ' + esc(x === 'hill' ? 'hill climbing' : METHODS[x].name) + '</button>').join('') +
        (Object.values(S.c3.runs).some((r) => r.best > 86) ? '<button class="de-btn" type="button" id="se-next">See the whole engine <span aria-hidden="true">▸</span></button>' : '') + '</div>'
    }
    show('c3-run',
      '<p class="de-kicker">Chapter 3 · ' + esc(m.name) + '</p><h2>' + esc(head) + '</h2>' +
      (i === 0 ? '<p>' + esc(m.plain) + '</p>' : '') + term(esc(m.term)) +
      board(treeSvg(k, i), side + tail) +
      (log ? '<ol class="se-log" aria-label="Rounds, newest first">' + log + '</ol>' : ''),
      ['search', 'gate'], () => {
        const step = $('se-step'), all = $('se-runall')
        if (step) step.onclick = () => { S.c3.round++; c3Run(); announceRound() }
        if (all) all.onclick = () => { S.c3.round = m.rounds.length; c3Run(); announceRound() }
        for (const x of METHOD_ORDER) { const b = $('run-' + x); if (b) b.onclick = () => c3Start(x) }
        onNext(finale)
      })
  }
  function announceRound() {
    const m = METHODS[S.c3.method], i = S.c3.round
    if (!i) return
    const r = m.rounds[i - 1]
    say('Round ' + i + ': ' + r.child + ' scores ' + NODES[r.child].score + '. ' + r.note + (i >= m.rounds.length ? ' Run finished. Deployed score ' + deployedScore() + '.' : ''))
  }

  /* ================= FINALE ================= */
  function finale() {
    S.chapter = 4
    for (const p of PARTS) S.learned[p.key] = true
    say('The engine is complete.')
    show('end',
      '<p class="de-kicker">The whole engine</p><h2>Four parts, and the order matters</h2>' +
      '<ol class="se-parts">' +
      '<li class="de-panel"><span class="de-label">Part 1</span><b>Good</b>Decide what a good answer is: the computed count, the canonical leaderboard. <span class="se-term">definition of good</span></li>' +
      '<li class="de-panel"><span class="de-label">Part 2</span><b>Signal</b>Measure the gap with the best instrument you can afford. Proof when it exists; labels, Jev, reflection and judges when it does not, and check the checker first. <span class="se-term">signal</span></li>' +
      '<li class="de-panel"><span class="de-label">Part 3</span><b>Search</b>Turn the gap into variants. The ratchet is cheap and parks on peaks; a front or an archive keeps the odd branch that leads past them. <span class="se-term">hill climbing, GEPA, Darwin Gödel Machine</span></li>' +
      '<li class="de-panel"><span class="de-label">Part 4</span><b>Gate</b>Ship only on a better measured score, and keep what you reject, so a wrong call can be undone. <span class="se-term">evidence gate</span></li>' +
      '</ol>' +
      '<p>A loop climbs only as high as its signal can see. With only the free judge from chapter 2, chapter 3’s archive would have filled with confident junk. That is why the parts come in this order.</p>' +
      '<div class="de-engine se-book">' + emblem('dgm') + '<p>The book builds each of these for real, in code: <em>Self-Improving Agents</em> by Micheal Lanham (Manning, in early access).</p>' +
      '<a class="de-btn" href="https://www.manning.com/books/self-improving-agents" target="_top">Read it in early access <span aria-hidden="true">↗</span></a></div>' +
      '<div class="se-row"><button class="de-btn-ghost" type="button" id="se-replay">Play again</button></div>',
      [], () => { $('se-replay').onclick = () => { S = fresh(); intro() } })
  }

  /* ---------------- start ---------------- */
  S = fresh()
  intro()
  started = true

  /* embedded handshake: the site's demo player waits for this */
  if (window.self !== window.top) {
    try { window.parent.postMessage({ type: 'unity-ready' }, window.location.origin) } catch (e) { /* parent gone */ }
  }

  /* test hook */
  const STARTS = { 1: c1Good, 2: c2Task, 3: c3Intro, 4: finale }
  window.__selection = {
    state: () => JSON.parse(JSON.stringify({ scene: S.scene, chapter: S.chapter, learned: S.learned, c1: S.c1, c2: S.c2, c3: S.c3, deployed: deployedScore() })),
    actions: () => Array.from($('scene').querySelectorAll('button:not([disabled])')).map((b) => b.id).filter(Boolean),
    click: (id) => { const b = $(id); if (b && !b.disabled && $('scene').contains(b)) { b.click(); return true } return false },
    start: (ch) => { S = fresh(); if (STARTS[ch]) STARTS[ch](); return S.scene },
    judgeOnly,
  }
})()
