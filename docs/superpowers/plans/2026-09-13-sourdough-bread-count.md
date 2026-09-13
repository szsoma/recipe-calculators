# Sourdough Bread Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the Sourdough calculator scale the whole batch by a "Number of breads" count, treating baked weight as per-loaf.

**Architecture:** Add a `breads` param (mirroring pizza's `balls`). `computeSourdough` multiplies the target baked weight by `breads`, so every downstream ingredient scales as a batch total. The UI shows the count input plus batch and per-loaf dough weights; persistence normalizes missing `breads` to `1`.

**Tech Stack:** React 19, Vite, Vitest, Tailwind CSS v4.

## Global Constraints

- `bakedWeight` is the weight of ONE loaf; `breads` defaults to `1`, valid range `1–12`, step `1`.
- All values returned by `computeSourdough` are full-batch totals (what gets mixed).
- Recipe text and saved recipes must remain full-batch.
- Do NOT bump `SCHEMA_VERSION`; missing `breads` is filled by `normalizeSourdoughParams` on load and save.
- No comments in production code. Follow existing file style.

---

### Task 1: Scale the sourdough calculation by bread count

**Files:**
- Create: `src/lib/sourdough.test.js`
- Modify: `src/lib/sourdough.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `DEFAULT_SOURDOUGH_PARAMS.breads` (`number`, default `1`); `computeSourdough(params)` return additions `totalBaked: number` and `perLoafDough: number`; `buildRecipeText(params)` emits `Target: {breads} × {bakedWeight}g baked = {totalBaked}g ({doughWeight}g dough)`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/sourdough.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { DEFAULT_SOURDOUGH_PARAMS, computeSourdough, buildRecipeText } from './sourdough'

describe('computeSourdough bread count', () => {
  it('defaults to a single loaf', () => {
    const d = computeSourdough({ ...DEFAULT_SOURDOUGH_PARAMS })
    expect(d.totalBaked).toBe(800)
    expect(Math.round(d.doughWeight * 10) / 10).toBe(941.2)
    expect(Math.round(d.perLoafDough * 10) / 10).toBe(941.2)
    expect(Math.round(d.totalFlour * 10) / 10).toBe(563.6)
  })

  it('scales every ingredient by the bread count', () => {
    const one = computeSourdough({ ...DEFAULT_SOURDOUGH_PARAMS, breads: 1 })
    const three = computeSourdough({ ...DEFAULT_SOURDOUGH_PARAMS, breads: 3 })
    expect(three.totalBaked).toBe(2400)
    expect(three.totalFlour).toBeCloseTo(one.totalFlour * 3, 6)
    expect(three.firstFlour).toBeCloseTo(one.firstFlour * 3, 6)
    expect(three.remainingWater).toBeCloseTo(one.remainingWater * 3, 6)
    expect(three.saltG).toBeCloseTo(one.saltG * 3, 6)
    expect(three.motherTbsp).toBeCloseTo(one.motherTbsp * 3, 6)
  })

  it('keeps the per-loaf dough weight independent of the count', () => {
    const d = computeSourdough({ ...DEFAULT_SOURDOUGH_PARAMS, breads: 4 })
    expect(Math.round(d.perLoafDough * 10) / 10).toBe(941.2)
  })
})

describe('buildRecipeText', () => {
  it('states the loaf count and batch totals', () => {
    const text = buildRecipeText({ ...DEFAULT_SOURDOUGH_PARAMS, breads: 2 })
    expect(text).toContain('Target: 2 × 800g baked = 1600g (1882.4g dough)')
    expect(text).toContain('Flour total: 1127.2g')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/sourdough.test.js`
Expected: FAIL — `d.totalBaked` is `NaN` / undefined and the recipe text does not match.

- [ ] **Step 3: Add breads to the defaults**

In `src/lib/sourdough.js`, change `DEFAULT_SOURDOUGH_PARAMS`:

```js
export const DEFAULT_SOURDOUGH_PARAMS = {
  breads: 1,
  bakedWeight: 800,
  hydration: 65,
  salt: 2,
  sourdoughPct: 20,
  secondFlourPct: 0,
}
```

- [ ] **Step 4: Scale the calculation**

Replace the start of `computeSourdough` and its return in `src/lib/sourdough.js`:

```js
export function computeSourdough(params) {
  const { bakedWeight, breads = 1, hydration, salt, sourdoughPct, secondFlourPct } = params

  const totalBaked = bakedWeight * breads
  const doughWeight = totalBaked / (1 - BAKING_LOSS)
  const totalFlour = doughWeight / (1 + hydration / 100 + salt / 100)

  const sourdoughFlour = (totalFlour * sourdoughPct) / 100
  const sourdoughWater = sourdoughFlour
  const motherTbsp = sourdoughFlour / 100 * MOTHER_TBSP_PER_100G

  const secondFlour = (totalFlour * secondFlourPct) / 100
  const firstFlour = totalFlour - secondFlour - sourdoughFlour
  const remainingWater = (totalFlour * hydration) / 100 - sourdoughWater
  const saltG = (totalFlour * salt) / 100

  return {
    totalBaked,
    doughWeight,
    perLoafDough: doughWeight / breads,
    totalFlour,
    sourdoughFlour,
    sourdoughWater,
    motherTbsp,
    secondFlour,
    firstFlour,
    remainingWater,
    saltG,
    total: firstFlour + secondFlour + sourdoughFlour + remainingWater + sourdoughWater + saltG,
  }
}
```

- [ ] **Step 5: Update the recipe text**

In `buildRecipeText` in `src/lib/sourdough.js`, add a local and change the target line:

```js
export function buildRecipeText(params) {
  const d = computeSourdough(params)
  const breads = params.breads ?? 1

  const lines = []
  lines.push(`🍞 Sourdough Bread Recipe`)
  lines.push(`─────────────────────────`)
  lines.push(`Target: ${breads} × ${params.bakedWeight}g baked = ${round(d.totalBaked)}g (${round(d.doughWeight)}g dough)`)
```

Leave the rest of `buildRecipeText` unchanged.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/lib/sourdough.test.js`
Expected: PASS (4 tests).

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/sourdough.js src/lib/sourdough.test.js
git commit -m "feat: scale sourdough recipe by bread count"
```

---

### Task 2: Persist and normalize the bread count

**Files:**
- Modify: `src/db/schema.js:56-80`
- Modify: `src/pages/Sourdough.jsx:62-66`
- Test: `src/db/recipes.test.js`

**Interfaces:**
- Consumes: `DEFAULT_SOURDOUGH_PARAMS.breads` from Task 1.
- Produces: `normalizeSourdoughParams` always returns a numeric `breads` (defaulting to `1`); loading a saved recipe yields params with `breads` present.

- [ ] **Step 1: Write the failing test**

Append to `src/db/recipes.test.js`. First update the imports at the top of the file:

```js
import { list, get, save, remove, duplicate, importRecipe, skippedCount, STORAGE_KEY, saveSourdough } from './recipes'
```

Then add this block at the end of the top-level `describe('recipes', ...)`:

```js
  describe('sourdough param normalization', () => {
    it('defaults breads to 1 for legacy recipes saved without it', () => {
      const saved = saveSourdough({ name: 'Legacy', params: { bakedWeight: 800, hydration: 65 } })
      expect(saved.params.breads).toBe(1)
    })

    it('preserves an explicit bread count', () => {
      const saved = saveSourdough({ name: 'Two loaves', params: { bakedWeight: 800, breads: 2 } })
      expect(saved.params.breads).toBe(2)
    })
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/db/recipes.test.js`
Expected: FAIL — `saved.params.breads` is `undefined` for the legacy recipe.

- [ ] **Step 3: Add breads to the schema keys**

In `src/db/schema.js`, update both arrays:

```js
export const SOURDOUGH_PARAM_KEYS = [
  'breads',
  'bakedWeight',
  'hydration',
  'salt',
  'sourdoughPct',
  'secondFlourPct',
]

const SOURDOUGH_NUMERIC_KEYS = [
  'breads',
  'bakedWeight',
  'hydration',
  'salt',
  'sourdoughPct',
  'secondFlourPct',
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/db/recipes.test.js`
Expected: PASS.

- [ ] **Step 5: Normalize params when loading a saved recipe**

In `src/pages/Sourdough.jsx`, change `handleLoad`:

```js
  function handleLoad(recipe) {
    setParams(normalizeSourdoughParams(recipe.params))
    setLoadedRecipe(recipe)
    setTab('calculator')
  }
```

`normalizeSourdoughParams` is already imported at the top of the file.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.js src/db/recipes.test.js src/pages/Sourdough.jsx
git commit -m "feat: persist sourdough bread count"
```

---

### Task 3: Add the count input and batch display to the calculator

**Files:**
- Modify: `src/pages/sourdough/SourdoughCalculator.jsx:57-63`

**Interfaces:**
- Consumes: `params.breads`, `d.totalBaked`, `d.doughWeight`, `d.perLoafDough` from Task 1.
- Produces: Bread card with a "Number of breads" control; batch target with per-loaf sub-line.

- [ ] **Step 1: Replace the Bread card fields**

In `src/pages/sourdough/SourdoughCalculator.jsx`, replace the `<div className="space-y-4">` block inside the Bread `Card` (currently lines 57–63) with:

```jsx
        <div className="space-y-4">
          <NumberInput label="Baked bread weight" value={params.bakedWeight} onChange={(v) => setParam('bakedWeight', v)} min={200} max={2000} step={50} unit="g" />
          <NumberInput label="Number of breads" value={params.breads} onChange={(v) => setParam('breads', v)} min={1} max={12} step={1} />
          <div className="bg-sunken rounded-xl p-3 border border-line">
            <div className="flex justify-between items-center">
              <span className="text-sm text-ink-muted">Target dough weight</span>
              <span className="text-ink font-bold">{round(d.doughWeight)}g</span>
            </div>
            {params.breads > 1 && (
              <p className="text-xs text-ink-muted mt-0.5 text-right">
                {round(d.perLoafDough)}g per bread
              </p>
            )}
          </div>
        </div>
```

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Verify the production build**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev`, open `/sourdough`, set "Number of breads" to `2`.
Expected: target dough weight doubles (1882.4g) and a "941.2g per bread" sub-line appears; setting it back to `1` hides the sub-line. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/pages/sourdough/SourdoughCalculator.jsx
git commit -m "feat: add bread count input to sourdough calculator"
```

---

### Task 4: Show the count in the saved-recipe summary

**Files:**
- Modify: `src/pages/sourdough/recipeSummary.js`
- Test: Create `src/pages/sourdough/recipeSummary.test.js`

**Interfaces:**
- Consumes: `params.breads` from Task 2's normalization.
- Produces: `recipeSummary(params)` string formatted `{breads} × {bakedWeight}g baked · {hydration}% hydration · {sourdoughPct}% sourdough`.

- [ ] **Step 1: Write the failing test**

Create `src/pages/sourdough/recipeSummary.test.js`:

```js
import { describe, it, expect } from 'vitest'
import recipeSummary from './recipeSummary'

describe('sourdough recipeSummary', () => {
  it('prefixes the bake with the loaf count', () => {
    expect(recipeSummary({ breads: 2, bakedWeight: 800, hydration: 65, sourdoughPct: 20 })).toBe(
      '2 × 800g baked · 65% hydration · 20% sourdough',
    )
  })

  it('defaults a missing bread count to 1', () => {
    expect(recipeSummary({ bakedWeight: 800, hydration: 65, sourdoughPct: 20 })).toBe(
      '1 × 800g baked · 65% hydration · 20% sourdough',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/sourdough/recipeSummary.test.js`
Expected: FAIL — actual string starts with `undefined × 800g baked...`.

- [ ] **Step 3: Update the summary**

Replace `src/pages/sourdough/recipeSummary.js` with:

```js
export default function recipeSummary(params) {
  const breads = params.breads ?? 1
  return `${breads} × ${params.bakedWeight}g baked · ${params.hydration}% hydration · ${params.sourdoughPct}% sourdough`
}
```

Note: the previous file imported `round` but never used it, so removing that import is intentional.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/sourdough/recipeSummary.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite and build**

Run: `npm test && npm run build`
Expected: PASS and a clean build.

- [ ] **Step 6: Commit**

```bash
git add src/pages/sourdough/recipeSummary.js src/pages/sourdough/recipeSummary.test.js
git commit -m "feat: show bread count in sourdough recipe summary"
```

---

## Self-Review

**Spec coverage:**
- Per-loaf weight × count → Task 1.
- Default `1`, range `1–12`, step `1` → Task 1 defaults, Task 3 UI.
- Batch totals in tables/text → Task 1 (`computeSourdough` returns batch totals; tables unchanged).
- Recipe text `Target: 2 × 800g baked = 1600g (1882.4g dough)` → Task 1.
- Schema keys + old-recipe default + normalize on load → Task 2.
- Count input + batch/per-loaf display → Task 3.
- Recipe summary prefix → Task 4.
- Explicitly out of scope per spec: `SCHEMA_VERSION` bump — none added.

**Placeholder scan:** No TBD/TODO; every code step contains complete code and every command has expected output.

**Type consistency:** `breads`, `totalBaked`, and `perLoafDough` are introduced in Task 1 and consumed with the same names in Tasks 2–4. `normalizeSourdoughParams` keeps its existing name and import path.
