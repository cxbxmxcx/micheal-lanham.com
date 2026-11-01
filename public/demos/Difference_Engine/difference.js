/* The Difference Engine: a child learns arithmetic in four stages, and the
   player searches for the method behind the times table. Everything here is
   deterministic: the gears run as written, and every number shown is
   computed from them. No network requests. Test hook: window.__difference. */
(function () {
  'use strict'
  const $ = (id) => document.getElementById(id)
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fmt = (n) => n.toLocaleString('en-US')
  const x = (a, b) => a + ' × ' + b

  /* ---------------- the model ---------------- */

  /* Rule gears, in the order the engine tries them. Every gear but Count it
     out costs one step; Count it out counts every finger (a × b steps). */
  const GEARS = [
    { id: 'copy', name: 'Copy what you saw', rule: 'If the cell is one you were shown, copy it.', cost: '1 step', term: 'memorising' },
    { id: 'turn', name: 'Turn it around', rule: '7 × 8 is 8 × 7. If the turned cell is built, use it.', cost: '1 step', term: 'commutativity' },
    { id: 'zero', name: 'Add a zero', rule: '7 × 10 is 7 with a 0 on the end.', cost: '1 step', term: '×10 shift' },
    { id: 'double', name: 'Double it', rule: '7 × 8 is 7 × 4, doubled.', cost: '1 step', term: 'doubling' },
    { id: 'split', name: 'Split it', rule: '7 × 8 is 7 × 7 plus 7 × 1, and 7 × 13 is 7 × 10 plus 7 × 3: two built cells, added.', cost: '1 step', term: 'distributive law' },
    { id: 'add', name: 'Just add', rule: '7 × 8 is 7 + 8. Quick, and right for 2 × 2.', cost: '1 step', term: 'a false rule' },
    { id: 'count', name: 'Count it out', rule: 'Count every finger: 7 × 8 takes 56 counts. Always right.', cost: 'a × b steps', term: 'repeated addition' },
  ]
  const GEAR = Object.fromEntries(GEARS.map((g) => [g.id, g]))
  const ORDER = GEARS.map((g) => g.id)
  const sortIds = (ids) => ORDER.filter((id) => ids.includes(id))
  const mechName = (ids) => ids.length ? sortIds(ids).map((id) => GEAR[id].name).join(' + ') : 'no gears'

  /* The cells of the 10 × 10 table the candidate never sees: the nine held
     back in the owner's mockup (mockups/darwin-engine). */
  const COVER = [[3, 5], [4, 7], [5, 3], [6, 8], [7, 4], [8, 6], [9, 2], [9, 9], [10, 10]]
  const HELD = COVER.length          // 9
  const OPEN = 100 - HELD            // 91
  const isCovered = (a, b) => COVER.some(([p, q]) => p === a && q === b)
  const BUDGET = 150
  const COUNT_ALL = 3025          // 1 + 2 + … + 10, squared: every cell of the 10 × 10 counted on fingers
  const CHECKS = [[13, 7], [12, 15], [19, 18]]
  const TASKS = [[7, 8], [13, 7], [12, 15], [6, 9], [19, 18], [16, 4], [11, 11], [20, 17]]

  /* Build an N × N table cell by cell, row by row, with the given gears.
     memory(a, b) returns a remembered value or null. */
  function build (ids, N, memory) {
    const on = new Set(ids)
    const val = new Array(N * N).fill(null)
    const how = new Array(N * N).fill(null)
    const ix = (a, b) => (a - 1) * N + (b - 1)
    const has = (a, b) => Number.isInteger(a) && Number.isInteger(b) && a >= 1 && b >= 1 && a <= N && b <= N && val[ix(a, b)] !== null
    const get = (a, b) => val[ix(a, b)]
    let steps = 0
    for (let a = 1; a <= N; a++) {
      for (let b = 1; b <= N; b++) {
        let v = null, g = null, cost = 1
        const remembered = memory(a, b)
        if (on.has('copy') && remembered !== null) { v = remembered; g = 'copy' }
        else if (on.has('turn') && has(b, a)) { v = get(b, a); g = 'turn' }
        else if (on.has('zero') && b % 10 === 0 && has(a, b / 10)) { v = get(a, b / 10) * 10; g = 'zero' }
        else if (on.has('zero') && a % 10 === 0 && has(a / 10, b)) { v = get(a / 10, b) * 10; g = 'zero' }
        else if (on.has('double') && b % 2 === 0 && has(a, b / 2)) { v = get(a, b / 2) * 2; g = 'double' }
        if (g === null && on.has('split') && b >= 2) {
          const parts = b > 10 ? [10] : []
          for (let c = b - 1; c >= 1; c--) parts.push(c)
          for (const c of parts) if (has(a, c) && has(a, b - c)) { v = get(a, c) + get(a, b - c); g = 'split'; break }
        }
        if (g === null && on.has('add')) { v = a + b; g = 'add' }
        if (g === null && on.has('count')) { v = a * b; g = 'count'; cost = a * b }
        if (g !== null) { val[ix(a, b)] = v; how[ix(a, b)] = g; steps += cost }
      }
    }
    return { N, val, how, steps, at: (a, b) => val[ix(a, b)], by: (a, b) => how[ix(a, b)] }
  }

  /* Stage 3: rebuild the 10 × 10 from its open cells and grade it. */
  function grade (ids) {
    const r = build(ids, 10, (a, b) => isCovered(a, b) ? null : a * b)
    const fired = {}, wrongBy = {}
    let openRight = 0, coverRight = 0, blank = 0, wrong = 0, countSteps = 0
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const v = r.at(a, b), g = r.by(a, b)
        if (g) fired[g] = (fired[g] || 0) + 1
        if (g === 'count') countSteps += a * b
        if (v === null) blank++
        else if (v !== a * b) { wrong++; wrongBy[g] = (wrongBy[g] || 0) + 1 }
        else if (isCovered(a, b)) coverRight++
        else openRight++
      }
    }
    const checks = { open: openRight === OPEN, covered: coverRight === HELD, steps: r.steps <= BUDGET }
    return { ids: sortIds(ids), table: r, steps: r.steps, openRight, coverRight, blank, wrong, fired, wrongBy, countSteps, checks,
      valid: checks.open && checks.covered && checks.steps }
  }

  /* Stage 4: the verified 10 × 10 is memory; print the 20 × 20. */
  function print20 (ids) {
    const r = build(ids, 20, (a, b) => a <= 10 && b <= 10 ? a * b : null)
    let copied = 0, built = 0, blank = 0, wrong = 0, first = null
    for (let a = 1; a <= 20; a++) {
      for (let b = 1; b <= 20; b++) {
        const v = r.at(a, b)
        const inOld = a <= 10 && b <= 10
        if (r.by(a, b) === 'copy') copied++
        else if (v !== null) built++
        const bad = v === null || v !== a * b
        if (v === null) blank++
        else if (v !== a * b) wrong++
        if (bad && !inOld && !first) first = { a, b, v, g: r.by(a, b) }
      }
    }
    const checks = CHECKS.map(([a, b]) => ({ a, b, printed: r.at(a, b), truth: a * b, ok: r.at(a, b) === a * b }))
    return { ids: sortIds(ids), table: r, steps: r.steps, copied, built, blank, wrong, first, checks,
      checkSteps: CHECKS.reduce((s, [a, b]) => s + a * b, 0), holds: checks.every((c) => c.ok) }
  }

  /* ---------------- state ---------------- */
  let S
  function reset () {
    S = {
      scene: 'intro', ledger: { recalled: 0, reasoned: 0, steps: 0 },
      fingers: 0, groups: 0, q: 0, gears: ['copy'], notebook: [], last: null, failedNew: [], printed: null,
    }
  }
  reset()

  const STAGES = ['Fingers', 'The table', 'The search', 'Generalise', 'What it means']
  const STAGE_OF = { intro: 0, s1add: 1, s1mul: 1, s1again: 1, s2table: 2, s2q: 2, s2sum: 2, s3intro: 3, s3copy: 3, s3rack: 3, s4print: 4, s4tasks: 4, debrief: 5 }

  /* ---------------- rendering helpers ---------------- */
  const say = (t) => { $('status').textContent = t }
  function ledger () {
    $('lRecalled').textContent = fmt(S.ledger.recalled)
    $('lReasoned').textContent = fmt(S.ledger.reasoned)
    $('lSteps').textContent = fmt(S.ledger.steps)
  }
  function stages () {
    const now = STAGE_OF[S.scene]
    $('stages').innerHTML = STAGES.map((name, i) => {
      const n = i + 1
      const mark = n < now ? '<span aria-hidden="true">✓ </span><span class="de-sr">done: </span>' : ''
      return '<li' + (n === now ? ' aria-current="step"' : '') + '>' + mark + n + ' · ' + name + '</li>'
    }).join('')
  }
  /* Replace the whole scene. If the control that advanced the story had
     focus, move focus to the new heading. */
  function render (html) {
    const box = $('scene'), hadFocus = box.contains(document.activeElement)
    box.innerHTML = html
    stages(); ledger()
    const h = box.querySelector('h2')
    if (h) { h.tabIndex = -1; if (hadFocus) h.focus() }
  }
  /* Replace one part of the scene; if focus was inside it, move focus to
     the part's new heading. */
  function swap (id, html) {
    const el = $(id), hadFocus = el.contains(document.activeElement)
    el.innerHTML = html
    ledger()
    const h = el.querySelector('h3')
    if (h) { h.tabIndex = -1; if (hadFocus) h.focus() }
  }
  const next = (to, label) => '<div class="dx-row"><button class="de-btn" id="next" data-act="go" data-to="' + to + '">' + label + ' <span aria-hidden="true">▸</span></button></div>'
  const note = (label, text) => '<p class="dx-note"><span class="de-label">' + label + '</span>' + text + '</p>'
  const kicker = (t) => '<p class="de-kicker">' + t + '</p>'

  /* The mockup's board: the machine on the left, a gearbox of gauges and
     controls on the right. Stacks to one column below 860 px. */
  const board = (left, right) => '<div class="dx-board"><div class="de-engine dx-plate">' + left + '</div><div class="dx-gearbox">' + right + '</div></div>'

  /* Cyan gauges. Each item: [id, label, value, pass]; pass is true, false or
     undefined (no verdict yet). The verdict is written out, not just coloured. */
  const gauge = ([id, label, value, pass]) => '<p class="de-gauge"><span>' + label + '</span><strong id="' + id + '">' + value + '</strong>' +
    '<span class="' + markClass(pass) + '" id="' + id + 'Mark">' + mark(pass) + '</span></p>'
  const markClass = (pass) => 'dx-mark' + (pass === undefined ? '' : pass ? ' is-pass' : ' is-fail')
  const mark = (pass) => pass === undefined ? '' : pass ? '<span aria-hidden="true">✓</span> pass' : '<span aria-hidden="true">✗</span> fail'
  const gauges = (items) => '<div class="de-engine dx-gauges">' + items.map(gauge).join('') + '</div>'
  function setGauge (id, value, pass) {
    $(id).textContent = value
    const m = $(id + 'Mark')
    m.innerHTML = mark(pass)
    m.className = markClass(pass)
  }

  /* The 10 × 10 as a real table in the mockup's look. opts.held marks the
     held-back cells; opts.result colours a rebuild; opts.hit rings one cell. */
  function timesTable (opts) {
    opts = opts || {}
    const r = opts.result
    let h = '<table class="dx-table"><caption class="de-sr">' + (opts.caption || 'The 10 by 10 times table') + '</caption><thead><tr><th scope="col">×</th>'
    for (let b = 1; b <= 10; b++) h += '<th scope="col">' + b + '</th>'
    h += '</tr></thead><tbody>'
    for (let a = 1; a <= 10; a++) {
      h += '<tr><th scope="row">' + a + '</th>'
      for (let b = 1; b <= 10; b++) {
        const held = opts.held && isCovered(a, b)
        const cls = []
        let text
        if (held) cls.push('is-held')
        if (r) {
          const v = r.table.at(a, b)
          if (v === null) { cls.push('is-blank'); text = '<span aria-hidden="true">–</span><span class="de-sr">blank</span>' }
          else if (v !== a * b) { cls.push('is-bad'); text = v + '<span class="de-sr"> wrong</span>' }
          else { cls.push('is-ok'); text = String(v) }
          if (held) text += '<span class="de-sr"> held back</span>'
        } else if (held) {
          text = '<span aria-hidden="true">?</span><span class="de-sr">held back</span>'
        } else {
          text = String(a * b)
          if (opts.hit && opts.hit[0] === a && opts.hit[1] === b) cls.push('is-hit')
        }
        h += '<td' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + text + '</td>'
      }
      h += '</tr>'
    }
    return h + '</tbody></table>'
  }
  const GRID_KEY = '<p class="dx-key-line">Key: a cyan number was rebuilt right; struck through with a dashed frame is wrong; a dash is blank; a hatched cell was held back.</p>'
  const plate = (title, table, extra) => kicker(title) + '<div id="plate">' + table + '</div>' + (extra || '')
  const heldTitle = 'The known table · ' + ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][HELD] + ' cells held back'
  const checkGauges = (r) => gauges([
    ['gOpen', 'Visible cells', r ? r.openRight + ' / ' + OPEN : '— / ' + OPEN, r && r.checks.open],
    ['gHeld', 'Held back', r ? r.coverRight + ' / ' + HELD : '— / ' + HELD, r && r.checks.covered],
    ['gSteps', 'Steps to rebuild', r ? fmt(r.steps) + ' / ' + BUDGET : '— / ' + BUDGET, r && r.checks.steps],
  ])

  /* ---------------- scenes ---------------- */
  const SKETCH = '<div class="de-sketch dx-sketch" aria-hidden="true"><svg viewBox="0 0 240 120">' +
    '<path d="M16 110h208M28 110V14M212 110V14M22 14h196M22 20h196"/>' +
    [70, 120, 170].map((cx) => '<path d="M' + cx + ' 22v84"/>' + [34, 54, 74, 94].map((cy) =>
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="17" ry="6"/><path d="M' + (cx - 17) + ' ' + cy + 'v4M' + (cx + 17) + ' ' + cy + 'v4M' + (cx - 9) + ' ' + (cy + 5) + 'v3M' + (cx + 9) + ' ' + (cy + 5) + 'v3"/>').join('')).join('') +
    '<path d="M214 60h14a6 6 0 1 1 0 12h-14"/></svg></div>'

  const SCENES = {
    intro: () =>
      kicker('Learning to learn') +
      '<h2>How does a learner learn to learn?</h2>' +
      '<p>Follow a child through arithmetic. First they work answers out on their fingers. Then they are given a times table, and remember. ' +
      'Then comes the interesting part: <b>finding the method that could have written the table</b>, checking it, and using it to write a bigger one.</p>' +
      '<p>You will play the child, then the machine that watches how the child learns.</p>' +
      SKETCH +
      note('Book term', '<b>Metacognition</b>: a harness that does not just learn, but searches for better ways to learn.') +
      next('s1add', 'Stage 1: Fingers'),

    s1add: () =>
      kicker('Stage 1 · Fingers') +
      '<h2>Counting to add</h2>' +
      '<p class="dx-q">3 + 4 = ?</p>' +
      '<p>The child holds up three fingers and counts on, one finger at a time.</p>' +
      '<div class="de-engine dx-machine"><div class="dx-fingers" id="fingers"></div><p id="countText"></p></div>' +
      '<div id="out" class="dx-out"><button class="de-btn" id="count" data-act="countAdd">Count a finger</button></div>' +
      note('Book term', '<b>System 2</b>: slow thinking that works the answer out, step by step.'),

    s1mul: () =>
      kicker('Stage 1 · Fingers') +
      '<h2>Counting to multiply</h2>' +
      '<p class="dx-q">4 × 3 = ?</p>' +
      '<p>Three groups of four. The child counts every finger in every group.</p>' +
      '<div class="de-engine dx-machine"><div class="dx-fingers" id="fingers"></div><p id="countText"></p></div>' +
      '<div id="out" class="dx-out"><button class="de-btn" id="count" data-act="countMul">Count a group of four</button></div>',

    s1again: () =>
      kicker('Stage 1 · Fingers') +
      '<h2>The same question, the next day</h2>' +
      '<p class="dx-q">4 × 3 = ?</p>' +
      '<p>Nothing was kept from yesterday. Counting leaves no trace, so the child counts all twelve again.</p>' +
      '<div id="out" class="dx-out"><button class="de-btn" id="count" data-act="countAgain">Count all twelve again</button></div>',

    s2table: () =>
      kicker('Stage 2 · The table') +
      '<h2>A table to remember</h2>' +
      '<p>A teacher hands over the 10 × 10 times table to learn by heart. Now any answer inside the table is a memory: the child just knows it, in one step.</p>' +
      board(plate('Memory · the 10 × 10 times table', timesTable()),
        note('Book term', '<b>System 1</b>: fast, automatic recall. The table is <b>learned memory</b>, shared with every question of this kind.') +
        next('s2q', 'First question')),

    s2q: () => {
      const q = Q2[S.q]
      return kicker('Stage 2 · The table') +
        '<h2>Question ' + (S.q + 1) + ' of ' + Q2.length + '</h2>' +
        board(plate('Memory · the 10 × 10 times table', timesTable()),
          '<p class="dx-q">' + x(q.a, q.b) + ' = ?</p>' +
          '<div id="out" class="dx-out"><button class="de-btn" id="lookup" data-act="lookup">Look it up in the table</button></div>')
    },

    s2sum: () =>
      kicker('Stage 2 · The table') +
      '<h2>Fast inside the edges, slow outside</h2>' +
      '<p>Two of the three questions were recall, one step each. The third sat outside the table and took five steps of reasoning, ' +
      'and it will take five steps every time it is asked.</p>' +
      '<p>Where did the table come from? Somebody worked out every cell. If the child could find <b>the method that writes the table</b>, ' +
      'they could write a bigger one, and more questions would become recall.</p>' +
      next('s3intro', 'Stage 3: The search'),

    s3intro: () =>
      kicker('Stage 3 · The search') +
      '<h2>Find the rule that rebuilds the table</h2>' +
      '<p>A candidate method is a set of rule gears. To pass, it must rebuild this whole table. ' +
      'It may copy any visible cell, but <b>' + HELD + ' cells are held back</b>: the method never sees them, and it is graded on them.</p>' +
      board(plate(heldTitle, timesTable({ held: true, caption: 'The 10 by 10 times table with ' + HELD + ' cells held back' })),
        gauges([['tOpen', 'Visible cells', 'all ' + OPEN], ['tHeld', 'Held back', 'all ' + HELD], ['tSteps', 'Step budget', '≤ ' + BUDGET]]) +
        '<p class="dx-small">To pass, every visible cell and every held-back cell must come out right, in no more than ' + BUDGET + ' steps: ' +
        'one and a half a cell. Counting all 100 cells on fingers takes ' + fmt(COUNT_ALL) + '.</p>' +
        next('s3copy', 'Try the obvious candidate')) +
      note('Term', '<b>Held-back cells</b>: answers kept from the learner so a test can tell learning from memorising.'),

    s3copy: () =>
      kicker('Stage 3 · The search') +
      '<h2>Candidate 1: Copy what you saw</h2>' +
      '<p>The simplest method there is: one gear that copies every cell it was shown.</p>' +
      board(plate(heldTitle, timesTable({ held: true, caption: 'The 10 by 10 times table with ' + HELD + ' cells held back' }), GRID_KEY),
        '<div class="de-engine"><p class="de-kicker">Rule gears in the mechanism</p><div class="dx-rules"><span class="de-chip is-on"><span aria-hidden="true">✓&nbsp;</span>Copy what you saw</span></div></div>' +
        checkGauges(null) +
        '<div id="out" class="dx-out"><div class="dx-row"><button class="de-btn" id="test" data-act="testCopy">Test the mechanism</button></div></div>'),

    s3rack: () =>
      kicker('Stage 3 · The search') +
      '<h2>Find the rule that rebuilds the table</h2>' +
      '<p>Choose rule gears, then test the mechanism: it rebuilds the table left to right, top to bottom. ' +
      'For each cell it tries its gears in the order listed and uses the first one that works.</p>' +
      board(plate(heldTitle, timesTable({ held: true, result: S.last, caption: 'The 10 by 10 times table with ' + HELD + ' cells held back' }), GRID_KEY),
        '<div class="de-engine"><p class="de-kicker" id="rulesLabel">Rule gears in the mechanism</p>' +
        '<div class="dx-rules" role="group" aria-labelledby="rulesLabel">' +
        GEARS.map((g) => '<button class="de-chip" id="g-' + g.id + '" data-act="gear" data-gear="' + g.id + '" aria-pressed="' + S.gears.includes(g.id) + '" aria-describedby="rule-' + g.id + '">' +
          '<span class="dx-on" aria-hidden="true">✓&nbsp;</span>' + g.name + '</button>').join('') +
        '</div><ul class="dx-key">' +
        GEARS.map((g) => '<li id="rule-' + g.id + '"><b>' + g.name + '.</b> ' + g.rule + ' ' + g.cost + '. <span class="dx-term">' + g.term + '</span></li>').join('') +
        '</ul><p class="dx-mech" id="mech"></p></div>' +
        checkGauges(S.last) +
        '<div class="dx-row"><button class="de-btn" id="test" data-act="test">Test the mechanism</button>' +
        '<button class="de-btn-ghost" id="next" data-act="go" data-to="s4print" disabled>Print a 20 × 20 table</button></div>' +
        '<div class="dx-small" id="hint"><p>Add or remove gears, then test. A passing mechanism can print a bigger table.</p></div>') +
      '<h3>Notebook</h3><ol class="dx-notebook" id="notebook"></ol>',

    s4print: () =>
      kicker('Stage 4 · Generalise') +
      '<h2>Print a bigger table</h2>' +
      '<p>Your method rebuilt the 10 × 10, including ' + HELD + ' cells it never saw. Now the whole 10 × 10 becomes its memory, ' +
      'and it prints a 20 × 20 table: 300 new cells that nobody gave it.</p>' +
      board('<div id="printPlate">' + plate('Memory · the verified 10 × 10', timesTable()) + '</div>',
        '<p class="dx-mech">Method: ' + esc(mechName(S.gears)) + '.</p>' +
        gauges([['pCells', 'Printed cells', '— / 400'], ['pSteps', 'Steps to print', '—'], ['pChecked', 'Checked by counting', '— / 3']]) +
        '<div id="out" class="dx-out"><div class="dx-row"><button class="de-btn" id="print" data-act="print">Print the 20 × 20 table</button></div></div>'),

    s4tasks: () =>
      kicker('Stage 4 · Generalise') +
      '<h2>The same kind of question, a bigger memory</h2>' +
      '<p>Eight more times questions, up to 20 × 20. Compare how each would be answered with the table the teacher gave, and with the one your method printed.</p>' +
      '<div id="out" class="dx-out"><button class="de-btn" id="ask" data-act="ask">Ask all eight</button></div>',

    debrief: () =>
      kicker('What it means') +
      '<h2>What the engine learned</h2>' +
      '<div class="dx-roads">' +
      '<div class="de-engine dx-road"><h3>The table is shared memory</h3><p>It sits beside every question of one kind, so answers are recalled instead of worked out. ' +
      'In an agent harness this is the learned input added to a task before the model sees it.</p></div>' +
      '<div class="de-engine dx-road"><h3>The method is the learning skill</h3><p>It is what writes the table, and it can write more of it. ' +
      'Your method: ' + esc(mechName(S.gears)) + '.</p></div>' +
      '<div class="de-engine dx-road"><h3>The search is metacognition</h3><p>Trying methods, testing them on cells they never saw, and checking what they print on new ground before trusting it.</p></div>' +
      '</div>' +
      '<p>Swap the child for a frozen language model, and the times table for any family of agent tasks. The harness cannot change the model. ' +
      'It can change what the model is handed with each task, and it can learn how to write that, so more of the family becomes fast recall and less of it needs slow reasoning.</p>' +
      note('Book terms', 'the table is <b>learned memory</b> (System 1), the reasoning it replaces is <b>System 2</b>, and the search for the method is <b>metacognition</b>.') +
      '<div class="de-panel dx-book"><p>A companion to <em>The Instinctual Learning Agent Harness</em> (Packt, in development).</p>' +
      '<a class="de-btn" href="/books/instinctual-learning-agent-harness/" target="_top">About the book</a></div>' +
      '<div class="dx-row"><button class="de-btn-ghost" id="replay" data-act="replay"><span aria-hidden="true">↺</span> Play again</button></div>',
  }

  const Q2 = [
    { a: 3, b: 4, note: 'On fingers, in Stage 1, this took 12 steps.' },
    { a: 7, b: 8, note: 'Counting it out would take 56 steps.' },
    { a: 13, b: 7 },
  ]

  function go (name) {
    S.scene = name
    render(SCENES[name]())
    if (name === 's1add' || name === 's1mul') drawFingers()
    if (name === 's3rack') { drawMech(); drawNotebook(); if (S.last) drawResult(S.last, false) }
  }

  /* ---------------- stage 1: fingers ---------------- */
  function drawFingers () {
    const f = (n, cls) => '<span class="dx-f ' + cls + '">' + (n || '') + '</span>'
    if (S.scene === 's1add') {
      let h = ''
      for (let i = 1; i <= 3; i++) h += f(i, 'is-held')
      for (let i = 1; i <= 4; i++) h += i <= S.fingers ? f(3 + i, 'is-counted') : f('', '')
      $('fingers').innerHTML = '<div class="dx-group" aria-hidden="true">' + h + '</div>'
      const counted = []
      for (let i = 1; i <= S.fingers; i++) counted.push(3 + i)
      $('countText').textContent = 'Holding 3. Counted on: ' + (counted.length ? counted.join(', ') : 'nothing yet') + '.'
    } else {
      let h = ''
      for (let g = 0; g < 3; g++) {
        h += '<div class="dx-group" aria-hidden="true">'
        for (let i = 1; i <= 4; i++) h += g < S.groups ? f(g * 4 + i, 'is-counted') : f('', '')
        h += '</div>'
      }
      $('fingers').innerHTML = h
      $('countText').textContent = 'Groups counted: ' + S.groups + ' of 3. Count so far: ' + S.groups * 4 + '.'
    }
  }

  const ACT = {
    go: (b) => go(b.dataset.to),

    countAdd: () => {
      if (S.fingers >= 4) return
      S.fingers++; S.ledger.steps++
      drawFingers(); ledger()
      say('Counted ' + (3 + S.fingers) + '.')
      if (S.fingers === 4) {
        S.ledger.reasoned++
        swap('out', '<h3>3 + 4 = 7, in 4 steps</h3><p>Right, and it will be right every time. It will also take four steps every time.</p>' +
          next('s1mul', 'A times question'))
        say('3 plus 4 is 7, in 4 steps.')
      }
    },

    countMul: () => {
      if (S.groups >= 3) return
      S.groups++; S.ledger.steps += 4
      drawFingers(); ledger()
      say('Count so far: ' + S.groups * 4 + '.')
      if (S.groups === 3) {
        S.ledger.reasoned++
        swap('out', '<h3>4 × 3 = 12, in 12 steps</h3><p>One step for every finger. Bigger questions mean more fingers: 7 × 8 would take 56 counts.</p>' +
          next('s1again', 'Ask it again'))
        say('4 times 3 is 12, in 12 steps.')
      }
    },

    countAgain: () => {
      S.ledger.steps += 12; S.ledger.reasoned++
      swap('out', '<h3>4 × 3 = 12, another 12 steps</h3>' +
        '<p>Three questions, ' + S.ledger.steps + ' steps, and the next question costs just as much. Reasoning always works, but it never gets cheaper on its own.</p>' +
        next('s2table', 'Stage 2: The table'))
      say('Another 12 steps. ' + S.ledger.steps + ' steps so far.')
    },

    lookup: () => {
      const q = Q2[S.q]
      if (q.a <= 10 && q.b <= 10) {
        S.ledger.recalled++; S.ledger.steps++
        $('plate').innerHTML = timesTable({ hit: [q.a, q.b], caption: 'The 10 by 10 times table, with ' + x(q.a, q.b) + ' marked' })
        swap('out', '<h3>Recalled: ' + x(q.a, q.b) + ' = ' + q.a * q.b + ', in 1 step</h3><p>' + q.note + '</p>' +
          next(S.q + 1 < Q2.length ? 's2q' : 's2sum', 'Next question'))
        S.q++
        say('Recalled. ' + x(q.a, q.b) + ' = ' + q.a * q.b + '.')
      } else {
        swap('out', '<h3>' + x(q.a, q.b) + ' is not in the table</h3>' +
          '<p>The table stops at 10. There is no row 13, so recall has nothing to give. The child falls back on reasoning, with rules they already know.</p>' +
          '<div class="dx-row"><button class="de-btn" id="reason" data-act="reason">Reason it out</button></div>')
        say(x(q.a, q.b) + ' is not in the table.')
      }
    },

    reason: () => {
      S.ledger.reasoned++; S.ledger.steps += 5
      swap('out', '<h3>Reasoned: 13 × 7 = 91, in 5 steps</h3>' +
        '<ol class="dx-list"><li>Turn it around: 13 × 7 is the same as 7 × 13.</li><li>Split 13 into 10 and 3.</li>' +
        '<li>7 × 10 = 70: add a zero to 7.</li><li>7 × 3 = 21: recalled from the table.</li><li>70 + 21 = 91.</li></ol>' +
        '<p>Counting fingers would take 91 steps. Rules and memory made the reasoning shorter, but it is still reasoning: five steps, every time someone asks.</p>' +
        next('s2sum', 'What changed?'))
      S.q++
      say('Reasoned: 13 times 7 is 91, in 5 steps.')
    },

    testCopy: () => {
      const r = grade(['copy'])
      record(r)
      showTest(r)
      swap('out', '<h3>It memorised. It did not learn.</h3>' +
        '<p>' + esc(hint(r)) + '</p>' +
        '<p>A method that only copies is perfect on everything it was shown and blank on everything else. Passing on the visible cells proved nothing; the held-back cells caught it.</p>' +
        note('Term', '<b>Overfitting</b>: matching the examples you learned from without capturing the rule behind them.') +
        next('s3rack', 'Open the gear rack'))
      say('Visible cells ' + OPEN + ' of ' + OPEN + '. Held back 0 of ' + HELD + '. It memorised; it did not learn.')
    },

    gear: (b) => {
      const id = b.dataset.gear
      S.gears = S.gears.includes(id) ? S.gears.filter((g) => g !== id) : sortIds([...S.gears, id])
      const on = S.gears.includes(id)
      b.setAttribute('aria-pressed', String(on))
      drawMech()
      if (S.last) {
        $('next').disabled = true
        $('plate').classList.add('is-stale')
        $('hint').innerHTML = '<p>Gears changed since the last test. Test the mechanism again.</p>'
      }
      say(GEAR[id].name + (on ? ' in the mechanism.' : ' taken out.'))
    },

    test: () => {
      const r = grade(S.gears)
      record(r)
      S.last = r
      drawResult(r, true)
      drawNotebook()
    },

    print: () => {
      const p = S.printed = print20(S.gears)
      $('printPlate').innerHTML = kicker('The printed table · 20 × 20') + printSvg(p) +
        '<ul class="dx-legend">' +
        '<li><svg viewBox="0 0 10 10" aria-hidden="true"><rect width="10" height="10" style="fill:var(--de-brass)"/></svg>copied from memory: ' + p.copied + '</li>' +
        '<li><svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="1.5" width="7" height="7" style="fill:var(--de-verdigris);stroke:var(--de-glow)"/></svg>built by the method: ' + p.built + '</li>' +
        (p.blank ? '<li><svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="1" width="8" height="8" style="fill:none;stroke:var(--de-iron-dim)"/></svg>blank: ' + p.blank + '</li>' : '') +
        '</ul>'
      setGauge('pCells', (400 - p.blank) + ' / 400')
      setGauge('pSteps', fmt(p.steps))
      swap('out', '<h3>Printed ' + (400 - p.blank) + ' of 400 cells in ' + fmt(p.steps) + ' steps</h3>' +
        '<p>Counting all 400 cells on fingers would take ' + fmt(44100) + ' steps. Before trusting the new table, check some of it the slow way.</p>' +
        '<div id="out2"><div class="dx-row"><button class="de-btn" id="check" data-act="check">Check three new cells by counting</button></div></div>')
      say('Printed ' + (400 - p.blank) + ' of 400 cells in ' + fmt(p.steps) + ' steps.')
    },

    check: () => {
      const p = S.printed
      const rows = p.checks.map((c) => '<li>' + (c.ok ? '<span aria-hidden="true">✓</span>' : '<span aria-hidden="true">✗</span>') + ' ' + x(c.a, c.b) +
        ': printed ' + (c.printed === null ? 'blank' : c.printed) + ', counted ' + c.truth + (c.ok ? ', a match' : ', no match') +
        (c.a === 13 && c.b === 7 ? ' (you reasoned this one out in Stage 2)' : '') + '.</li>').join('')
      const right = p.checks.filter((c) => c.ok).length
      setGauge('pChecked', right + ' / 3', p.holds)
      if (p.holds) {
        swap('out2', '<h3>Checked: ' + right + ' of 3 match</h3><ul class="dx-list">' + rows + '</ul>' +
          '<p>Checking took ' + p.checkSteps + ' counting steps, spent once. Every rule in your method is true, and now it has been seen working on new ground.</p>' +
          next('s4tasks', 'Ask the questions again'))
        say('Checked: 3 of 3 match. The new table holds.')
      } else {
        const key = p.ids.join('+')
        if (!S.failedNew.includes(key)) S.failedNew.push(key)
        const entry = S.notebook.slice().reverse().find((n) => n.key === key && n.valid)
        if (entry) entry.failedNew = true
        swap('out2', '<h3>Checked: ' + right + ' of 3 match. The new table fails.</h3><ul class="dx-list">' + rows + '</ul>' +
          '<p>' + explainFailure(p) + '</p>' +
          '<p>A test only vouches for the gears it makes run. Passing the 10 × 10 was not the same as having learned the rule.</p>' +
          '<div class="dx-row"><button class="de-btn" id="back" data-act="back">Back to the gear rack</button></div>')
        say('Checked: ' + right + ' of 3 match. The new table fails.')
      }
    },

    back: () => { S.last = null; go('s3rack') },

    ask: () => {
      S.ledger.recalled += TASKS.length; S.ledger.steps += TASKS.length
      const before = TASKS.filter(([a, b]) => a <= 10 && b <= 10).length
      const rows = TASKS.map(([a, b]) => '<tr><td>' + x(a, b) + '</td><td>' + a * b + '</td><td>' +
        (a <= 10 && b <= 10 ? 'recall' : 'reason') + '</td><td>recall</td></tr>').join('')
      swap('out', '<h3>Given table: ' + before + ' recalled, ' + (TASKS.length - before) + ' reasoned. Printed table: all ' + TASKS.length + ' recalled.</h3>' +
        '<div class="de-engine dx-machine"><table class="dx-tasks"><caption class="de-sr">Eight questions, answered with each memory</caption>' +
        '<thead><tr><th scope="col">Question</th><th scope="col">Answer</th><th scope="col">With the 10 × 10</th><th scope="col">With the 20 × 20</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
        '<p>Learning took work once: ' + fmt(S.printed.steps) + ' steps to print and ' + S.printed.checkSteps + ' to check. ' +
        'After that, every question in the bigger table is one step of recall. Slow reasoning became fast memory, for the whole family of questions, not just the ones already asked.</p>' +
        next('debrief', 'What just happened'))
      say('With the given table, ' + before + ' recalled and ' + (TASKS.length - before) + ' reasoned. With the printed table, all ' + TASKS.length + ' recalled.')
    },

    replay: () => { reset(); go('intro') },
  }

  /* ---------------- stage 3: results and notebook ---------------- */
  function record (r) {
    const key = r.ids.join('+')
    let verdict
    if (!r.ids.length) verdict = 'empty mechanism'
    else if (r.wrong) verdict = 'wrong cells'
    else if (r.blank) verdict = 'blank cells'
    else if (!r.checks.steps) verdict = 'too slow'
    else verdict = 'passes'
    S.notebook.push({ key, name: mechName(r.ids), open: r.openRight, covered: r.coverRight, steps: r.steps, valid: r.valid, verdict, failedNew: S.failedNew.includes(key) })
  }

  function drawNotebook () {
    const nb = $('notebook')
    if (!nb) return
    nb.innerHTML = S.notebook.length ? S.notebook.map((n) => '<li><b>' + esc(n.name) + '</b>: visible ' + n.open + '/' + OPEN + ', held back ' + n.covered + '/' + HELD + ', ' + fmt(n.steps) + ' steps. ' +
      (n.failedNew ? '<span class="is-fail"><span aria-hidden="true">✗</span> passed here, failed on the 20 × 20</span>'
        : n.valid ? '<span class="is-pass"><span aria-hidden="true">✓</span> passes</span>'
        : '<span class="is-fail"><span aria-hidden="true">✗</span> ' + n.verdict + '</span>') + '</li>').join('')
      : '<li>No tests yet.</li>'
  }

  function drawMech () {
    const m = $('mech')
    if (m) m.textContent = 'In the mechanism: ' + mechName(S.gears) + '.'
  }

  function hint (r) {
    const used = (id) => r.fired[id] || 0
    if (!r.ids.length) return 'The mechanism is empty. Put at least one gear in.'
    if (r.wrong) {
      const by = Object.keys(r.wrongBy).map((g) => GEAR[g].name + ' (' + r.wrongBy[g] + ')').join(', ')
      return r.wrong + ' cells are wrong. Gears that made wrong cells: ' + by + '. A wrong cell spreads: any gear that builds on it goes wrong too.'
    }
    if (r.blank) {
      if (r.ids.includes('copy') && r.openRight === OPEN) return 'Copy can only copy what it was shown, so the ' + r.blank + ' held-back cells came out blank. Add a gear that can make a cell from other cells.'
      return r.blank + ' cells came out blank: no gear in the mechanism could make them.'
    }
    if (!r.checks.steps) return 'Every cell is right, but it took ' + fmt(r.steps) + ' steps. Count it out did ' + used('count') + ' cells by hand, ' + fmt(r.countSteps) + ' steps of counting. Look for a gear that builds a cell from cells already built.'
    const idle = r.ids.filter((id) => !used(id))
    return 'All three checks pass: this mechanism rebuilt the table, including the ' + HELD + ' cells it never saw.' +
      (idle.length ? ' Never used on this table: ' + idle.map((id) => GEAR[id].name).join(', ') + '. The test cannot vouch for a gear it never ran.' : '')
  }

  /* Paint a test onto the board: the rebuilt table and the three gauges. */
  function showTest (r) {
    $('plate').innerHTML = timesTable({ held: true, result: r, caption: 'The table as rebuilt by test ' + S.notebook.length })
    $('plate').classList.remove('is-stale')
    setGauge('gOpen', r.openRight + ' / ' + OPEN, r.checks.open)
    setGauge('gHeld', r.coverRight + ' / ' + HELD, r.checks.covered)
    setGauge('gSteps', fmt(r.steps) + ' / ' + BUDGET, r.checks.steps)
  }

  function drawResult (r, announce) {
    const key = r.ids.join('+')
    const known = S.failedNew.includes(key)
    showTest(r)
    const fired = r.ids.map((id) => GEAR[id].name + ': ' + (r.fired[id] ? r.fired[id] + (r.fired[id] === 1 ? ' cell' : ' cells') : 'never used')).join('; ')
    const listOf = (arr) => arr.length > 12 ? arr.slice(0, 12).join(', ') + ' and ' + (arr.length - 12) + ' more' : arr.join(', ')
    const wrongList = [], blankList = []
    for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
      const v = r.table.at(a, b)
      if (v === null) blankList.push(x(a, b)); else if (v !== a * b) wrongList.push(x(a, b) + ' = ' + v)
    }
    $('hint').innerHTML = '<p><b>Test ' + S.notebook.length + ': ' + esc(mechName(r.ids)) + '.</b> ' + esc(hint(r)) + '</p>' +
      (r.valid && known ? '<p>This exact mechanism already passed here and failed on the 20 × 20. Change a gear and test again.</p>' : '') +
      (r.ids.length ? '<p>Gears used: ' + esc(fired) + '.</p>' : '') +
      (wrongList.length ? '<p>Wrong: ' + esc(listOf(wrongList)) + '.</p>' : '') +
      (blankList.length ? '<p>Blank: ' + esc(listOf(blankList)) + '.</p>' : '')
    $('next').disabled = !(r.valid && !known)
    if (announce) {
      say('Test ' + S.notebook.length + '. Visible cells ' + r.openRight + ' of ' + OPEN + ', held back ' + r.coverRight + ' of ' + HELD + ', ' + r.steps + ' steps. ' +
        (r.valid ? (known ? 'Passes, but this mechanism already failed on the 20 by 20.' : 'All three checks pass. You can print the 20 by 20 table.') : hint(r)))
    }
  }

  /* ---------------- stage 4: the print ---------------- */
  function printSvg (p) {
    let cells = ''
    for (let a = 1; a <= 20; a++) {
      for (let b = 1; b <= 20; b++) {
        const v = p.table.at(a, b), g = p.table.by(a, b)
        const X = (b - 1) * 10, Y = (a - 1) * 10
        /* Wrong cells look like any other printed cell: the engine cannot
           tell until someone checks them the slow way. */
        if (v === null) cells += '<rect class="b" x="' + (X + 1) + '" y="' + (Y + 1) + '" width="8" height="8"/>'
        else if (g === 'copy') cells += '<rect class="m" x="' + X + '" y="' + Y + '" width="10" height="10"/>'
        else cells += '<rect class="n" x="' + (X + 1.5) + '" y="' + (Y + 1.5) + '" width="7" height="7" style="--d:' + ((a + b) * 0.03).toFixed(2) + 's"/>'
      }
    }
    return '<svg class="dx-print" viewBox="0 0 200 200" aria-hidden="true">' + cells + '</svg>'
  }

  function explainFailure (p) {
    const f = p.first
    const newBad = 300 - countNewRight(p)
    if (!f) return 'Some new cells are wrong.'
    if (f.v === null) {
      return newBad + ' of the 300 new cells are blank, starting with ' + x(f.a, f.b) + '. ' +
        'Inside the 10 × 10, Copy made the first cell of every row. Out here there is nothing to copy, and no other gear in your mechanism can start a row. ' +
        'The 10 × 10 test could not show this, because Copy always filled in for it.'
    }
    if (f.g === 'add') {
      const ranBefore = grade(p.ids).fired.add || 0
      return newBad + ' of the 300 new cells are wrong, starting with ' + x(f.a, f.b) + ', which Just add made ' + f.v + '. ' +
        (ranBefore ? 'Just add ran on only ' + ranBefore + ' cells of the 10 × 10. ' : 'Just add never ran on the 10 × 10: Copy filled every cell it could have touched. ') +
        'Every cell built on a wrong one went wrong too.'
    }
    return newBad + ' of the 300 new cells are wrong, starting with ' + x(f.a, f.b) + ', which ' + GEAR[f.g].name + ' made ' + f.v + '.'
  }
  function countNewRight (p) {
    let n = 0
    for (let a = 1; a <= 20; a++) for (let b = 1; b <= 20; b++) if ((a > 10 || b > 10) && p.table.at(a, b) === a * b) n++
    return n
  }

  /* ---------------- wiring ---------------- */
  $('scene').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]')
    if (!b || b.disabled) return
    const fn = ACT[b.dataset.act]
    if (fn) fn(b)
  })

  /* embedded handshake: the site's demo player waits for this */
  if (window.self !== window.top) {
    try { window.parent.postMessage({ type: 'unity-ready' }, window.location.origin) } catch (e) { /* no-op */ }
  }

  /* test hook */
  window.__difference = {
    state: () => JSON.parse(JSON.stringify({ scene: S.scene, stage: STAGE_OF[S.scene], ledger: S.ledger, gears: S.gears, notebook: S.notebook,
      failedNew: S.failedNew, q: S.q, fingers: S.fingers, groups: S.groups,
      last: S.last && { ids: S.last.ids, openRight: S.last.openRight, coverRight: S.last.coverRight, steps: S.last.steps, valid: S.last.valid },
      printed: S.printed && { ids: S.printed.ids, steps: S.printed.steps, copied: S.printed.copied, built: S.printed.built, blank: S.printed.blank, wrong: S.printed.wrong, holds: S.printed.holds } })),
    click: (id) => { const b = $(id); if (b && !b.disabled) { b.click(); return true } return false },
    setGears: (ids) => {
      for (const g of GEARS) { const b = $('g-' + g.id); if (b && (b.getAttribute('aria-pressed') === 'true') !== ids.includes(g.id)) b.click() }
      return S.gears.slice()
    },
    grade: (ids) => { const r = grade(ids); return { openRight: r.openRight, coverRight: r.coverRight, steps: r.steps, valid: r.valid, blank: r.blank, wrong: r.wrong } },
    print: (ids) => { const p = print20(ids); return { steps: p.steps, blank: p.blank, wrong: p.wrong, holds: p.holds } },
  }

  go('intro')
})()
