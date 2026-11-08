// Checks that the shared site and laboratory palette agrees wherever it is copied:
// the kit (public/demos/kit/darwin-engine.css, the source), the site's tokens
// (src/index.css), the game page shell (public/demos/demo-shell.css) and the
// social card template (scripts/build-social.mjs). npm test runs it.
//
// To change a colour, change it in the kit and in every copy this lists.
import { readFile } from 'node:fs/promises'

const KIT = 'public/demos/kit/darwin-engine.css'
const SITE = 'src/index.css'
const SHELL = 'public/demos/demo-shell.css'
const CARDS = 'scripts/build-social.mjs'

// Shared colours: [kit token, site token, shell token or null].
const SHARED = [
  ['--de-paper', '--canvas', '--ml-canvas'],
  ['--de-paper-2', '--surface-soft', null],
  ['--de-rule', '--line', '--ml-line'],
  ['--de-ink', '--ink', '--ml-ink'],
  ['--de-ink-soft', '--muted', '--ml-muted'],
  ['--de-brass-ink', '--accent', '--ml-accent'],
  ['--de-verdigris-ink', '--teal', '--ml-teal'],
  ['--de-iron', '--iron', null],
  ['--de-iron-2', '--iron-2', null],
  ['--de-iron-line', '--iron-line', null],
  ['--de-iron-text', '--iron-text', null],
  ['--de-iron-dim', '--iron-dim', null],
  ['--de-brass', '--brass', '--ml-brass'],
  ['--de-brass-deep', '--brass-deep', null],
  ['--de-glow', '--glow', null],
]
// Site-only tones: not in the kit, but fixed wherever they appear.
const SITE_ONLY = { [SITE]: { '--surface': '#FFFFFF' }, [SHELL]: { '--ml-surface': '#FFFFFF', '--ml-accent-hover': '#2445AC' } }

const hex = value => value.toUpperCase()
const tokens = css => Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/g)].map(([, name, value]) => [name, hex(value)]))
const [kitCss, siteCss, shellCss, cardsJs] = await Promise.all([KIT, SITE, SHELL, CARDS].map(file => readFile(file, 'utf8')))
const kit = tokens(kitCss), site = tokens(siteCss), shell = tokens(shellCss)

const problems = []
for (const [kitName, siteName, shellName] of SHARED) {
  const value = kit[kitName]
  if (!value) { problems.push(`${KIT} has no ${kitName}`); continue }
  if (site[siteName] !== value) problems.push(`${SITE} ${siteName} is ${site[siteName] ?? 'missing'}; the kit's ${kitName} is ${value}`)
  if (shellName && shell[shellName] !== value) problems.push(`${SHELL} ${shellName} is ${shell[shellName] ?? 'missing'}; the kit's ${kitName} is ${value}`)
}
for (const [file, expected] of Object.entries(SITE_ONLY)) {
  const found = file === SITE ? site : shell
  for (const [name, value] of Object.entries(expected)) if (found[name] !== value) problems.push(`${file} ${name} is ${found[name] ?? 'missing'}; expected the site-only tone ${value}`)
}
// The card template may use only canonical colours: anything in the kit, or a site-only tone.
const canonical = new Set([...kitCss.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(([value]) => hex(value)).concat(Object.values(SITE_ONLY).flatMap(Object.values)))
for (const value of new Set([...cardsJs.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(([found]) => hex(found)))) {
  if (!canonical.has(value)) problems.push(`${CARDS} uses ${value}, which is neither a kit colour nor a site-only tone`)
}

if (problems.length) {
  console.error(`The palette copies disagree with the kit (${KIT}):\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log(`Palette: ${SHARED.length} shared colours and ${Object.values(SITE_ONLY).flatMap(Object.keys).length} site-only tones agree across the kit, the site, the shell and the card template.`)
