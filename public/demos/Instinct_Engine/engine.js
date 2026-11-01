/* The Instinct Engine: the simulation core. No DOM, no randomness, no network.
   The page (index.html) renders it; the tests drive it through window.__instinct.

   Units: time is kept in tenths of a second and cost in tenths of a cent, so
   every total is an exact integer. They are illustrative game units, chosen to
   show the shape of the trade, not measurements of any model. */
(function (root) {
  'use strict'

  const ROUTES = {
    s1: { name: 'System 1', t: 20, c: 10 },
    s2: { name: 'System 2', t: 300, c: 200 },
    mem: { name: 'Memory card', t: 20, c: 20 },
    jev: { name: 'Jev', t: 1, c: 1 },
  }
  const JEV_THRESHOLD = 0.8
  const SERVICE = 40
  const PRICES = { mainspring: 25, gear: 12, glass: 18, 'pendulum rod': 30, 'chime hammer': 9 }
  const FAMILIES = {
    W: 'Warranty question',
    Q: 'Quote request',
    E: 'Clock-care question',
    N: 'One-off request',
  }

  /* Warranty cases: covered when bought here within the warranty period and
     not damaged by a drop or water. The period is 12 months until the shop
     edits its policy book before day 4, then 6 months. s1 is what System 1
     says with no card: a confident, generic guess that is always wrong. */
  const W = (id, months, cause, text, s1, p, extra) => Object.assign({ id, fam: 'W', months, cause, text, s1, p }, extra)
  const Q = (id, parts, text) => ({ id, fam: 'Q', parts, text })
  const DAYS = [
    { title: 'Everything is new', tasks: [
      { id: 'E1', fam: 'E', text: 'How often should I wind an eight-day clock?', answer: 'About once a week, on the same day, before it runs down.' },
      W('W1', 4, 'stopped', 'My mantel clock, bought here 4 months ago, has stopped ticking. Is the repair covered?', 'Not covered: most warranties end after 90 days.', 0.97),
      Q('Q1', ['mainspring'], 'How much to replace the mainspring in my carriage clock?'),
      { id: 'N0', fam: 'N', text: 'I have a ship’s chronometer with a chain inside I don’t recognise. Can you service it?', answer: 'Probably: it sounds like a fusee chain. Bring it in so we can look before we promise a date or a price.', s1: 'Yes, $40, ready tomorrow.' },
      W('W2', 14, 'stopped', 'I bought my wall clock here 14 months ago and the chime is off. Covered?', 'Covered: chimes are always under warranty.', 0.96),
    ] },
    { title: 'Instinct', tasks: [
      W('W3', 3, 'drop', 'Bought here 3 months ago. I knocked it off a shelf and the case cracked. Covered?', 'Covered: it is under 90 days old.', 0.97),
      Q('Q2', ['gear', 'gear', 'glass'], 'What would two new gears and a new glass cost?'),
      { id: 'E2', fam: 'E', text: 'Is it all right to move my pendulum clock while it’s running?', answer: 'Stop the pendulum first, and move the clock upright.' },
      W('W4', 9, 'stopped', 'The hands on my clock are stuck. I bought it here 9 months ago. Covered?', 'Not covered: most warranties end after 90 days.', 0.95),
      { id: 'N1', fam: 'N', text: 'Could you fit a quartz movement into my grandfather clock without harming the old case?', answer: 'Yes, on a mount that needs no new holes, though the chime and pendulum would be lost. Here are the trade-offs.', s1: 'No, that can’t be done.' },
    ] },
    { title: 'Jev', tasks: [
      W('W5', 5, 'stopped', 'Bought here 5 months ago and the alarm won’t ring. Covered?', 'Not covered: alarms wear out.', 0.97),
      W('W6', 24, 'stopped', 'My clock from you, 2 years old, has stopped. Covered?', 'Covered: clocks should last longer than that.', 0.98),
      W('W7', 11, 'stopped', 'My aunt bought this clock here as a gift 11 months ago. I have no receipt, and the spring has broken. Is it covered?', 'Not covered without a receipt.', 0.61, { gift: true }),
      Q('Q3', ['pendulum rod'], 'What does a new pendulum rod cost, fitted?'),
      W('W8', 7, 'water', 'Bought here 7 months ago; it was soaked when the basement flooded. Covered?', 'Covered: it is well inside a year.', 0.96),
    ] },
    { title: 'The stale card', tasks: [
      W('W9', 8, 'stopped', 'My clock runs slow. I bought it here 8 months ago. Covered?', 'Covered: it is under a year old.', 0.95),
      W('W10', 10, 'stopped', 'The pendulum on my clock has stuck. Bought here 10 months ago. Covered?', 'Covered: it is under a year old.', 0.94),
      Q('Q4', ['chime hammer', 'gear'], 'Price for a new chime hammer and one gear?'),
      W('W11', 2, 'stopped', 'Bought here 2 months ago and the chime has gone silent. Covered?', 'Not covered: chimes are wear parts.', 0.97),
      W('W12', 7, 'stopped', 'The hands slip on my clock, bought here 7 months ago. Covered?', 'Covered: it is under a year old.', 0.96),
    ] },
  ]
  const LEDGER_CLAIMS = 120

  const money = (d) => '$' + d
  const quote = (parts) => SERVICE + parts.reduce((sum, part) => sum + PRICES[part], 0)
  const partsText = (parts) => parts.map((part) => part + ' $' + PRICES[part]).join(' + ')

  /* What a warranty rule set says about a case. `limit` is the period in
     months; `gift` is whether the rule set knows that the warranty follows the
     clock (so a lost receipt is fine: the shop's sales ledger has the date). */
  function warranty(task, limit, gift) {
    if (task.gift && !gift) return { covered: false, text: 'Not covered: there is no receipt.' }
    if (task.cause === 'drop') return { covered: false, text: 'Not covered: drop damage is excluded.' }
    if (task.cause === 'water') return { covered: false, text: 'Not covered: water damage is excluded.' }
    if (task.months > limit) return { covered: false, text: 'Not covered: ' + task.months + ' months is past the ' + limit + '-month warranty.' }
    return { covered: true, text: 'Covered: free repair. ' + task.months + ' months is inside the ' + limit + '-month warranty' + (task.gift ? ', and the warranty follows the clock; the sales ledger shows the date.' : '.') }
  }

  function createGame() {
    const g = {
      day: 0,              // 0-based index into DAYS
      ix: 0,               // task index within the day
      policy: 12,          // the shop's real warranty period, in months
      cards: {},           // W: { limit, gift }, Q: { prices: true }
      jev: null,           // { limit } once compiled
      quarantine: false,   // warranty card and Jev benched after a complaint
      staleWrong: 0,       // fast wrong answers caused by a stale card or Jev
      complained: false,
      log: [],             // one entry per handled task
      days: DAYS.map(() => ({ t: 0, c: 0, wrong: 0, routes: [] })),
    }

    const task = () => DAYS[g.day].tasks[g.ix]
    const stale = () => (g.cards.W && g.cards.W.limit !== g.policy) || (g.jev && g.jev.limit !== g.policy)

    function truth(t) {
      if (t.fam === 'W') { const w = warranty(t, g.policy, true); return { text: w.text, value: w.covered } }
      if (t.fam === 'Q') return { text: 'Quote: ' + money(quote(t.parts)) + ' ($' + SERVICE + ' service + ' + partsText(t.parts) + ').', value: quote(t.parts) }
      return { text: t.answer, value: true }
    }

    /* Why a route is closed for this task, or null when it is open. */
    function closed(route, t) {
      t = t || task()
      if (route === 'mem') {
        if (t.fam === 'E') return 'System 1 already knows this; no card needed'
        if (t.fam === 'N') return 'A one-off: no card covers it'
        if (t.fam === 'W' && g.quarantine) return 'Benched after a complaint'
        if (!g.cards[t.fam]) return 'No card yet: System 2 has not solved one'
        return null
      }
      if (route === 'jev') {
        if (t.fam !== 'W') return 'Jev is compiled for warranty questions only'
        if (!g.jev) return 'Not compiled yet'
        if (g.quarantine) return 'Benched after a complaint'
        return null
      }
      return null
    }

    /* Run System 2 on a warranty or quote case and let the harness learn from
       it: write a missing card, add what a card lacked, and repair a stale card
       or Jev by relabelling under the current policy book. */
    function learnFromSystem2(t) {
      const events = []
      if (t.fam === 'Q' && !g.cards.Q) { g.cards.Q = { prices: true }; events.push('card-q') }
      if (t.fam !== 'W') return events
      if (!g.cards.W) { g.cards.W = { limit: g.policy, gift: !!t.gift }; events.push('card-w') } else {
        if (g.cards.W.limit !== g.policy) { g.cards.W.limit = g.policy; events.push('card-rewritten') }
        if (t.gift && !g.cards.W.gift) { g.cards.W.gift = true; events.push('card-gift') }
      }
      if (g.jev && g.jev.limit !== g.policy) { g.jev.limit = g.policy; events.push('jev-recompiled') }
      if (g.quarantine && !stale()) { g.quarantine = false; events.push('unbenched') }
      return events
    }

    function charge(entry, route) {
      entry.t += ROUTES[route].t; entry.c += ROUTES[route].c
      const d = g.days[g.day]; d.t += ROUTES[route].t; d.c += ROUTES[route].c
    }

    /* Route the current task. Returns the log entry, or null if the route is closed. */
    function route(r) {
      if (!ROUTES[r] || closed(r)) return null
      const t = task(), want = truth(t)
      const e = { day: g.day, ix: g.ix, id: t.id, fam: t.fam, route: r, t: 0, c: 0, events: [], checked: false }
      charge(e, r)
      if (r === 's1') {
        e.answer = t.fam === 'E' ? t.answer : t.fam === 'Q' ? 'About ' + money(quote(t.parts) - SERVICE) + '.' : t.s1
        e.right = t.fam === 'E'
      } else if (r === 's2') {
        e.answer = want.text; e.right = true
        e.events = learnFromSystem2(t)
      } else if (r === 'mem') {
        if (t.fam === 'Q') { e.answer = want.text; e.right = true } else {
          const w = warranty(t, g.cards.W.limit, g.cards.W.gift)
          e.answer = w.text; e.right = w.covered === want.value
          e.stale = !e.right && g.cards.W.limit !== g.policy
          e.incomplete = !e.right && !e.stale
        }
      } else {
        e.p = t.p
        if (t.p < JEV_THRESHOLD) {
          e.escalated = true
          charge(e, 's2')
          e.answer = want.text; e.right = true
          e.events = learnFromSystem2(t)
        } else {
          const w = warranty(t, g.jev.limit, true)
          e.judgment = w.covered
          e.answer = w.text; e.right = w.covered === want.value
          e.stale = !e.right
        }
      }
      if (!e.right) g.days[g.day].wrong++
      if (e.stale) g.staleWrong++
      g.days[g.day].routes.push(e.escalated ? 'jev+s2' : r)
      g.log.push(e)
      return e
    }

    /* Spot-check the last answer with System 2 (memory or Jev answers only). */
    function check() {
      const e = g.log[g.log.length - 1]
      if (!e || e.checked || e.escalated || (e.route !== 'mem' && e.route !== 'jev')) return null
      e.checked = true
      charge(e, 's2')
      e.checkEvents = learnFromSystem2(DAYS[e.day].tasks[e.ix])
      return e
    }

    /* A complaint arrives once two stale answers have gone out unchecked. */
    function complaintDue() { return !g.complained && g.staleWrong >= 2 && stale() }
    function complain() { g.complained = true; g.quarantine = true }

    function compileJev() { g.jev = { limit: g.policy } }
    function warrantyCasesSoFar() { return DAYS.slice(0, g.day + 1).reduce((n, d) => n + d.tasks.filter((t) => t.fam === 'W').length, 0) }

    function nextTask() { if (g.ix < DAYS[g.day].tasks.length - 1) { g.ix++; return true } return false }
    function nextDay() {
      if (g.day >= DAYS.length - 1) return false
      g.day++; g.ix = 0
      if (g.day === 3) g.policy = 6   // the shop edits its policy book overnight
      return true
    }

    return { g, task, truth, closed, route, check, stale, complaintDue, complain, compileJev, warrantyCasesSoFar, nextTask, nextDay }
  }

  /* A well-tuned harness: recall what it can, reason when it must, and
     spot-check memories once the policy book has changed. Its totals are the
     reference the debrief shows. */
  function idealRoute(game) {
    const t = game.task(), g = game.g
    if (t.fam === 'E') return 's1'
    if (t.fam === 'N') return 's2'
    if (t.fam === 'W' && g.day === 3 && game.stale()) return 's2'
    if (t.fam === 'W' && !game.closed('jev')) return 'jev'
    if (!game.closed('mem')) return 'mem'
    return 's2'
  }
  function simulate(chooser) {
    const game = createGame()
    for (;;) {
      do { game.route(chooser(game)); if (game.complaintDue()) game.complain() } while (game.nextTask())
      if (game.g.day === 1) game.compileJev()
      if (!game.nextDay()) break
    }
    return game.g.days.map((d) => ({ t: d.t, c: d.c, wrong: d.wrong }))
  }

  root.InstinctEngine = { ROUTES, DAYS, FAMILIES, PRICES, SERVICE, JEV_THRESHOLD, LEDGER_CLAIMS, createGame, idealRoute, simulate, quote }
})(typeof window !== 'undefined' ? window : globalThis)
