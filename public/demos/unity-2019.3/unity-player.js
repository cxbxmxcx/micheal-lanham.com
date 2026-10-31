/* Loading, recovery and a phone gate for the three Unity 2019.3 teaching
 * games (W-48, W-49). It replaces the template's inline
 * UnityLoader.instantiate call, whose failures were a raw alert() or a page
 * that never finished loading, with:
 *
 *  - a "Desktop required" notice on phones, before anything is downloaded,
 *    with "Continue anyway" (skipped with ?device=any, which the site's demo
 *    page uses after showing the same notice);
 *  - a status line, and an in-page error with "Try again" and a link back
 *    to the game's page on the site;
 *  - a check of Build/Web.json first, because the loader only logs a failed
 *    manifest request and turns an error page into an alert from JSON.parse;
 *  - an accessible name for the canvas, described by #game-summary;
 *  - unity-ready / unity-error messages for the embedding demo page.
 *
 * Each game page loads, in its <head>, after UnityProgress.js and
 * UnityLoader.js:
 *   <script defer src="../unity-2019.3/unity-player.js"
 *           data-title="The Perceptron Game" data-page="/demos/perceptron/"></script>
 */
(function () {
  'use strict'
  var script = document.currentScript
  var TITLE = script.getAttribute('data-title') || 'The game'
  var PAGE = script.getAttribute('data-page') || '/demos/'
  var MANIFEST = 'Build/Web.json'
  var SLOW_MS = 45000
  var embedded = window.self !== window.top
  var stage = document.querySelector('.stage')
  var container = document.getElementById('unityContainer')
  var instance = null, ready = false, failed = false, slowTimer = 0

  function make(tag, className, text) {
    var element = document.createElement(tag)
    if (className) element.className = className
    if (text) element.textContent = text
    return element
  }

  var status = make('p', 'unity-status')
  var message = make('span')
  var percent = make('span', 'unity-percent')
  message.setAttribute('role', 'status')
  percent.setAttribute('aria-hidden', 'true')
  status.appendChild(message)
  status.appendChild(percent)
  var panel = make('div', 'unity-panel unity-hidden')
  stage.parentNode.insertBefore(status, stage)
  stage.parentNode.insertBefore(panel, stage)

  function say(text, progress) {
    if (message.textContent !== text) message.textContent = text
    percent.textContent = progress === undefined ? '' : Math.round(progress * 100) + '%'
  }
  function showStage(visible) { stage.classList.toggle('unity-hidden', !visible) }
  function showStatus(visible) { status.classList.toggle('unity-hidden', !visible); if (!visible) say('') }
  function hidePanel() { panel.className = 'unity-panel unity-hidden'; panel.textContent = '' }
  function showPanel(kind, heading, text, action, onAction) {
    panel.textContent = ''
    panel.className = 'unity-panel unity-panel-' + kind
    // Errors interrupt; the phone notice is part of the page as it loads.
    if (kind === 'error') panel.setAttribute('role', 'alert'); else panel.removeAttribute('role')
    var title = make('h2', '', heading)
    title.tabIndex = -1
    panel.appendChild(title)
    panel.appendChild(make('p', '', text))
    var actions = make('div', 'unity-actions')
    if (action) {
      var button = make('button', '', action)
      button.type = 'button'
      button.addEventListener('click', onAction)
      actions.appendChild(button)
    }
    var back = make('a', '', 'Back to the game’s page')
    back.href = PAGE
    back.target = '_top'
    actions.appendChild(back)
    panel.appendChild(actions)
    return title
  }
  function notify(type) {
    if (embedded) try { window.parent.postMessage({ type: type }, window.location.origin) } catch (error) { /* parent gone */ }
  }

  function fail(kind, detail) {
    if (failed) return
    failed = true
    clearTimeout(slowTimer)
    if (detail) console.error('[' + TITLE + '] ' + kind + ':', detail)
    var heading = kind === 'webgl' ? 'This browser can’t run the game'
      : kind === 'network' ? 'The game didn’t load' : 'The game stopped'
    var text = kind === 'webgl' ? TITLE + ' needs WebGL, which this browser does not provide. Try a current desktop version of Chrome, Edge, Firefox or Safari.'
      : kind === 'network' ? 'Its files could not be downloaded. Check your connection and try again.'
      : 'It ran into an error. Try again, and if that does not help, open it in another desktop browser.'
    if (!ready) showStage(false)
    var title = showPanel('error', heading, text, kind === 'webgl' ? null : 'Try again', retry)
    // The panel announces itself (role=alert); the status line would repeat it.
    showStatus(false)
    // Inside the site's iframe the demo page manages focus and shows its own message.
    if (!embedded && (document.activeElement === document.body || panel.contains(document.activeElement))) title.focus()
    notify('unity-error')
  }

  function slow() {
    if (ready || failed) return
    showPanel('slow', 'Still loading', TITLE + ' is taking longer than usual to start. You can keep waiting, or try again.', 'Try again', retry)
  }

  function retry() {
    // Once the engine has started it cannot be restarted in place.
    if (instance) window.location.reload()
    else start()
  }

  function progress(unity, value) {
    UnityProgress(unity, value)
    if (failed || ready) return
    if (value < 1) { say('Loading ' + TITLE + '…', value); return }
    ready = true
    clearTimeout(slowTimer)
    hidePanel()
    say(TITLE + ' is ready.')
    notify('unity-ready')
  }

  function instantiate() {
    instance = window.unityInstance = UnityLoader.instantiate(container, MANIFEST, {
      onProgress: progress,
      // The site shows its own phone notice, so skip Unity's popups and only
      // stop when WebGL is missing.
      compatibilityCheck: function (unity, proceed, abort) { if (UnityLoader.SystemInfo.hasWebGL) proceed(); else abort() },
      onerror: function (error) { fail(UnityLoader.SystemInfo.hasWebGL ? 'error' : 'webgl', error) },
      Module: { errorhandler: function (error) { fail('error', error); return true } },
    })
    var canvas = instance.Module && instance.Module.canvas
    if (canvas) {
      canvas.setAttribute('role', 'img')
      canvas.setAttribute('aria-label', TITLE + ', an interactive Unity game that needs a mouse or trackpad')
      if (document.getElementById('game-summary')) canvas.setAttribute('aria-describedby', 'game-summary')
    }
  }

  function start() {
    failed = false
    hidePanel()
    showStage(true)
    showStatus(true)
    say('Loading ' + TITLE + '…', 0)
    clearTimeout(slowTimer)
    slowTimer = setTimeout(slow, SLOW_MS)
    fetch(MANIFEST, { cache: 'no-cache' })
      .then(function (response) { if (!response.ok) throw new Error('HTTP ' + response.status + ' for ' + MANIFEST); return response.json() })
      .then(function () {
        if (!UnityLoader.SystemInfo.hasWebGL) fail('webgl')
        else instantiate()
      }, function (error) { fail('network', error) })
  }

  // The loader reports uncaught errors with alert(). Before the game is ready
  // any error means loading broke; afterwards only the engine's own errors
  // (those it can attribute to the game) stop it.
  UnityLoader.Error.handler = function (error, module) {
    if (error && /^(chrome|moz|safari)-extension:/.test(error.filename || '')) return
    if (ready && !module) return
    fail('error', error && (error.message || error))
  }

  var allowed = /[?&]device=any(&|$)/.test(window.location.search)
  try { allowed = allowed || sessionStorage.getItem('unityDevice') === 'any' } catch (error) { /* storage blocked */ }
  var coarse = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches
  var phone = UnityLoader.SystemInfo.mobile || (coarse && window.innerWidth < 1050)
  if (phone && !allowed) {
    showStage(false)
    showStatus(false)
    showPanel('gate', 'Desktop required', TITLE + ' is a Unity WebGL game made for desktop browsers. It needs a mouse or trackpad and a window at least 1,050 pixels wide, and it downloads about 5 MB.', 'Continue anyway', function () {
      try { sessionStorage.setItem('unityDevice', 'any') } catch (error) { /* storage blocked */ }
      start()
    })
  } else start()
})()
