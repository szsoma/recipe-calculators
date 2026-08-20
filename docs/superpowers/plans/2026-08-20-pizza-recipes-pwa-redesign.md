# Pizza Recipe Library, PWA, and Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the pizza calculator a device-local recipe library (save, load, edit, duplicate, note, share), make every calculator remember its last session, ship the app as an installable offline PWA, and restyle the whole app in a clean modern utility direction.

**Architecture:** All persistence is browser `localStorage`, reached only through a versioned store module in `src/db/`. Pizza's arithmetic moves out of the React component into a pure module in `src/lib/` so it can be unit-tested and reused by the share codec and recipe summaries. The Pizza route splits into a thin shell owning tab and recipe state, plus a Calculator view and a Recipes view. Nothing talks to a network at runtime.

**Tech Stack:** React 19, React Router 7, Vite 6, Tailwind CSS v4, Vitest (new, dev-only), `vite-plugin-pwa` (new, dev-only), `@vite-pwa/assets-generator` (new, dev-only).

**Spec:** `docs/superpowers/specs/2026-08-20-pizza-recipes-pwa-redesign-design.md`

## Global Constraints

- No backend, no accounts, no sync, no Supabase. The app must keep building to a static bundle deployed on Vercel.
- No new **runtime** dependencies. Every dependency added by this plan goes in `devDependencies`.
- Calculation results must be byte-identical to today's output for identical inputs. Extraction and refactoring must not change a single displayed number.
- Only inputs are persisted. Never persist a computed value.
- The bake date/time is session state, never part of a saved recipe.
- Storage namespace is `rc.v1.` — every key written by the app starts with it.
- `SCHEMA_VERSION` starts at `1`. Records with a higher version than the running build are skipped, never migrated, never overwritten.
- All interactive targets are at least 44 px tall and have a visible keyboard focus ring.
- Dark mode follows the system preference via Tailwind's `dark:` variant. There is no in-app theme toggle.
- Commit after every task. Conventional commit prefixes (`feat:`, `refactor:`, `test:`, `chore:`, `style:`).

## Known Inconsistency (Preserve, Do Not Fix)

`buildRecipeText` currently prints the biga yeast as `Yb` (the fresh-yeast basis) with the label
"Instant" when instant yeast is selected, while the on-screen table prints `Yb / 3`. This is
pre-existing. **Preserve it exactly.** Fixing it is a behaviour change and is out of scope — raise
it with the user separately.

Likewise, `round(v, 2)` is called in two places but `round` only takes one argument, so the second
argument is ignored and the value renders at 1 decimal. Preserve the 1-decimal output; drop the
dead second argument at the call sites.

## File Structure

**Created:**
- `vitest.config.js` — Vitest config, node environment, setup file
- `vitest.setup.js` — installs a Map-backed fake `localStorage` on `globalThis` for tests
- `src/lib/pizza.js` — pure dough math, fermentation model, schedule, recipe text. No React.
- `src/lib/pizza.test.js`
- `src/lib/share.js` — recipe ↔ base64url payload codec, share URL builder
- `src/lib/share.test.js`
- `src/db/store.js` — namespaced localStorage wrapper with in-memory fallback
- `src/db/store.test.js`
- `src/db/schema.js` — `SCHEMA_VERSION`, default params, recipe validation/normalisation
- `src/db/migrations.js` — version-to-version upgrade chain
- `src/db/migrations.test.js`
- `src/db/recipes.js` — recipe CRUD
- `src/db/recipes.test.js`
- `src/db/session.js` — per-calculator working state load/save
- `src/hooks/useSessionSync.js` — debounced session writer
- `src/components/Button.jsx`, `Tabs.jsx`, `Field.jsx`, `Stat.jsx`, `NumberInput.jsx`, `Dialog.jsx`
- `src/pages/pizza/PizzaCalculator.jsx` — the calculator view
- `src/pages/pizza/PizzaRecipes.jsx` — the recipe library view
- `src/pages/pizza/SaveRecipeDialog.jsx` — name + note dialog
- `src/pages/pizza/recipeSummary.js` — one-line parameter summary string
- `public/icon.svg` — source mark for PWA icon generation
- `pwa-assets.config.js` — icon generation config

**Modified:**
- `package.json` — dev dependencies, `test` script
- `vite.config.js` — PWA plugin
- `index.html` — theme colour, description
- `src/index.css` — design tokens, light/dark values, base styles
- `src/main.jsx` — service worker update prompt mount
- `src/pages/Pizza.jsx` — becomes a thin shell: tabs, loaded-recipe state, session
- `src/pages/Hub.jsx`, `src/pages/Kombucha.jsx`, `src/pages/Slambuc.jsx` — session restore + restyle
- `src/components/Card.jsx`, `Header.jsx`, `Toggle.jsx`, `IngredientInput.jsx`, `PageContainer.jsx` — restyle only, same props

---

### Task 1: Vitest setup and pure pizza math module

**Files:**
- Create: `vitest.config.js`, `vitest.setup.js`, `src/lib/pizza.js`, `src/lib/pizza.test.js`
- Modify: `package.json`, `src/pages/Pizza.jsx`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `DEFAULT_PIZZA_PARAMS` — the params object every other task reads and writes
  - `resolveParams(params) -> { salt, bigaHyd, bigaYeast }`
  - `computeDough(params) -> { target, F, Fb, Wb, Yb, Ff, Wf, Sf, bigaEq, finalEq, yeastPct, yeastG, total }`
  - `equivalentHours(hours, temp) -> number`
  - `fermentationLevel(eqHours) -> string key`
  - `FERMENTATION_TEXT` — key → sentence
  - `computeSchedule(params, bakeDateTimeStr) -> { bigaMixTime, finalMixTime, bakeTime } | null`
  - `buildRecipeText(params) -> string`
  - `formatDateTime(date) -> string`
  - `clamp(v, min, max) -> number`, `round(v) -> number`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest@^3
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create the Vitest config**

`vitest.config.js`:

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.test.js'],
  },
})
```

- [ ] **Step 4: Create the test setup with a fake localStorage**

`vitest.setup.js`:

```js
import { beforeEach } from 'vitest'

function createFakeStorage() {
  const map = new Map()
  return {
    get length() {
      return map.size
    },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(String(k), String(v))
    },
    removeItem: (k) => {
      map.delete(k)
    },
    clear: () => {
      map.clear()
    },
  }
}

beforeEach(() => {
  globalThis.localStorage = createFakeStorage()
})
```

- [ ] **Step 5: Write the failing test for the math module**

`src/lib/pizza.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PIZZA_PARAMS,
  resolveParams,
  computeDough,
  equivalentHours,
  fermentationLevel,
  computeSchedule,
  buildRecipeText,
  clamp,
  round,
} from './pizza'

describe('clamp and round', () => {
  it('clamps to the range', () => {
    expect(clamp(5, 1, 3)).toBe(3)
    expect(clamp(0, 1, 3)).toBe(1)
    expect(clamp(2, 1, 3)).toBe(2)
  })

  it('rounds to one decimal', () => {
    expect(round(1.94285)).toBe(1.9)
    expect(round(17.0485)).toBe(17)
  })
})

describe('resolveParams', () => {
  it('uses defaults when no fine overrides are set', () => {
    const r = resolveParams(DEFAULT_PIZZA_PARAMS)
    expect(r).toEqual({ salt: 2.7, bigaHyd: 42, bigaYeast: 1 })
  })

  it('uses the instant yeast default when fresh yeast is off', () => {
    const r = resolveParams({ ...DEFAULT_PIZZA_PARAMS, useFreshYeast: false })
    expect(r.bigaYeast).toBe(0.3)
  })

  it('prefers fine overrides over defaults', () => {
    const r = resolveParams({
      ...DEFAULT_PIZZA_PARAMS,
      saltFine: '3',
      bigaHydFine: '50',
      bigaYeastFine: '0.8',
    })
    expect(r).toEqual({ salt: 3, bigaHyd: 50, bigaYeast: 0.8 })
  })
})

describe('computeDough', () => {
  it('matches the known default batch', () => {
    const d = computeDough(DEFAULT_PIZZA_PARAMS)
    expect(round(d.target)).toBe(1060.8)
    expect(round(d.F)).toBe(631.4)
    expect(round(d.Fb)).toBe(189.4)
    expect(round(d.Wb)).toBe(79.6)
    expect(round(d.Yb)).toBe(1.9)
    expect(round(d.Ff)).toBe(442)
    expect(round(d.Wf)).toBe(330.9)
    expect(round(d.Sf)).toBe(17)
  })

  it('sums the components back to the target dough weight', () => {
    const d = computeDough(DEFAULT_PIZZA_PARAMS)
    expect(round(d.total)).toBe(round(d.target))
  })

  it('divides the displayed yeast by three for instant yeast', () => {
    const params = { ...DEFAULT_PIZZA_PARAMS, useFreshYeast: false, bigaYeastFine: '1' }
    const d = computeDough(params)
    expect(d.yeastPct).toBeCloseTo(1 / 3, 10)
    expect(d.yeastG).toBeCloseTo(d.Yb / 3, 10)
  })

  it('scales linearly with ball count', () => {
    const one = computeDough({ ...DEFAULT_PIZZA_PARAMS, balls: 1 })
    const four = computeDough({ ...DEFAULT_PIZZA_PARAMS, balls: 4 })
    expect(four.F).toBeCloseTo(one.F * 4, 6)
  })
})

describe('equivalentHours', () => {
  it('is the identity at the 18C reference', () => {
    expect(equivalentHours(12, 18)).toBe(12)
  })

  it('doubles the rate per 10C', () => {
    expect(equivalentHours(10, 28)).toBeCloseTo(20, 10)
    expect(equivalentHours(10, 20)).toBeCloseTo(11.48698355, 6)
    expect(equivalentHours(24, 4)).toBeCloseTo(9.0942994, 6)
  })
})

describe('fermentationLevel', () => {
  it('maps hours to bands at the boundaries', () => {
    expect(fermentationLevel(1.9)).toBe('very-short')
    expect(fermentationLevel(2)).toBe('short')
    expect(fermentationLevel(6)).toBe('medium')
    expect(fermentationLevel(12)).toBe('long')
    expect(fermentationLevel(24)).toBe('very-long')
    expect(fermentationLevel(48)).toBe('extended')
  })
})

describe('computeSchedule', () => {
  it('returns null without a bake time', () => {
    expect(computeSchedule(DEFAULT_PIZZA_PARAMS, '')).toBeNull()
  })

  it('returns null for an unparseable bake time', () => {
    expect(computeSchedule(DEFAULT_PIZZA_PARAMS, 'not-a-date')).toBeNull()
  })

  it('walks back final time then biga time from the bake', () => {
    const s = computeSchedule(
      { ...DEFAULT_PIZZA_PARAMS, bigaTime: 12, finalTime: 10 },
      '2026-08-22T18:00',
    )
    const hours = (a, b) => (b.getTime() - a.getTime()) / 3600000
    expect(hours(s.finalMixTime, s.bakeTime)).toBe(10)
    expect(hours(s.bigaMixTime, s.finalMixTime)).toBe(12)
  })
})

describe('buildRecipeText', () => {
  it('includes the totals and omits the schedule when there is no bake time', () => {
    const text = buildRecipeText(DEFAULT_PIZZA_PARAMS)
    expect(text).toContain('Flour total: 631.4g')
    expect(text).toContain('4 balls')
    expect(text).not.toContain('Schedule')
  })

  it('includes the schedule when a bake time is set', () => {
    const text = buildRecipeText({ ...DEFAULT_PIZZA_PARAMS, bakeDateTimeStr: '2026-08-22T18:00' })
    expect(text).toContain('Schedule')
    expect(text).toContain('Mix biga:')
  })
})
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./pizza`.

- [ ] **Step 7: Write the math module**

`src/lib/pizza.js`:

```js
export const SALT_DEFAULT = 2.7
export const BIGA_HYD_DEFAULT = 42
export const BIGA_YEAST_DEFAULT_FRESH = 1
export const BIGA_YEAST_DEFAULT_INSTANT = 0.3
export const FINAL_HYD_DEFAULT = 65
export const BIGA_PCT_DEFAULT = 30

export const DEFAULT_PIZZA_PARAMS = {
  balls: 4,
  ballW: 260,
  bigaPct: BIGA_PCT_DEFAULT,
  bigaTemp: 18,
  bigaTime: 12,
  finalHyd: FINAL_HYD_DEFAULT,
  finalTemp: 20,
  finalTime: 10,
  useFreshYeast: true,
  bigaHydFine: '',
  bigaYeastFine: '',
  saltFine: '',
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

export function round(v) {
  return Math.round(v * 10) / 10
}

export function resolveParams(params) {
  const salt = params.saltFine !== '' ? parseFloat(params.saltFine) : SALT_DEFAULT
  const bigaHyd = params.bigaHydFine !== '' ? parseFloat(params.bigaHydFine) : BIGA_HYD_DEFAULT
  const bigaYeast =
    params.bigaYeastFine !== ''
      ? parseFloat(params.bigaYeastFine)
      : params.useFreshYeast
        ? BIGA_YEAST_DEFAULT_FRESH
        : BIGA_YEAST_DEFAULT_INSTANT
  return { salt, bigaHyd, bigaYeast }
}

export function equivalentHours(hours, temp) {
  return hours * Math.pow(2, (temp - 18) / 10)
}

export const FERMENTATION_TEXT = {
  'very-short': 'Very short — minimal flavor development',
  short: 'Short — mild fermentation flavor',
  medium: 'Medium — good flavor balance',
  long: 'Long — complex, developed flavor',
  'very-long': 'Very long — deep, artisan flavor',
  extended: 'Extended — very deep, sour notes possible',
}

export function fermentationLevel(eqHours) {
  if (eqHours < 2) return 'very-short'
  if (eqHours < 6) return 'short'
  if (eqHours < 12) return 'medium'
  if (eqHours < 24) return 'long'
  if (eqHours < 48) return 'very-long'
  return 'extended'
}

export function computeDough(params) {
  const { salt, bigaHyd, bigaYeast } = resolveParams(params)

  const target = params.balls * params.ballW * 1.02
  const F =
    target /
    (1 + params.finalHyd / 100 + salt / 100 + (bigaYeast / 100) * (params.bigaPct / 100))

  const Fb = (F * params.bigaPct) / 100
  const Wb = (Fb * bigaHyd) / 100
  const Yb = (Fb * bigaYeast) / 100

  const Ff = F - Fb
  const Wf = (F * params.finalHyd) / 100 - Wb
  const Sf = (F * salt) / 100

  return {
    salt,
    bigaHyd,
    bigaYeast,
    target,
    F,
    Fb,
    Wb,
    Yb,
    Ff,
    Wf,
    Sf,
    total: Fb + Wb + Yb + Ff + Wf + Sf,
    bigaTotal: Fb + Wb + Yb,
    yeastPct: params.useFreshYeast ? bigaYeast : bigaYeast / 3,
    yeastG: params.useFreshYeast ? Yb : Yb / 3,
    bigaEq: equivalentHours(params.bigaTime, params.bigaTemp),
    finalEq: equivalentHours(params.finalTime, params.finalTemp),
  }
}

export function formatDateTime(date) {
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${time} ${day}`
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3600000)
}

export function computeSchedule(params, bakeDateTimeStr) {
  if (!bakeDateTimeStr) return null
  const bakeTime = new Date(bakeDateTimeStr)
  if (isNaN(bakeTime.getTime())) return null
  const finalMixTime = addHours(bakeTime, -params.finalTime)
  const bigaMixTime = addHours(finalMixTime, -params.bigaTime)
  return { bakeTime, finalMixTime, bigaMixTime }
}

export function buildRecipeText(params) {
  const d = computeDough(params)
  const schedule = computeSchedule(params, params.bakeDateTimeStr ?? '')
  const yeastTypeLabel = params.useFreshYeast ? 'Fresh' : 'Instant'

  const lines = []
  lines.push(`🍕 Biga Bench Recipe`)
  lines.push(`─────────────────`)
  lines.push(`Target: ${params.balls} balls × ${params.ballW}g = ${round(d.target)}g dough`)
  lines.push(`Flour total: ${round(d.F)}g`)
  lines.push(``)
  lines.push(`── Biga (${params.bigaPct}%) ──`)
  lines.push(`Flour: ${round(d.Fb)}g`)
  lines.push(`Water: ${round(d.Wb)}g (${d.bigaHyd}%)`)
  lines.push(`Yeast (${yeastTypeLabel}): ${round(d.Yb)}g`)
  lines.push(``)
  lines.push(`── Final Dough ──`)
  lines.push(`Flour: ${round(d.Ff)}g`)
  lines.push(`Water: ${round(d.Wf)}g`)
  lines.push(`Salt: ${round(d.Sf)}g`)
  lines.push(``)
  lines.push(`Total: ${round(d.total)}g`)

  if (schedule) {
    lines.push(``)
    lines.push(`── Schedule ──`)
    lines.push(`Mix biga: ${formatDateTime(schedule.bigaMixTime)}`)
    lines.push(`Final mix: ${formatDateTime(schedule.finalMixTime)}`)
    lines.push(`Bake: ${formatDateTime(schedule.bakeTime)}`)
  }

  return lines.join('\n')
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, all cases green.

- [ ] **Step 9: Rewire Pizza.jsx onto the module**

In `src/pages/Pizza.jsx`, delete the local `SALT_DEFAULT`/`BIGA_*`/`FINAL_HYD_DEFAULT`/`BIGA_PCT_DEFAULT`
constants, `clamp`, `round`, `eq`, `getFermentationLabel`, `formatDateTime`, `addHours`, and
`buildRecipeText`. Import instead:

```jsx
import {
  SALT_DEFAULT,
  BIGA_HYD_DEFAULT,
  BIGA_YEAST_DEFAULT_FRESH,
  BIGA_YEAST_DEFAULT_INSTANT,
  clamp,
  round,
  computeDough,
  computeSchedule,
  buildRecipeText,
  fermentationLevel,
  FERMENTATION_TEXT,
  formatDateTime,
} from '../lib/pizza'
```

Keep the existing `useState` calls for now. Build the params object the module expects and read the
results from it:

```jsx
const params = {
  balls, ballW, bigaPct, bigaTemp, bigaTime,
  finalHyd, finalTemp, finalTime, useFreshYeast,
  bigaHydFine, bigaYeastFine, saltFine,
  bakeDateTimeStr,
}
const d = computeDough(params)
const { salt, bigaHyd, bigaYeast, F, Fb, Wb, Yb, Ff, Wf, Sf, bigaEq, finalEq, target } = d
const schedule = computeSchedule(params, bakeDateTimeStr)
```

Replace `getFermentationLabel(x)` usage with the level plus a local colour map, keeping the exact
same classes as today:

```jsx
const FERMENTATION_COLOR = {
  'very-short': 'text-red-600',
  short: 'text-yellow-600',
  medium: 'text-green-600',
  long: 'text-green-700',
  'very-long': 'text-blue-600',
  extended: 'text-purple-600',
}
const bigaLevel = fermentationLevel(bigaEq)
const finalLevel = fermentationLevel(finalEq)
```

and in JSX use `FERMENTATION_TEXT[bigaLevel]` with `FERMENTATION_COLOR[bigaLevel]`.

Replace `handleCopy`'s body to use `buildRecipeText(params)`. Replace the two `round(x, 2)` calls
with `round(x)`. Replace the yeast row's `useFreshYeast ? bigaYeast : bigaYeast / 3` and
`useFreshYeast ? Yb : Yb / 3` with `d.yeastPct` and `d.yeastG`.

- [ ] **Step 10: Verify the app is unchanged**

Run: `npm run build` — expect success.
Run: `npm run dev`, open `/pizza`, and confirm at the default settings: target 1060.8 g, flour
total 631.4 g, biga flour 189.4 g, water 79.6 g, yeast 1.9 g, final flour 442 g, water 330.9 g,
salt 17 g. Toggle instant yeast and confirm the yeast row shows a third of the fresh value.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json vitest.config.js vitest.setup.js src/lib/pizza.js src/lib/pizza.test.js src/pages/Pizza.jsx
git commit -m "refactor: extract pizza math into a tested pure module"
```

---

### Task 2: Storage wrapper

**Files:**
- Create: `src/db/store.js`, `src/db/store.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `read(key) -> any | null` — parsed JSON under `rc.v1.<key>`, `null` if absent or corrupt
  - `write(key, value) -> boolean` — `true` when it reached real storage
  - `remove(key) -> void`
  - `isPersistent() -> boolean` — `false` once any write has fallen back to memory
  - `NAMESPACE` — the string `rc.v1.`

- [ ] **Step 1: Write the failing test**

`src/db/store.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { read, write, remove, isPersistent, NAMESPACE } from './store'

describe('store', () => {
  it('round-trips a value through the namespaced key', () => {
    write('recipes.pizza', [{ id: 'a' }])
    expect(read('recipes.pizza')).toEqual([{ id: 'a' }])
    expect(localStorage.getItem(NAMESPACE + 'recipes.pizza')).toBe('[{"id":"a"}]')
  })

  it('returns null for a missing key', () => {
    expect(read('nothing.here')).toBeNull()
  })

  it('returns null for corrupt JSON instead of throwing', () => {
    localStorage.setItem(NAMESPACE + 'broken', '{not json')
    expect(read('broken')).toBeNull()
  })

  it('removes a value', () => {
    write('temp', 1)
    remove('temp')
    expect(read('temp')).toBeNull()
  })

  it('reports persistence and falls back to memory when storage throws', () => {
    expect(isPersistent()).toBe(true)
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(write('big', 'x')).toBe(false)
    expect(isPersistent()).toBe(false)
    expect(read('big')).toBe('x')
  })

  it('survives localStorage being entirely absent', () => {
    delete globalThis.localStorage
    expect(write('k', 2)).toBe(false)
    expect(read('k')).toBe(2)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/db/store.test.js`
Expected: FAIL — cannot resolve `./store`.

- [ ] **Step 3: Write the store**

`src/db/store.js`:

```js
export const NAMESPACE = 'rc.v1.'

const memory = new Map()
let persistent = true

function backend() {
  try {
    const s = globalThis.localStorage
    if (!s) return null
    return s
  } catch {
    return null
  }
}

export function isPersistent() {
  return persistent
}

export function read(key) {
  const full = NAMESPACE + key
  const s = backend()
  let raw = null
  if (s) {
    try {
      raw = s.getItem(full)
    } catch {
      raw = null
    }
  }
  if (raw === null) {
    return memory.has(full) ? memory.get(full) : null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function write(key, value) {
  const full = NAMESPACE + key
  memory.set(full, value)
  const s = backend()
  if (!s) {
    persistent = false
    return false
  }
  try {
    s.setItem(full, JSON.stringify(value))
    return true
  } catch {
    persistent = false
    return false
  }
}

export function remove(key) {
  const full = NAMESPACE + key
  memory.delete(full)
  const s = backend()
  if (!s) return
  try {
    s.removeItem(full)
  } catch {
    /* nothing to do */
  }
}
```

Note the module-level `persistent` flag is intentionally sticky for the session: once a write has
failed, the UI keeps warning until reload.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/db/store.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/store.js src/db/store.test.js
git commit -m "feat: add namespaced local storage wrapper with memory fallback"
```

---

### Task 3: Recipe schema and migrations

**Files:**
- Create: `src/db/schema.js`, `src/db/migrations.js`, `src/db/migrations.test.js`

**Interfaces:**
- Consumes: `DEFAULT_PIZZA_PARAMS` from `src/lib/pizza.js`
- Produces:
  - `SCHEMA_VERSION` — number, `1`
  - `PARAM_KEYS` — array of the twelve param names, in order
  - `normalizeParams(raw) -> params` — every key present, wrong types coerced, unknown keys dropped
  - `isValidRecipe(obj) -> boolean`
  - `migrateRecipe(record) -> record | null` — `null` when the record is unusable or from the future

- [ ] **Step 1: Write the schema module**

`src/db/schema.js`:

```js
import { DEFAULT_PIZZA_PARAMS } from '../lib/pizza'

export const SCHEMA_VERSION = 1

export const PARAM_KEYS = [
  'balls',
  'ballW',
  'bigaPct',
  'bigaTemp',
  'bigaTime',
  'finalHyd',
  'finalTemp',
  'finalTime',
  'useFreshYeast',
  'bigaHydFine',
  'bigaYeastFine',
  'saltFine',
]

const NUMERIC_KEYS = [
  'balls',
  'ballW',
  'bigaPct',
  'bigaTemp',
  'bigaTime',
  'finalHyd',
  'finalTemp',
  'finalTime',
]

const FINE_KEYS = ['bigaHydFine', 'bigaYeastFine', 'saltFine']

export function normalizeParams(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const out = {}
  for (const key of NUMERIC_KEYS) {
    const n = Number(src[key])
    out[key] = Number.isFinite(n) ? n : DEFAULT_PIZZA_PARAMS[key]
  }
  out.useFreshYeast =
    typeof src.useFreshYeast === 'boolean' ? src.useFreshYeast : DEFAULT_PIZZA_PARAMS.useFreshYeast
  for (const key of FINE_KEYS) {
    const v = src[key]
    if (v === '' || v === null || v === undefined) {
      out[key] = ''
    } else if (Number.isFinite(Number(v))) {
      out[key] = String(v)
    } else {
      out[key] = ''
    }
  }
  return out
}

export function isValidRecipe(obj) {
  if (!obj || typeof obj !== 'object') return false
  if (typeof obj.name !== 'string' || obj.name.trim() === '') return false
  if (!obj.params || typeof obj.params !== 'object') return false
  return true
}
```

- [ ] **Step 2: Write the failing migration test**

`src/db/migrations.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { migrateRecipe } from './migrations'
import { SCHEMA_VERSION } from './schema'

const valid = {
  id: 'r1',
  name: 'Saturday',
  note: '',
  createdAt: '2026-08-20T10:00:00.000Z',
  updatedAt: '2026-08-20T10:00:00.000Z',
  schemaVersion: SCHEMA_VERSION,
  params: { balls: 4, ballW: 260, bigaPct: 30 },
}

describe('migrateRecipe', () => {
  it('passes a current-version record through with normalised params', () => {
    const r = migrateRecipe(valid)
    expect(r.id).toBe('r1')
    expect(r.schemaVersion).toBe(SCHEMA_VERSION)
    expect(r.params.finalHyd).toBe(65)
    expect(r.params.saltFine).toBe('')
  })

  it('rejects a record from a newer schema version', () => {
    expect(migrateRecipe({ ...valid, schemaVersion: SCHEMA_VERSION + 1 })).toBeNull()
  })

  it('rejects a structurally invalid record', () => {
    expect(migrateRecipe({ ...valid, name: '   ' })).toBeNull()
    expect(migrateRecipe(null)).toBeNull()
    expect(migrateRecipe({ ...valid, params: undefined })).toBeNull()
  })

  it('treats a missing schemaVersion as version 1', () => {
    const { schemaVersion, ...noVersion } = valid
    expect(migrateRecipe(noVersion).schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('fills in missing metadata', () => {
    const { note, ...noNote } = valid
    expect(migrateRecipe(noNote).note).toBe('')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/db/migrations.test.js`
Expected: FAIL — cannot resolve `./migrations`.

- [ ] **Step 4: Write the migrations module**

`src/db/migrations.js`:

```js
import { SCHEMA_VERSION, isValidRecipe, normalizeParams } from './schema'

// Upgrade steps keyed by the version they upgrade FROM.
// When SCHEMA_VERSION becomes 2, add: 1: (r) => ({ ...r, params: { ...r.params, newField: default } })
const STEPS = {}

export function migrateRecipe(record) {
  if (!isValidRecipe(record)) return null

  let version = Number.isFinite(record.schemaVersion) ? record.schemaVersion : 1
  if (version > SCHEMA_VERSION) return null

  let out = record
  while (version < SCHEMA_VERSION) {
    const step = STEPS[version]
    if (!step) return null
    out = step(out)
    version += 1
  }

  return {
    id: String(out.id),
    name: String(out.name).trim(),
    note: typeof out.note === 'string' ? out.note : '',
    createdAt: typeof out.createdAt === 'string' ? out.createdAt : new Date().toISOString(),
    updatedAt: typeof out.updatedAt === 'string' ? out.updatedAt : new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    params: normalizeParams(out.params),
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/db/migrations.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.js src/db/migrations.js src/db/migrations.test.js
git commit -m "feat: add recipe schema and migration chain"
```

---

### Task 4: Recipe CRUD

**Files:**
- Create: `src/db/recipes.js`, `src/db/recipes.test.js`

**Interfaces:**
- Consumes: `read`/`write` from `./store`, `migrateRecipe` from `./migrations`, `normalizeParams`/`SCHEMA_VERSION` from `./schema`
- Produces:
  - `list() -> Recipe[]` — newest `updatedAt` first, corrupt records skipped
  - `get(id) -> Recipe | null`
  - `save({ id?, name, note, params }) -> Recipe` — inserts when `id` is absent, updates otherwise
  - `remove(id) -> void`
  - `duplicate(id) -> Recipe | null` — name gets a ` (copy)` suffix
  - `importRecipe(obj) -> Recipe | null` — validates, then saves as a new record with a new id
  - `skippedCount() -> number` — how many stored records the last `list()` had to discard
  - `STORAGE_KEY` — the string `recipes.pizza`

- [ ] **Step 1: Write the failing test**

`src/db/recipes.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { list, get, save, remove, duplicate, importRecipe, skippedCount, STORAGE_KEY } from './recipes'
import { write } from './store'
import { SCHEMA_VERSION } from './schema'

const params = { balls: 6, ballW: 280, finalHyd: 70 }

describe('recipes', () => {
  it('starts empty', () => {
    expect(list()).toEqual([])
  })

  it('saves and reads back a recipe', () => {
    const saved = save({ name: 'Saturday', note: 'caputo blue', params })
    expect(saved.id).toBeTruthy()
    expect(saved.schemaVersion).toBe(SCHEMA_VERSION)
    expect(saved.params.balls).toBe(6)
    expect(saved.params.bigaPct).toBe(30)

    expect(get(saved.id)).toEqual(saved)
    expect(list()).toHaveLength(1)
  })

  it('updates in place and keeps createdAt', () => {
    const first = save({ name: 'Saturday', note: '', params })
    const second = save({ id: first.id, name: 'Sunday', note: 'x', params: { balls: 2 } })
    expect(list()).toHaveLength(1)
    expect(second.createdAt).toBe(first.createdAt)
    expect(get(first.id).name).toBe('Sunday')
    expect(get(first.id).params.balls).toBe(2)
  })

  it('rejects an empty name', () => {
    expect(() => save({ name: '   ', params })).toThrow()
  })

  it('removes a recipe', () => {
    const r = save({ name: 'Gone', params })
    remove(r.id)
    expect(get(r.id)).toBeNull()
    expect(list()).toEqual([])
  })

  it('duplicates with a new id and a copy suffix', () => {
    const r = save({ name: 'Base', note: 'n', params })
    const copy = duplicate(r.id)
    expect(copy.id).not.toBe(r.id)
    expect(copy.name).toBe('Base (copy)')
    expect(copy.note).toBe('n')
    expect(copy.params).toEqual(r.params)
    expect(list()).toHaveLength(2)
  })

  it('returns null when duplicating a missing id', () => {
    expect(duplicate('nope')).toBeNull()
  })

  it('sorts newest updated first', () => {
    const a = save({ name: 'A', params })
    const b = save({ name: 'B', params })
    save({ id: a.id, name: 'A', params })
    expect(list().map((r) => r.name)).toEqual(['A', 'B'])
    expect(b.name).toBe('B')
  })

  it('skips corrupt records instead of failing the whole list, and counts them', () => {
    const good = save({ name: 'Good', params })
    write(STORAGE_KEY, [{ garbage: true }, good, null])
    expect(list().map((r) => r.name)).toEqual(['Good'])
    expect(skippedCount()).toBe(2)
  })

  it('imports a valid external recipe as a new record', () => {
    const imported = importRecipe({ name: 'Shared', note: 'from a link', params })
    expect(imported.id).toBeTruthy()
    expect(list()).toHaveLength(1)
  })

  it('refuses to import junk', () => {
    expect(importRecipe({ nope: 1 })).toBeNull()
    expect(importRecipe(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/db/recipes.test.js`
Expected: FAIL — cannot resolve `./recipes`.

- [ ] **Step 3: Write the CRUD module**

`src/db/recipes.js`:

```js
import { read, write } from './store'
import { migrateRecipe } from './migrations'
import { SCHEMA_VERSION, isValidRecipe, normalizeParams } from './schema'

export const STORAGE_KEY = 'recipes.pizza'

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `r-${Math.random().toString(36).slice(2)}-${performance.now().toString(36)}`
}

function now() {
  return new Date().toISOString()
}

let skipped = 0

export function skippedCount() {
  return skipped
}

function readAll() {
  const raw = read(STORAGE_KEY)
  if (!Array.isArray(raw)) return []
  const migrated = raw.map(migrateRecipe)
  skipped = migrated.filter((r) => r === null).length
  return migrated.filter(Boolean)
}

function writeAll(recipes) {
  write(STORAGE_KEY, recipes)
}

export function list() {
  return readAll().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
}

export function get(id) {
  return readAll().find((r) => r.id === id) ?? null
}

export function save({ id, name, note = '', params }) {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (trimmed === '') throw new Error('Recipe name is required')

  const all = readAll()
  const existing = id ? all.find((r) => r.id === id) : null
  const timestamp = now()

  const record = {
    id: existing ? existing.id : (id ?? newId()),
    name: trimmed,
    note: typeof note === 'string' ? note : '',
    createdAt: existing ? existing.createdAt : timestamp,
    updatedAt: timestamp,
    schemaVersion: SCHEMA_VERSION,
    params: normalizeParams(params),
  }

  const next = existing ? all.map((r) => (r.id === record.id ? record : r)) : [...all, record]
  writeAll(next)
  return record
}

export function remove(id) {
  writeAll(readAll().filter((r) => r.id !== id))
}

export function duplicate(id) {
  const source = get(id)
  if (!source) return null
  return save({ name: `${source.name} (copy)`, note: source.note, params: source.params })
}

export function importRecipe(obj) {
  if (!isValidRecipe(obj)) return null
  return save({ name: obj.name, note: obj.note ?? '', params: obj.params })
}
```

Note `list()` sorts by ISO timestamp string, which sorts correctly because ISO-8601 UTC strings are
lexicographically ordered. Two saves inside the same millisecond keep insertion order, which the
sort test relies on.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/db/recipes.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/recipes.js src/db/recipes.test.js
git commit -m "feat: add pizza recipe CRUD over local storage"
```

---

### Task 5: Share codec

**Files:**
- Create: `src/lib/share.js`, `src/lib/share.test.js`

**Interfaces:**
- Consumes: `SCHEMA_VERSION`, `isValidRecipe`, `normalizeParams` from `src/db/schema.js`
- Produces:
  - `encodeRecipe({ name, note, params }) -> string` — base64url payload
  - `decodeRecipe(payload) -> { name, note, params }` — throws `ShareError` on anything malformed
  - `ShareError` — error class
  - `buildShareUrl(recipe, origin) -> string` — `<origin>/pizza?r=<payload>`
  - `SHARE_PARAM` — the string `r`

- [ ] **Step 1: Write the failing test**

`src/lib/share.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { encodeRecipe, decodeRecipe, buildShareUrl, ShareError } from './share'

const recipe = {
  name: 'Sárga tészta 🍕',
  note: 'long note with ümlaut',
  params: { balls: 4, ballW: 260, finalHyd: 65, saltFine: '3' },
}

describe('share codec', () => {
  it('round-trips a recipe including non-ASCII text', () => {
    const decoded = decodeRecipe(encodeRecipe(recipe))
    expect(decoded.name).toBe(recipe.name)
    expect(decoded.note).toBe(recipe.note)
    expect(decoded.params.balls).toBe(4)
    expect(decoded.params.saltFine).toBe('3')
    expect(decoded.params.bigaPct).toBe(30)
  })

  it('produces a url-safe payload', () => {
    expect(encodeRecipe(recipe)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('builds a share url on the pizza route', () => {
    const url = buildShareUrl(recipe, 'https://example.com')
    expect(url.startsWith('https://example.com/pizza?r=')).toBe(true)
  })

  it('throws ShareError on junk input', () => {
    expect(() => decodeRecipe('!!!!')).toThrow(ShareError)
    expect(() => decodeRecipe('')).toThrow(ShareError)
    expect(() => decodeRecipe(encodeRecipe(recipe).slice(0, 5))).toThrow(ShareError)
  })

  it('throws ShareError on a payload from a newer schema version', () => {
    const payload = encodeRecipe(recipe)
    const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0),
    )))
    json.v = 999
    const bumped = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(json))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(() => decodeRecipe(bumped)).toThrow(ShareError)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/share.test.js`
Expected: FAIL — cannot resolve `./share`.

- [ ] **Step 3: Write the codec**

`src/lib/share.js`:

```js
import { SCHEMA_VERSION, isValidRecipe, normalizeParams } from '../db/schema'

export const SHARE_PARAM = 'r'

export class ShareError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ShareError'
  }
}

function toBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function encodeRecipe({ name, note = '', params }) {
  const payload = { v: SCHEMA_VERSION, n: name, o: note, p: normalizeParams(params) }
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
}

export function decodeRecipe(payload) {
  if (typeof payload !== 'string' || payload === '') {
    throw new ShareError('Empty recipe link')
  }

  let parsed
  try {
    parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)))
  } catch {
    throw new ShareError('This recipe link is not readable')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ShareError('This recipe link is not readable')
  }
  if (Number(parsed.v) > SCHEMA_VERSION) {
    throw new ShareError('This link was made with a newer version of the app')
  }

  const recipe = { name: parsed.n, note: typeof parsed.o === 'string' ? parsed.o : '', params: parsed.p }
  if (!isValidRecipe(recipe)) {
    throw new ShareError('This recipe link is missing information')
  }

  return { ...recipe, params: normalizeParams(recipe.params) }
}

export function buildShareUrl(recipe, origin) {
  return `${origin}/pizza?${SHARE_PARAM}=${encodeRecipe(recipe)}`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/share.test.js`
Expected: PASS. If `atob`/`btoa` are missing, the Node version is below 16 — they are global from
Node 16 onwards and this project requires Node 18+.

- [ ] **Step 5: Commit**

```bash
git add src/lib/share.js src/lib/share.test.js
git commit -m "feat: add recipe share link codec"
```

---

### Task 6: Design tokens and shared UI primitives

**Files:**
- Create: `src/components/Button.jsx`, `src/components/Tabs.jsx`, `src/components/Field.jsx`, `src/components/Stat.jsx`, `src/components/NumberInput.jsx`, `src/components/Dialog.jsx`
- Modify: `src/index.css`, `src/pages/Pizza.jsx`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `<Button variant="primary|secondary|ghost|danger" accent="pizza|kombucha|slambuc" size="md|sm" fullWidth onClick disabled>`
  - `<Tabs items={[{ id, label }]} value onChange accent />`
  - `<Field label htmlFor hint>` — label + control wrapper
  - `<Stat label value unit />` — a right-aligned readout row with tabular figures
  - `<NumberInput label value onChange min max step unit accent />` — the stepper, moved out of Pizza
  - `<Dialog open title onClose>` — centred modal with backdrop, Escape to close, focus trapped to first field

- [ ] **Step 1: Add design tokens to the stylesheet**

`src/index.css`:

```css
@import "tailwindcss";

:root {
  --canvas: #f6f6f7;
  --surface: #ffffff;
  --surface-sunken: #f1f1f3;
  --line: #e4e4e8;
  --ink: #16161a;
  --ink-muted: #6c6c76;
  --accent-kombucha: #a8761a;
  --accent-slambuc: #b04d1c;
  --accent-pizza: #c4341f;
}

@media (prefers-color-scheme: dark) {
  :root {
    --canvas: #0f0f12;
    --surface: #191920;
    --surface-sunken: #212129;
    --line: #2c2c36;
    --ink: #f2f2f5;
    --ink-muted: #9a9aa6;
    --accent-kombucha: #e0a63a;
    --accent-slambuc: #e07a45;
    --accent-pizza: #ef5d45;
  }
}

@theme inline {
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  --color-sunken: var(--surface-sunken);
  --color-line: var(--line);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-kombucha: var(--accent-kombucha);
  --color-slambuc: var(--accent-slambuc);
  --color-pizza: var(--accent-pizza);
}

@layer base {
  body {
    background-color: var(--canvas);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }

  input[type="number"] {
    font-variant-numeric: tabular-nums;
  }
}
```

Note `@theme inline` is required here (rather than plain `@theme`) so the generated utilities
reference the CSS variables and therefore respond to the dark-mode media query.

- [ ] **Step 2: Write the Button**

`src/components/Button.jsx`:

```jsx
const ACCENTS = {
  pizza: 'bg-pizza text-white hover:opacity-90 focus-visible:outline-pizza',
  kombucha: 'bg-kombucha text-white hover:opacity-90 focus-visible:outline-kombucha',
  slambuc: 'bg-slambuc text-white hover:opacity-90 focus-visible:outline-slambuc',
}

const OUTLINE = {
  pizza: 'focus-visible:outline-pizza',
  kombucha: 'focus-visible:outline-kombucha',
  slambuc: 'focus-visible:outline-slambuc',
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  accent = 'pizza',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  const sizes = { md: 'min-h-11 px-4 text-sm', sm: 'min-h-11 px-3 text-xs' }
  const variants = {
    primary: ACCENTS[accent],
    secondary: `bg-sunken text-ink border border-line hover:bg-line ${OUTLINE[accent]}`,
    ghost: `text-ink-muted hover:text-ink hover:bg-sunken ${OUTLINE[accent]}`,
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 3: Write the Tabs**

`src/components/Tabs.jsx`:

```jsx
const ACTIVE = {
  pizza: 'text-pizza border-pizza',
  kombucha: 'text-kombucha border-kombucha',
  slambuc: 'text-slambuc border-slambuc',
}

export default function Tabs({ items, value, onChange, accent = 'pizza' }) {
  return (
    <div role="tablist" className="flex border-b border-line">
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={`min-h-11 flex-1 px-4 text-sm font-semibold border-b-2 -mb-px transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${
              selected ? ACTIVE[accent] : 'text-ink-muted border-transparent hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Write Field and Stat**

`src/components/Field.jsx`:

```jsx
export default function Field({ label, htmlFor, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
```

`src/components/Stat.jsx`:

```jsx
export default function Stat({ label, value, unit, tone = 'default' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl bg-sunken border border-line px-3 py-2.5">
      <span className="text-sm text-ink-muted">{label}</span>
      <span
        className={`font-semibold tabular-nums ${tone === 'strong' ? 'text-lg text-ink' : 'text-ink'}`}
      >
        {value}
        {unit && <span className="ml-0.5 text-ink-muted font-normal">{unit}</span>}
      </span>
    </div>
  )
}
```

- [ ] **Step 5: Move NumberInput out of Pizza.jsx**

Create `src/components/NumberInput.jsx` with the component currently defined inside
`src/pages/Pizza.jsx`, restyled onto the tokens and keeping the clamp-on-blur behaviour exactly:

```jsx
import { clamp } from '../lib/pizza'

export default function NumberInput({ label, value, onChange, min, max, step, unit, accent = 'pizza' }) {
  const id = `num-${label.toLowerCase().replace(/\s+/g, '-')}`
  const ring = {
    pizza: 'focus:border-pizza',
    kombucha: 'focus:border-kombucha',
    slambuc: 'focus:border-slambuc',
  }[accent]

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - step, min, max))}
          className="w-11 h-11 shrink-0 rounded-xl border border-line bg-sunken text-lg font-bold text-ink hover:bg-line active:scale-95 transition"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            if (!isNaN(n)) onChange(n)
          }}
          onBlur={(e) => {
            const n = parseFloat(e.target.value)
            if (!isNaN(n)) onChange(clamp(n, min, max))
          }}
          className={`min-w-0 flex-1 h-11 px-2 rounded-xl border border-line bg-surface text-ink text-sm text-center tabular-nums focus:outline-none ${ring}`}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(value + step, min, max))}
          className="w-11 h-11 shrink-0 rounded-xl border border-line bg-sunken text-lg font-bold text-ink hover:bg-line active:scale-95 transition"
        >
          +
        </button>
        {unit && <span className="w-7 shrink-0 text-sm text-ink-muted">{unit}</span>}
      </div>
    </div>
  )
}
```

Then delete the local `NumberInput` from `src/pages/Pizza.jsx` and import the shared one.

- [ ] **Step 6: Write the Dialog**

`src/components/Dialog.jsx`:

```jsx
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Dialog({ open, title, onClose, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    panelRef.current?.querySelector('input, textarea, button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-md bg-surface border border-line rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 -mr-2 flex items-center justify-center text-ink-muted hover:text-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Verify**

Run: `npm run build` — expect success.
Run: `npm run dev`, open `/pizza`, confirm the steppers still work (type a value, blur, it clamps)
and that the page renders on the new token colours. Switch the OS to dark mode and confirm the
page inverts.

- [ ] **Step 8: Commit**

```bash
git add src/index.css src/components src/pages/Pizza.jsx
git commit -m "feat: add design tokens and shared UI primitives"
```

---

### Task 7: Pizza params refactor and tab shell

**Files:**
- Create: `src/pages/pizza/PizzaCalculator.jsx`, `src/pages/pizza/PizzaRecipes.jsx`, `src/pages/pizza/recipeSummary.js`
- Modify: `src/pages/Pizza.jsx`

**Interfaces:**
- Consumes: `DEFAULT_PIZZA_PARAMS`, `computeDough`, `computeSchedule`, `buildRecipeText` from `src/lib/pizza.js`; `Tabs` from `src/components/Tabs.jsx`
- Produces:
  - `<PizzaCalculator params setParam bakeDateTimeStr setBakeDateTimeStr footer />` — `setParam(key, value)` updates one param; `footer` is arbitrary nodes rendered below the last card
  - `<PizzaRecipes onLoad />` — placeholder in this task, filled in Task 9
  - `recipeSummary(params) -> string` — e.g. `4 × 260 g · 65% hydration · 30% biga`

- [ ] **Step 1: Write the summary helper**

`src/pages/pizza/recipeSummary.js`:

```js
import { resolveParams } from '../../lib/pizza'

export default function recipeSummary(params) {
  const { bigaHyd } = resolveParams(params)
  return `${params.balls} × ${params.ballW} g · ${params.finalHyd}% hydration · ${params.bigaPct}% biga @ ${bigaHyd}%`
}
```

- [ ] **Step 2: Move the calculator body into PizzaCalculator.jsx**

Create `src/pages/pizza/PizzaCalculator.jsx` containing everything currently rendered inside
`src/pages/Pizza.jsx` between `<Header>` and the closing `</PageContainer>` — the Batch, Biga,
Final Dough, Recipe, Variables, Schedule cards and the footer note.

The component takes props instead of owning state:

```jsx
export default function PizzaCalculator({ params, setParam, bakeDateTimeStr, setBakeDateTimeStr, footer }) {
  const d = computeDough(params)
  const schedule = computeSchedule(params, bakeDateTimeStr)
  // ...existing JSX, with every `setBalls(v)` becoming `setParam('balls', v)` etc.
}
```

Mapping from the old state setters to `setParam` calls:

| Old | New |
| --- | --- |
| `setBalls(v)` | `setParam('balls', v)` |
| `setBallW(v)` | `setParam('ballW', v)` |
| `setBigaPct(v)` | `setParam('bigaPct', v)` |
| `setBigaTemp(v)` | `setParam('bigaTemp', v)` |
| `setBigaTime(v)` | `setParam('bigaTime', v)` |
| `setFinalHyd(v)` | `setParam('finalHyd', v)` |
| `setFinalTemp(v)` | `setParam('finalTemp', v)` |
| `setFinalTime(v)` | `setParam('finalTime', v)` |
| `setUseFreshYeast(v)` | `setParam('useFreshYeast', v)` |
| `setBigaHydFine(String(v))` | `setParam('bigaHydFine', String(v))` |
| `setBigaYeastFine(String(v))` | `setParam('bigaYeastFine', String(v))` |
| `setSaltFine(String(v))` | `setParam('saltFine', String(v))` |

Values read from state become `params.balls`, `params.ballW`, and so on; `salt`, `bigaHyd`, and
`bigaYeast` come from `d`. The copy button keeps its local `copied` state and calls
`buildRecipeText({ ...params, bakeDateTimeStr })`.

Render `{footer}` immediately after the Schedule card and before the footnote paragraph.

- [ ] **Step 3: Write the placeholder recipes view**

`src/pages/pizza/PizzaRecipes.jsx`:

```jsx
export default function PizzaRecipes() {
  return (
    <div className="px-4 py-10 max-w-lg mx-auto text-center text-ink-muted text-sm">
      No saved recipes yet.
    </div>
  )
}
```

- [ ] **Step 4: Turn Pizza.jsx into the shell**

`src/pages/Pizza.jsx`:

```jsx
import { useState } from 'react'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Tabs from '../components/Tabs'
import PizzaCalculator from './pizza/PizzaCalculator'
import PizzaRecipes from './pizza/PizzaRecipes'
import { DEFAULT_PIZZA_PARAMS } from '../lib/pizza'

const TABS = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'recipes', label: 'Recipes' },
]

export default function Pizza() {
  const [tab, setTab] = useState('calculator')
  const [params, setParams] = useState(DEFAULT_PIZZA_PARAMS)
  const [bakeDateTimeStr, setBakeDateTimeStr] = useState('')

  function setParam(key, value) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <PageContainer>
      <Header icon="🍕" title="Pizza — Biga Bench" accent="pizza" />
      <div className="sticky top-14 z-40 bg-canvas">
        <div className="max-w-lg mx-auto px-4">
          <Tabs items={TABS} value={tab} onChange={setTab} accent="pizza" />
        </div>
      </div>

      {tab === 'calculator' ? (
        <PizzaCalculator
          params={params}
          setParam={setParam}
          bakeDateTimeStr={bakeDateTimeStr}
          setBakeDateTimeStr={setBakeDateTimeStr}
        />
      ) : (
        <PizzaRecipes />
      )}
    </PageContainer>
  )
}
```

- [ ] **Step 5: Verify nothing changed numerically**

Run: `npm run build` — expect success.
Run: `npm run dev`, open `/pizza`. Confirm the default readouts are still target 1060.8 g, flour
631.4 g, biga 189.4 / 79.6 / 1.9, final 442 / 330.9 / 17. Change every input once and confirm it
still responds. Switch to the Recipes tab and back and confirm the calculator values survive.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Pizza.jsx src/pages/pizza
git commit -m "refactor: split pizza page into calculator and recipes tabs"
```

---

### Task 8: Save flow

**Files:**
- Create: `src/pages/pizza/SaveRecipeDialog.jsx`
- Modify: `src/pages/Pizza.jsx`, `src/pages/pizza/PizzaCalculator.jsx`

**Interfaces:**
- Consumes: `save` from `src/db/recipes.js`; `isPersistent` from `src/db/store.js`; `Dialog`, `Button`, `Field`
- Produces:
  - `<SaveRecipeDialog open initialName initialNote onSubmit onClose />` — `onSubmit({ name, note })`
  - Pizza shell state: `loadedRecipe` (the saved record or `null`) and `isDirty` (params differ from `loadedRecipe.params`)

- [ ] **Step 1: Write the dialog**

`src/pages/pizza/SaveRecipeDialog.jsx`:

```jsx
import { useEffect, useState } from 'react'
import Dialog from '../../components/Dialog'
import Button from '../../components/Button'
import Field from '../../components/Field'

export default function SaveRecipeDialog({ open, title = 'Save recipe', initialName = '', initialNote = '', onSubmit, onClose }) {
  const [name, setName] = useState(initialName)
  const [note, setNote] = useState(initialNote)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(initialName)
      setNote(initialNote)
      setError('')
    }
  }, [open, initialName, initialNote])

  function handleSubmit(e) {
    e.preventDefault()
    if (name.trim() === '') {
      setError('Give the recipe a name')
      return
    }
    onSubmit({ name: name.trim(), note: note.trim() })
  }

  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" htmlFor="recipe-name">
          <input
            id="recipe-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Saturday 65%"
            className="w-full h-11 px-3 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-pizza"
          />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Field label="Note" htmlFor="recipe-note" hint="Flour, oven, how it turned out — anything you want to remember.">
          <textarea
            id="recipe-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-pizza"
          />
        </Field>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" accent="pizza" fullWidth>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
```

- [ ] **Step 2: Add loaded-recipe state to the shell**

In `src/pages/Pizza.jsx` add:

```jsx
import { useMemo, useState } from 'react'
import { save as saveRecipe } from '../db/recipes'
import { isPersistent } from '../db/store'
import SaveRecipeDialog from './pizza/SaveRecipeDialog'
import Button from '../components/Button'
import { PARAM_KEYS } from '../db/schema'

const [loadedRecipe, setLoadedRecipe] = useState(null)
const [dialog, setDialog] = useState(null) // null | 'save' | 'saveAs'

const isDirty = useMemo(() => {
  if (!loadedRecipe) return false
  return PARAM_KEYS.some((k) => String(params[k]) !== String(loadedRecipe.params[k]))
}, [params, loadedRecipe])

function handleSaveNew({ name, note }) {
  const record = saveRecipe({ name, note, params })
  setLoadedRecipe(record)
  setDialog(null)
}

function handleOverwrite() {
  const record = saveRecipe({
    id: loadedRecipe.id,
    name: loadedRecipe.name,
    note: loadedRecipe.note,
    params,
  })
  setLoadedRecipe(record)
}
```

Render the dialog at the end of the component:

```jsx
<SaveRecipeDialog
  open={dialog !== null}
  title={dialog === 'saveAs' ? 'Save as new recipe' : 'Save recipe'}
  initialName={dialog === 'saveAs' && loadedRecipe ? `${loadedRecipe.name} (copy)` : ''}
  initialNote={dialog === 'saveAs' && loadedRecipe ? loadedRecipe.note : ''}
  onSubmit={handleSaveNew}
  onClose={() => setDialog(null)}
/>
```

- [ ] **Step 3: Pass the save footer into the calculator**

Still in `src/pages/Pizza.jsx`, build the footer and hand it to `PizzaCalculator` via the `footer`
prop added in Task 7:

```jsx
const saveFooter = (
  <div className="space-y-2">
    {!isPersistent() && (
      <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
        This browser is blocking storage — recipes will be lost when you close the app.
      </p>
    )}
    {loadedRecipe ? (
      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={() => setDialog('saveAs')}>
          Save as new
        </Button>
        <Button variant="primary" accent="pizza" fullWidth disabled={!isDirty} onClick={handleOverwrite}>
          {isDirty ? 'Save changes' : 'Saved'}
        </Button>
      </div>
    ) : (
      <Button variant="primary" accent="pizza" fullWidth onClick={() => setDialog('save')}>
        Save recipe
      </Button>
    )}
  </div>
)
```

- [ ] **Step 4: Show the loaded recipe above the controls**

At the top of `PizzaCalculator`'s output, when a recipe is loaded, render a context line. Pass
`loadedRecipe` and `isDirty` down as props:

```jsx
{loadedRecipe && (
  <div className="flex items-center gap-2 text-sm">
    <span className="font-semibold text-ink">{loadedRecipe.name}</span>
    {isDirty && (
      <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-pizza" aria-hidden="true" />
        unsaved changes
      </span>
    )}
  </div>
)}
```

- [ ] **Step 5: Verify by hand**

Run: `npm run dev`. On `/pizza`: press Save recipe, leave the name blank, submit, and confirm the
inline error. Enter a name and a note, save, and confirm the name appears above the controls and
the button now reads "Saved" and is disabled. Change the ball count and confirm it flips to
"Save changes" with the unsaved dot. Press it and confirm it returns to "Saved". Reload the page,
open devtools, and confirm `localStorage` has a `rc.v1.recipes.pizza` entry containing the recipe.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Pizza.jsx src/pages/pizza
git commit -m "feat: save pizza recipes with name and note"
```

---

### Task 9: Recipes tab

**Files:**
- Modify: `src/pages/pizza/PizzaRecipes.jsx`, `src/pages/Pizza.jsx`

**Interfaces:**
- Consumes: `list`, `get`, `remove`, `duplicate`, `save`, `importRecipe` from `src/db/recipes.js`; `encodeRecipe`, `buildShareUrl`, `decodeRecipe`, `ShareError` from `src/lib/share.js`; `recipeSummary`
- Produces: `<PizzaRecipes onLoad={(recipe) => void} />` — calls `onLoad` with the full record; the shell applies its params and switches to the Calculator tab

- [ ] **Step 1: Build the list view**

Rewrite `src/pages/pizza/PizzaRecipes.jsx`:

```jsx
import { useState } from 'react'
import { Copy, Share2, Pencil, Trash2, Download } from 'lucide-react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import SaveRecipeDialog from './SaveRecipeDialog'
import recipeSummary from './recipeSummary'
import { list, remove, duplicate, save, importRecipe, skippedCount } from '../../db/recipes'
import { buildShareUrl, decodeRecipe, ShareError } from '../../lib/share'

export default function PizzaRecipes({ onLoad }) {
  const [recipes, setRecipes] = useState(() => list())
  const [editing, setEditing] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(null)

  function refresh() {
    setRecipes(list())
  }

  function flash(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 2500)
  }

  async function handleShare(recipe) {
    const url = buildShareUrl(recipe, window.location.origin)
    if (navigator.share) {
      try {
        await navigator.share({ title: recipe.name, url })
        return
      } catch {
        /* user dismissed the sheet — fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(url)
    flash('Link copied')
  }

  async function handleCopyJson(recipe) {
    await navigator.clipboard.writeText(
      JSON.stringify({ name: recipe.name, note: recipe.note, params: recipe.params }, null, 2),
    )
    flash('JSON copied')
  }

  function handleImport() {
    const text = importText.trim()
    if (text === '') return
    let payload = null
    try {
      payload = JSON.parse(text)
    } catch {
      try {
        payload = decodeRecipe(text.split('r=').pop())
      } catch (err) {
        flash(err instanceof ShareError ? err.message : 'That is not a recipe')
        return
      }
    }
    const saved = importRecipe(payload)
    if (!saved) {
      flash('That is not a recipe')
      return
    }
    setImporting(false)
    setImportText('')
    refresh()
    flash(`Imported "${saved.name}"`)
  }

  if (recipes.length === 0 && !importing) {
    return (
      <div className="px-4 py-12 max-w-lg mx-auto text-center space-y-4">
        <p className="text-ink font-medium">No saved recipes yet</p>
        <p className="text-sm text-ink-muted">
          Set up a dough on the Calculator tab, then press Save recipe at the bottom.
        </p>
        <Button variant="secondary" onClick={() => setImporting(true)}>
          Import a recipe
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          {skippedCount() > 0 && (
            <span className="ml-2 text-amber-700 dark:text-amber-400">
              {skippedCount()} unreadable {skippedCount() === 1 ? 'entry' : 'entries'} skipped
            </span>
          )}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setImporting((v) => !v)}>
          <Download className="w-4 h-4" /> Import
        </Button>
      </div>

      {importing && (
        <Card>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={3}
            placeholder="Paste a share link or recipe JSON"
            className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:border-pizza"
          />
          <div className="flex gap-2 mt-3">
            <Button variant="secondary" fullWidth onClick={() => setImporting(false)}>
              Cancel
            </Button>
            <Button variant="primary" accent="pizza" fullWidth onClick={handleImport}>
              Import
            </Button>
          </div>
        </Card>
      )}

      {message && <p className="text-sm text-center text-ink-muted">{message}</p>}

      {recipes.map((recipe) => (
        <Card key={recipe.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-ink truncate">{recipe.name}</h3>
              <p className="text-xs text-ink-muted tabular-nums mt-0.5">{recipeSummary(recipe.params)}</p>
              {recipe.note && <p className="text-sm text-ink-muted mt-2 line-clamp-2">{recipe.note}</p>}
            </div>
            <Button variant="primary" accent="pizza" size="sm" onClick={() => onLoad(recipe)}>
              Load
            </Button>
          </div>

          <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-line">
            <Button variant="ghost" size="sm" onClick={() => setEditing(recipe)}>
              <Pencil className="w-4 h-4" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                duplicate(recipe.id)
                refresh()
              }}
            >
              <Copy className="w-4 h-4" /> Duplicate
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleShare(recipe)}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleCopyJson(recipe)}>
              JSON
            </Button>
            {confirmingDelete === recipe.id ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  remove(recipe.id)
                  setConfirmingDelete(null)
                  refresh()
                }}
              >
                <Trash2 className="w-4 h-4" /> Really delete
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(recipe.id)}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            )}
          </div>
        </Card>
      ))}

      <SaveRecipeDialog
        open={editing !== null}
        title="Edit recipe"
        initialName={editing?.name ?? ''}
        initialNote={editing?.note ?? ''}
        onSubmit={({ name, note }) => {
          save({ id: editing.id, name, note, params: editing.params })
          setEditing(null)
          refresh()
        }}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Wire loading into the shell**

In `src/pages/Pizza.jsx`:

```jsx
function handleLoad(recipe) {
  setParams(recipe.params)
  setLoadedRecipe(recipe)
  setTab('calculator')
}
```

and render `<PizzaRecipes onLoad={handleLoad} />`.

- [ ] **Step 3: Accept a shared recipe from the URL**

Still in `src/pages/Pizza.jsx`, read the share parameter once on mount:

```jsx
import { useSearchParams } from 'react-router-dom'
import { decodeRecipe, SHARE_PARAM, ShareError } from '../lib/share'

const [searchParams, setSearchParams] = useSearchParams()
const [shareError, setShareError] = useState('')
const [pendingShare, setPendingShare] = useState(null)

useEffect(() => {
  const payload = searchParams.get(SHARE_PARAM)
  if (!payload) return
  try {
    const shared = decodeRecipe(payload)
    setParams(shared.params)
    setLoadedRecipe(null)
    setPendingShare({ name: shared.name, note: shared.note })
  } catch (err) {
    setShareError(err instanceof ShareError ? err.message : 'That recipe link is not readable')
  }
  searchParams.delete(SHARE_PARAM)
  setSearchParams(searchParams, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

Render a banner above the tabs when `pendingShare` or `shareError` is set. The banner's save
button calls `handleSaveNew(pendingShare)` and clears `pendingShare`:

```jsx
{shareError && <p className="px-4 py-2 text-sm text-red-600 text-center">{shareError}</p>}
{pendingShare && (
  <div className="px-4 py-3 max-w-lg mx-auto flex items-center gap-3">
    <p className="flex-1 text-sm text-ink">
      Loaded <span className="font-semibold">{pendingShare.name}</span> from a link.
    </p>
    <Button
      variant="primary"
      accent="pizza"
      size="sm"
      onClick={() => {
        handleSaveNew(pendingShare)
        setPendingShare(null)
      }}
    >
      Save to my recipes
    </Button>
  </div>
)}
```

- [ ] **Step 4: Verify by hand**

Run: `npm run dev`. Save two recipes. On the Recipes tab confirm: newest first; Load applies the
params and returns to the calculator; Edit renames and updates the note; Duplicate produces
"(copy)"; Delete requires the second press; Share copies a link. Paste that link into a new tab and
confirm the calculator loads it with the "Save to my recipes" banner. Paste `?r=garbage` and
confirm a readable error, with the calculator still working. Copy a recipe's JSON, delete the
recipe, then Import the JSON back and confirm it reappears.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Pizza.jsx src/pages/pizza
git commit -m "feat: add recipe library with load, edit, duplicate, share, and import"
```

---

### Task 10: Session auto-restore

**Files:**
- Create: `src/db/session.js`, `src/hooks/useSessionSync.js`
- Modify: `src/pages/Pizza.jsx`, `src/pages/Kombucha.jsx`, `src/pages/Slambuc.jsx`

**Interfaces:**
- Consumes: `read`/`write` from `src/db/store.js`
- Produces:
  - `loadSession(key, defaults) -> object` — defaults merged under the stored object
  - `saveSession(key, state) -> void`
  - `useSessionSync(key, state)` — writes `state` 400 ms after it last changed

- [ ] **Step 1: Write the session module**

`src/db/session.js`:

```js
import { read, write } from './store'

export function loadSession(key, defaults) {
  const stored = read(`session.${key}`)
  if (!stored || typeof stored !== 'object') return defaults
  return { ...defaults, ...stored }
}

export function saveSession(key, state) {
  write(`session.${key}`, state)
}
```

- [ ] **Step 2: Write the debounced hook**

`src/hooks/useSessionSync.js`:

```js
import { useEffect, useRef } from 'react'
import { saveSession } from '../db/session'

export default function useSessionSync(key, state) {
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return undefined
    }
    const id = setTimeout(() => saveSession(key, state), 400)
    return () => clearTimeout(id)
  }, [key, state])
}
```

Callers must pass a `state` object built with `useMemo` (or plain object literals are fine — the
effect re-runs on every render but the timer is cleared, so at most one write lands per 400 ms of
quiet).

- [ ] **Step 3: Wire Pizza**

In `src/pages/Pizza.jsx`:

```jsx
import { loadSession } from '../db/session'
import useSessionSync from '../hooks/useSessionSync'

const initial = useMemo(
  () => loadSession('pizza', { params: DEFAULT_PIZZA_PARAMS, bakeDateTimeStr: '', loadedRecipeId: null }),
  [],
)

const [params, setParams] = useState(initial.params)
const [bakeDateTimeStr, setBakeDateTimeStr] = useState(initial.bakeDateTimeStr)
const [loadedRecipe, setLoadedRecipe] = useState(() =>
  initial.loadedRecipeId ? getRecipe(initial.loadedRecipeId) : null,
)

useSessionSync('pizza', { params, bakeDateTimeStr, loadedRecipeId: loadedRecipe?.id ?? null })
```

with `import { get as getRecipe, save as saveRecipe } from '../db/recipes'`. Note the session
stores only the recipe **id** — never a copy of the record — so an edited or deleted recipe cannot
resurrect a stale copy. If the id no longer resolves, `getRecipe` returns `null` and the calculator
opens with the values but no loaded recipe, which is correct.

- [ ] **Step 4: Wire Slambuc**

In `src/pages/Slambuc.jsx`, replace the four `useState` initialisers:

```jsx
import { useMemo, useState } from 'react'
import { loadSession } from '../db/session'
import useSessionSync from '../hooks/useSessionSync'

const initial = useMemo(
  () => loadSession('slambuc', { mode: 'people', people: 4, selectedIng: 'teszta', ingValue: 400 }),
  [],
)
const [mode, setMode] = useState(initial.mode)
const [people, setPeople] = useState(initial.people)
const [selectedIng, setSelectedIng] = useState(initial.selectedIng)
const [ingValue, setIngValue] = useState(initial.ingValue)

useSessionSync('slambuc', { mode, people, selectedIng, ingValue })
```

If `selectedIng` no longer names a known ingredient, fall back to `'teszta'` before it reaches
`useState`.

- [ ] **Step 5: Wire Kombucha**

In `src/pages/Kombucha.jsx`, do the same for its four state values:

```jsx
const initial = useMemo(
  () =>
    loadSession('kombucha', {
      baseRecipe: defaultBase,
      currentRecipe: defaultBase,
      fixedVolume: false,
      delayedSugar: false,
    }),
  [],
)
const [baseRecipe, setBaseRecipe] = useState(initial.baseRecipe)
const [currentRecipe, setCurrentRecipe] = useState(initial.currentRecipe)
const [fixedVolume, setFixedVolume] = useState(initial.fixedVolume)
const [delayedSugar, setDelayedSugar] = useState(initial.delayedSugar)

useSessionSync('kombucha', { baseRecipe, currentRecipe, fixedVolume, delayedSugar })
```

- [ ] **Step 6: Verify by hand**

Run: `npm run dev`. On each calculator, change several values, hard-reload, and confirm the values
come back. On Pizza, load a saved recipe, reload, and confirm the recipe name is still shown and
the save button still reads "Saved". Delete that recipe from the Recipes tab, reload, and confirm
the calculator opens with the values but no recipe name and no crash.

- [ ] **Step 7: Commit**

```bash
git add src/db/session.js src/hooks/useSessionSync.js src/pages
git commit -m "feat: restore the last session on every calculator"
```

---

### Task 11: Progressive web app

**Files:**
- Create: `public/icon.svg`, `pwa-assets.config.js`, `src/components/UpdatePrompt.jsx`
- Modify: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`

**Interfaces:**
- Consumes: nothing
- Produces: `<UpdatePrompt />` — mounted once in `main.jsx`, renders nothing until an update is waiting

- [ ] **Step 1: Install the PWA tooling**

```bash
npm install -D vite-plugin-pwa@^1 @vite-pwa/assets-generator@^1
```

- [ ] **Step 2: Create the source icon**

`public/icon.svg` — a flat mark that reads at 48 px. Solid background, no thin strokes:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#c4341f"/>
  <circle cx="256" cy="256" r="150" fill="#f6f6f7"/>
  <circle cx="212" cy="212" r="26" fill="#c4341f"/>
  <circle cx="300" cy="240" r="22" fill="#c4341f"/>
  <circle cx="238" cy="308" r="24" fill="#c4341f"/>
</svg>
```

- [ ] **Step 3: Configure and run icon generation**

`pwa-assets.config.js`:

```js
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/icon.svg'],
})
```

Add to `package.json` scripts:

```json
"generate-pwa-assets": "pwa-assets-generator"
```

Run: `npm run generate-pwa-assets`
Expected: `public/` gains `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`,
`maskable-icon-512x512.png`, and `apple-touch-icon-180x180.png`.

- [ ] **Step 4: Add the plugin to the Vite config**

`vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Recipe Calculators',
        short_name: 'Recipes',
        description: 'Kombucha, slambuc, and biga pizza dough calculators.',
        theme_color: '#c4341f',
        background_color: '#f6f6f7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
```

- [ ] **Step 5: Write the update prompt**

`src/components/UpdatePrompt.jsx`:

```jsx
import { useRegisterSW } from 'virtual:pwa-register/react'
import Button from './Button'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lg">
        <p className="flex-1 text-sm text-ink">A new version is ready.</p>
        <Button variant="ghost" size="sm" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
        <Button variant="primary" accent="pizza" size="sm" onClick={() => updateServiceWorker(true)}>
          Reload
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Mount it and update the document head**

In `src/main.jsx`, render `<UpdatePrompt />` as a sibling of `<App />` inside `<BrowserRouter>`.

In `index.html`, replace the Vite favicon link and theme colour:

```html
<link rel="icon" type="image/svg+xml" href="/icon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
<meta name="theme-color" content="#c4341f" />
<meta name="description" content="Kombucha, slambuc, and biga pizza dough calculators." />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

- [ ] **Step 7: Verify the build and offline behaviour**

Run: `npm run build` — expect success and a `dist/sw.js` plus `dist/manifest.webmanifest`.
Run: `npm run preview`. In devtools → Application, confirm the manifest parses with no icon
errors and a service worker is activated. Save a recipe. Tick "Offline" in the Network panel,
reload, and confirm the app still loads and the recipe is still listed.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.js pwa-assets.config.js index.html public src/main.jsx src/components/UpdatePrompt.jsx
git commit -m "feat: ship the app as an installable offline PWA"
```

---

### Task 12: Redesign pass across hub, shared components, and remaining calculators

**Files:**
- Modify: `src/components/PageContainer.jsx`, `src/components/Card.jsx`, `src/components/Header.jsx`, `src/components/Toggle.jsx`, `src/components/IngredientInput.jsx`, `src/pages/Hub.jsx`, `src/pages/Kombucha.jsx`, `src/pages/Slambuc.jsx`, `src/pages/pizza/PizzaCalculator.jsx`

**Interfaces:**
- Consumes: the tokens and primitives from Task 6
- Produces: no new interfaces. Every component keeps its current props.

- [ ] **Step 1: Restyle the shared shell components**

`PageContainer` — `min-h-screen bg-canvas text-ink pb-[env(safe-area-inset-bottom)]`.

`Card` — `bg-surface border border-line rounded-2xl p-4 sm:p-5`, no drop shadow, title
`text-sm font-semibold text-ink` with the icon at `text-ink-muted`.

`Header` — drop the saturated full-bleed accent bar. Use
`sticky top-0 z-50 bg-canvas/85 backdrop-blur border-b border-line`, ink-coloured text, a 44 px
back button, and a 3 px accent underline in the route's accent colour. Keep the `accent` prop and
its three values, remapping `amber → kombucha`, `orange → slambuc`, `red → pizza` internally so
existing callers keep working.

`Toggle` — `bg-sunken border border-line rounded-xl`, track in the route accent when checked,
`focus-visible:outline-2` on the switch, `role="switch"` preserved.

`IngredientInput` — token colours, `h-11` input, unit chip on `bg-sunken`, `tabular-nums`, focus
border in the route accent. Keep the `badge` prop; restyle the badge to
`bg-sunken text-ink-muted border border-line`.

- [ ] **Step 2: Redesign the hub**

Rewrite `src/pages/Hub.jsx` as a single-column list on mobile and a two-column grid from `sm`:

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import PageContainer from '../components/PageContainer'

const CALCULATORS = [
  { name: 'Kombucha', description: 'Batch scaling and delayed sugar', icon: '🍵', path: '/kombucha', dot: 'bg-kombucha' },
  { name: 'Slambuc', description: 'Ingredient ratios by people or by weight', icon: '🍲', path: '/slambuc', dot: 'bg-slambuc' },
  { name: 'Pizza', description: 'Biga dough, schedule, and saved recipes', icon: '🍕', path: '/pizza', dot: 'bg-pizza' },
]

export default function Hub() {
  return (
    <PageContainer>
      <div className="px-4 pt-12 pb-8 max-w-lg mx-auto">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Recipe calculators</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Scale it right.</h1>
          <p className="mt-2 text-ink-muted">Three kitchen calculators. Everything stays on this device.</p>
        </header>

        <nav className="grid gap-3 sm:grid-cols-2">
          {CALCULATORS.map((calc) => (
            <Link
              key={calc.name}
              to={calc.path}
              className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 min-h-11 transition-colors hover:border-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="text-3xl" aria-hidden="true">{calc.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${calc.dot}`} aria-hidden="true" />
                  <span className="font-semibold text-ink">{calc.name}</span>
                </span>
                <span className="block text-sm text-ink-muted mt-0.5">{calc.description}</span>
              </span>
              <ChevronRight className="w-5 h-5 text-ink-muted group-hover:text-ink" aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </div>
    </PageContainer>
  )
}
```

- [ ] **Step 3: Restyle Kombucha and Slambuc**

Replace hard-coded greys (`bg-white`, `bg-gray-50`, `text-gray-900`, `text-gray-500`,
`border-gray-100`, `border-gray-200`) with the tokens (`bg-surface`, `bg-sunken`, `text-ink`,
`text-ink-muted`, `border-line`). Replace bespoke buttons with `<Button>`. Add `tabular-nums` to
every numeric readout. Ensure each stepper and toggle is at least 44 px. Do not change any
calculation, label text, or control behaviour.

- [ ] **Step 4: Restyle PizzaCalculator**

Same substitution pass. Additionally: the two result tables get `tabular-nums` on the numeric
column and `text-ink-muted` on the percentage column; the fermentation colour map moves to token-
free semantic classes that work in dark mode:

```jsx
const FERMENTATION_COLOR = {
  'very-short': 'text-red-600 dark:text-red-400',
  short: 'text-amber-600 dark:text-amber-400',
  medium: 'text-green-600 dark:text-green-400',
  long: 'text-green-700 dark:text-green-400',
  'very-long': 'text-blue-600 dark:text-blue-400',
  extended: 'text-purple-600 dark:text-purple-400',
}
```

- [ ] **Step 5: Full verification**

Run: `npm test` — expect all suites green.
Run: `npm run build` — expect success.
Run: `npm run preview` and check at 375 px and 1280 px, in light mode and dark mode:
- Hub, Kombucha, Slambuc, Pizza Calculator, Pizza Recipes all render with no horizontal scroll
- Pizza defaults still read 1060.8 / 631.4 / 189.4 / 79.6 / 1.9 / 442 / 330.9 / 17
- Kombucha and Slambuc produce the same numbers as before the redesign for the same inputs
- Tab through each page and confirm every control shows a visible focus ring

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "style: redesign hub, calculators, and shared components"
```

---

## Verification Checklist

Run before declaring the work finished:

- [ ] `npm test` — all suites pass
- [ ] `npm run build` — succeeds, emits `sw.js` and `manifest.webmanifest`
- [ ] Save a recipe, close the browser entirely, reopen, and confirm it is still listed
- [ ] Install to the home screen and open a saved recipe with networking disabled
- [ ] Open a share link on a second device and confirm the recipe loads
- [ ] Confirm the pizza defaults still produce 1060.8 g target and 631.4 g flour
