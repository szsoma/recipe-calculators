# Sourdough Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sourdough bread calculator that works backwards from target baked bread weight, with saved recipes.

**Architecture:** Single-stage sourdough calculator with pre-ferment. Reuses existing components (Card, NumberInput, Button, Dialog, Tabs, Field) and follows the pizza calculator's pattern for recipe saving/loading.

**Tech Stack:** React, Vite, Tailwind CSS, localStorage (via existing store.js)

---

## File Structure

### New files
- `src/lib/sourdough.js` — calculation logic, defaults, recipe text builder
- `src/pages/sourdough/SourdoughCalculator.jsx` — calculator UI
- `src/pages/sourdough/SourdoughRecipes.jsx` — saved recipes list
- `src/pages/sourdough/recipeSummary.js` — one-line summary for recipe list
- `src/pages/Sourdough.jsx` — page container with tabs, save/load logic

### Modified files
- `src/db/schema.js` — add `SOURDOUGH_PARAM_KEYS`, `normalizeSourdoughParams()`
- `src/db/recipes.js` — add sourdough storage key and CRUD functions
- `src/App.jsx` — add `/sourdough` route
- `src/pages/Hub.jsx` — add sourdough to calculator list

---

### Task 1: Calculation logic

**Files:**
- Create: `src/lib/sourdough.js`

- [ ] **Step 1: Create sourdough.js with defaults and calculation**

```js
export const BAKING_LOSS = 0.15
export const MOTHER_TBSP_PER_100G = 1

export const DEFAULT_SOURDOUGH_PARAMS = {
  bakedWeight: 800,
  hydration: 65,
  salt: 2,
  sourdoughPct: 20,
  secondFlourPct: 0,
}

export function round(v) {
  return Math.round(v * 10) / 10
}

export function computeSourdough(params) {
  const { bakedWeight, hydration, salt, sourdoughPct, secondFlourPct } = params

  const doughWeight = bakedWeight / (1 - BAKING_LOSS)
  const totalFlour = doughWeight / (1 + hydration / 100 + salt / 100)

  const sourdoughFlour = (totalFlour * sourdoughPct) / 100
  const sourdoughWater = sourdoughFlour
  const motherTbsp = sourdoughFlour / 100 * MOTHER_TBSP_PER_100G

  const secondFlour = (totalFlour * secondFlourPct) / 100
  const firstFlour = totalFlour - secondFlour - sourdoughFlour
  const remainingWater = (totalFlour * hydration) / 100 - sourdoughWater
  const saltG = (totalFlour * salt) / 100

  return {
    doughWeight,
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

export function equivalentHours(hours, temp) {
  return hours * Math.pow(2, (temp - 18) / 10)
}

export const FERMENTATION_TEXT = {
  short: 'Short — mild fermentation flavor',
  medium: 'Medium — good flavor balance',
  long: 'Long — complex, developed flavor',
  'very-long': 'Very long — deep, artisan flavor',
  extended: 'Extended — very deep, sour notes possible',
}

export function fermentationLevel(eqHours) {
  if (eqHours < 6) return 'short'
  if (eqHours < 12) return 'medium'
  if (eqHours < 24) return 'long'
  if (eqHours < 48) return 'very-long'
  return 'extended'
}

export function formatDateTime(date) {
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${time} ${day}`
}

export function buildRecipeText(params) {
  const d = computeSourdough(params)

  const lines = []
  lines.push(`🍞 Sourdough Bread Recipe`)
  lines.push(`─────────────────────────`)
  lines.push(`Target: ${params.bakedWeight}g baked (${round(d.doughWeight)}g dough)`)
  lines.push(`Flour total: ${round(d.totalFlour)}g`)
  lines.push(``)
  lines.push(`── Sourdough (${params.sourdoughPct}%) ──`)
  lines.push(`Flour: ${round(d.sourdoughFlour)}g`)
  lines.push(`Water: ${round(d.sourdoughWater)}g`)
  lines.push(`Mother: ${round(d.motherTbsp)} tbsp`)
  lines.push(`Ferment: 12h`)
  lines.push(``)
  lines.push(`── Main Dough ──`)
  lines.push(`First flour: ${round(d.firstFlour)}g`)
  if (params.secondFlourPct > 0) {
    lines.push(`Second flour: ${round(d.secondFlour)}g`)
  }
  lines.push(`Water: ${round(d.remainingWater)}g`)
  lines.push(`Salt: ${round(d.saltG)}g`)
  lines.push(``)
  lines.push(`Total: ${round(d.total)}g`)

  return lines.join('\n')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/sourdough.js
git commit -m "feat: add sourdough calculation logic"
```

---

### Task 2: Database schema and storage

**Files:**
- Modify: `src/db/schema.js`
- Modify: `src/db/recipes.js`

- [ ] **Step 1: Add sourdough params to schema.js**

Add after the existing pizza PARAM_KEYS:

```js
export const SOURDOUGH_PARAM_KEYS = [
  'bakedWeight',
  'hydration',
  'salt',
  'sourdoughPct',
  'secondFlourPct',
]

const SOURDOUGH_NUMERIC_KEYS = [
  'bakedWeight',
  'hydration',
  'salt',
  'sourdoughPct',
  'secondFlourPct',
]

export function normalizeSourdoughParams(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const out = {}
  for (const key of SOURDOUGH_NUMERIC_KEYS) {
    const n = Number(src[key])
    out[key] = Number.isFinite(n) ? n : DEFAULT_SOURDOUGH_PARAMS[key]
  }
  return out
}
```

Also add the import at the top:

```js
import { DEFAULT_SOURDOUGH_PARAMS } from '../lib/sourdough'
```

- [ ] **Step 2: Add sourdough storage to recipes.js**

Add after the existing pizza STORAGE_KEY:

```js
export const STORAGE_KEY_SOURDOUGH = 'recipes.sourdough'
```

Add sourdough-specific functions:

```js
export function listSourdough() {
  const raw = read(STORAGE_KEY_SOURDOUGH)
  if (!Array.isArray(raw)) return []
  return raw
    .filter((r) => isValidRecipe(r))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
}

export function getSourdough(id) {
  const raw = read(STORAGE_KEY_SOURDOUGH)
  if (!Array.isArray(raw)) return null
  return raw.find((r) => r.id === id) ?? null
}

export function saveSourdough({ id, name, note = '', params }) {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (trimmed === '') throw new Error('Recipe name is required')

  const raw = read(STORAGE_KEY_SOURDOUGH)
  const all = Array.isArray(raw) ? raw.filter((r) => isValidRecipe(r)) : []
  const existing = id ? all.find((r) => r.id === id) : null
  const timestamp = new Date().toISOString()

  const record = {
    id: existing ? existing.id : (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `r-${Math.random().toString(36).slice(2)}-${performance.now().toString(36)}`),
    name: trimmed,
    note: typeof note === 'string' ? note : '',
    createdAt: existing ? existing.createdAt : timestamp,
    updatedAt: timestamp,
    schemaVersion: SCHEMA_VERSION,
    params: normalizeSourdoughParams(params),
  }

  const next = existing ? all.map((r) => (r.id === record.id ? record : r)) : [...all, record]
  write(STORAGE_KEY_SOURDOUGH, next)
  return record
}

export function removeSourdough(id) {
  const raw = read(STORAGE_KEY_SOURDOUGH)
  const all = Array.isArray(raw) ? raw.filter((r) => isValidRecipe(r)) : []
  write(
    STORAGE_KEY_SOURDOUGH,
    all.filter((r) => r.id !== id),
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.js src/db/recipes.js
git commit -m "feat: add sourdough database schema and storage"
```

---

### Task 3: Recipe summary

**Files:**
- Create: `src/pages/sourdough/recipeSummary.js`

- [ ] **Step 1: Create recipeSummary.js**

```js
import { round } from '../../lib/sourdough'

export default function recipeSummary(params) {
  return `${params.bakedWeight}g baked · ${params.hydration}% hydration · ${params.sourdoughPct}% sourdough`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/sourdough/recipeSummary.js
git commit -m "feat: add sourdough recipe summary"
```

---

### Task 4: Calculator component

**Files:**
- Create: `src/pages/sourdough/SourdoughCalculator.jsx`

- [ ] **Step 1: Create SourDoughCalculator.jsx**

```jsx
import { useState } from 'react'
import Card from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import { Copy, Clock, Check } from 'lucide-react'
import {
  round,
  computeSourdough,
  equivalentHours,
  fermentationLevel,
  FERMENTATION_TEXT,
  buildRecipeText,
} from '../../lib/sourdough'

const FERMENTATION_COLOR = {
  short: 'text-amber-600 dark:text-amber-400',
  medium: 'text-green-600 dark:text-green-400',
  long: 'text-green-700 dark:text-green-400',
  'very-long': 'text-blue-600 dark:text-blue-400',
  extended: 'text-purple-600 dark:text-purple-400',
}

export default function SourDoughCalculator({ params, setParam, loadedRecipe, isDirty, footer }) {
  const [copied, setCopied] = useState(false)

  const d = computeSourdough(params)
  const fermentEq = equivalentHours(12, 20)
  const fermentLevel = fermentationLevel(fermentEq)

  function handleCopy() {
    const text = buildRecipeText(params)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">

      {loadedRecipe && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-ink">{loadedRecipe.name}</span>
          {isDirty && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-sourdough" aria-hidden="true" />
              unsaved changes
            </span>
          )}
        </div>
      )}

      {/* Bread */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">🍞</span> Bread
        </h2>
        <div className="space-y-4">
          <NumberInput label="Baked bread weight" value={params.bakedWeight} onChange={(v) => setParam('bakedWeight', v)} min={200} max={2000} step={50} unit="g" />
          <div className="bg-sunken rounded-xl p-3 flex justify-between items-center border border-line">
            <span className="text-sm text-ink-muted">Target dough weight</span>
            <span className="text-ink font-bold">{round(d.doughWeight)}g</span>
          </div>
        </div>
      </Card>

      {/* Sourdough */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">🫗</span> Sourdough <span className="text-xs text-ink-muted font-normal">12h ferment</span>
        </h2>
        <div className="space-y-4">
          <NumberInput label="Share of total flour" value={params.sourdoughPct} onChange={(v) => setParam('sourdoughPct', v)} min={10} max={40} step={1} unit="%" />
          <div className="bg-sunken rounded-xl p-3 border border-line">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-ink-muted">Fermentation equivalent</span>
              <span className="text-ink font-bold">{round(fermentEq)}h @ 18°C</span>
            </div>
            <p className={`text-xs font-medium ${FERMENTATION_COLOR[fermentLevel]}`}>{FERMENTATION_TEXT[fermentLevel]}</p>
          </div>
        </div>
      </Card>

      {/* Dough */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">🫓</span> Dough
        </h2>
        <div className="space-y-4">
          <NumberInput label="Hydration" value={params.hydration} onChange={(v) => setParam('hydration', v)} min={55} max={80} step={1} unit="%" />
          <NumberInput label="Salt" value={params.salt} onChange={(v) => setParam('salt', v)} min={1.5} max={3} step={0.1} unit="%" />
          <NumberInput label="Second flour" value={params.secondFlourPct} onChange={(v) => setParam('secondFlourPct', v)} min={0} max={100} step={5} unit="%" />
        </div>
      </Card>

      {/* Recipe */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">📋</span> Recipe <span className="text-xs text-ink-muted font-normal">{round(d.totalFlour)}g flour</span>
        </h2>

        {/* Sourdough table */}
        <div className="mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2 text-ink-muted font-normal text-xs uppercase tracking-wider" colSpan={2}>Sourdough</th>
                <th className="text-right py-2 text-ink-muted font-normal text-xs uppercase tracking-wider">g</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Flour</td>
                <td className="py-2 text-ink-muted text-xs">100%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.sourdoughFlour)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Water</td>
                <td className="py-2 text-ink-muted text-xs">100%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.sourdoughWater)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Mother</td>
                <td className="py-2 text-ink-muted text-xs">—</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.motherTbsp)} tbsp</td>
              </tr>
              <tr>
                <td className="py-2 text-ink font-semibold" colSpan={2}>Sourdough total</td>
                <td className="py-2 text-ink text-right font-bold tabular-nums">{round(d.sourdoughFlour + d.sourdoughWater)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main dough table */}
        <div className="mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2 text-ink-muted font-normal text-xs uppercase tracking-wider" colSpan={2}>Main Dough</th>
                <th className="text-right py-2 text-ink-muted font-normal text-xs uppercase tracking-wider">g</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">First flour</td>
                <td className="py-2 text-ink-muted text-xs">{round(100 - params.sourdoughPct - params.secondFlourPct)}%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.firstFlour)}</td>
              </tr>
              {params.secondFlourPct > 0 && (
                <tr className="border-b border-dashed border-line">
                  <td className="py-2 text-ink">Second flour</td>
                  <td className="py-2 text-ink-muted text-xs">{params.secondFlourPct}%</td>
                  <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.secondFlour)}</td>
                </tr>
              )}
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Water</td>
                <td className="py-2 text-ink-muted text-xs">—</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.remainingWater)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Salt</td>
                <td className="py-2 text-ink-muted text-xs">{params.salt}%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.saltG)}</td>
              </tr>
              <tr>
                <td className="py-2 text-ink font-semibold" colSpan={2}>Total</td>
                <td className="py-2 text-ink text-right font-bold tabular-nums">{round(d.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="w-full py-3 bg-sourdough hover:opacity-90 text-white rounded-xl font-semibold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy recipe'}
        </button>
      </Card>

      {footer}

      {/* Footer */}
      <p className="text-center text-xs text-ink-muted italic pb-4 font-mono">
        Fermentation rate roughly doubles per 10°C.<br />
        A planning aid, not a verdict — watch the dough.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/sourdough/SourdoughCalculator.jsx
git commit -m "feat: add sourdough calculator component"
```

---

### Task 5: Recipes list component

**Files:**
- Create: `src/pages/sourdough/SourdoughRecipes.jsx`

- [ ] **Step 1: Create SourDoughRecipes.jsx**

```jsx
import { useState } from 'react'
import { Trash2, Copy } from 'lucide-react'
import Card from '../../components/Card'
import recipeSummary from './recipeSummary'
import { listSourdough, removeSourdough, duplicate } from '../../db/recipes'

export default function SourDoughRecipes({ onLoad, onRecipesChanged }) {
  const [recipes, setRecipes] = useState(() => listSourdough())

  function refresh() {
    setRecipes(listSourdough())
    onRecipesChanged?.()
  }

  function handleDelete(id) {
    removeSourdough(id)
    refresh()
  }

  function handleDuplicate(id) {
    duplicate(id)
    refresh()
  }

  if (recipes.length === 0) {
    return (
      <div className="px-4 py-12 max-w-lg mx-auto text-center">
        <p className="text-ink-muted text-sm">No saved recipes yet.</p>
        <p className="text-ink-muted text-xs mt-1">Calculate your dough, then tap "Save recipe".</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
      {recipes.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={() => onLoad(r)}
              className="flex-1 text-left min-w-0"
            >
              <div className="font-semibold text-ink truncate">{r.name}</div>
              <div className="text-xs text-ink-muted mt-0.5 font-mono">
                {recipeSummary(r.params)}
              </div>
              {r.note && (
                <div className="text-xs text-ink-muted mt-1 line-clamp-2">{r.note}</div>
              )}
            </button>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => handleDuplicate(r.id)}
                className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
                title="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="p-2 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/sourdough/SourdoughRecipes.jsx
git commit -m "feat: add sourdough recipes list component"
```

---

### Task 6: Page container

**Files:**
- Create: `src/pages/Sourdough.jsx`

- [ ] **Step 1: Create Sourdough.jsx**

```jsx
import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Tabs from '../components/Tabs'
import Button from '../components/Button'
import SourDoughCalculator from './sourdough/SourdoughCalculator'
import SourDoughRecipes from './sourdough/SourdoughRecipes'
import SaveRecipeDialog from './pizza/SaveRecipeDialog'
import { DEFAULT_SOURDOUGH_PARAMS } from '../lib/sourdough'
import { getSourdough as getRecipe, saveSourdough as saveRecipe } from '../db/recipes'
import { isPersistent } from '../db/store'
import { SOURDOUGH_PARAM_KEYS, normalizeSourdoughParams } from '../db/schema'
import { loadSession } from '../db/session'
import useSessionSync from '../hooks/useSessionSync'

const TABS = [
  { id: 'calculator', label: 'Calculator' },
  { id: 'recipes', label: 'Recipes' },
]

export default function Sourdough() {
  const [tab, setTab] = useState('calculator')
  const initial = useMemo(() => {
    const stored = loadSession('sourdough', {
      params: DEFAULT_SOURDOUGH_PARAMS,
      loadedRecipeId: null,
    })
    return {
      params: normalizeSourdoughParams(stored.params),
      loadedRecipeId: typeof stored.loadedRecipeId === 'string' ? stored.loadedRecipeId : null,
    }
  }, [])
  const [params, setParams] = useState(initial.params)
  const [loadedRecipe, setLoadedRecipe] = useState(() =>
    initial.loadedRecipeId ? getRecipe(initial.loadedRecipeId) : null,
  )
  const [dialog, setDialog] = useState(null)
  const [saveError, setSaveError] = useState('')

  function setParam(key, value) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  const isDirty = useMemo(() => {
    if (!loadedRecipe) return false
    return SOURDOUGH_PARAM_KEYS.some((k) => String(params[k]) !== String(loadedRecipe.params[k]))
  }, [params, loadedRecipe])

  useSessionSync('sourdough', { params, loadedRecipeId: loadedRecipe?.id ?? null })

  function handleSaveNew({ name, note }) {
    try {
      const record = saveRecipe({ name, note, params })
      setLoadedRecipe(record)
      setDialog(null)
      setSaveError('')
    } catch (err) {
      setSaveError(err.message || 'Could not save recipe.')
    }
  }

  function handleLoad(recipe) {
    setParams(recipe.params)
    setLoadedRecipe(recipe)
    setTab('calculator')
  }

  function handleRecipesChanged() {
    if (!loadedRecipe) return
    setLoadedRecipe(getRecipe(loadedRecipe.id))
  }

  function handleOverwrite() {
    const current = getRecipe(loadedRecipe.id)
    if (!current) {
      setLoadedRecipe(null)
      setDialog('save')
      return
    }
    try {
      const record = saveRecipe({
        id: current.id,
        name: current.name,
        note: current.note,
        params,
      })
      setLoadedRecipe(record)
      setSaveError('')
    } catch (err) {
      setSaveError(err.message || 'Could not save recipe.')
    }
  }

  const saveFooter = (
    <div className="space-y-2">
      {!isPersistent() && (
        <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
          This browser is blocking storage — recipes will be lost when you close the app.
        </p>
      )}
      {dialog === null && saveError && (
        <p className="text-xs text-red-600 text-center">{saveError}</p>
      )}
      {loadedRecipe ? (
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setDialog('saveAs')}>
            Save as new
          </Button>
          <Button variant="primary" accent="sourdough" fullWidth disabled={!isDirty} onClick={handleOverwrite}>
            {isDirty ? 'Save changes' : 'Saved'}
          </Button>
        </div>
      ) : (
        <Button variant="primary" accent="sourdough" fullWidth onClick={() => setDialog('save')}>
          Save recipe
        </Button>
      )}
    </div>
  )

  return (
    <PageContainer>
      <Header icon="🍞" title="Sourdough" accent="sourdough" />
      <div className="sticky top-14 z-40 bg-canvas">
        <div className="max-w-lg mx-auto px-4">
          <Tabs items={TABS} value={tab} onChange={setTab} accent="sourdough" />
        </div>
      </div>

      {tab === 'calculator' ? (
        <SourDoughCalculator
          params={params}
          setParam={setParam}
          loadedRecipe={loadedRecipe}
          isDirty={isDirty}
          footer={saveFooter}
        />
      ) : (
        <SourDoughRecipes onLoad={handleLoad} onRecipesChanged={handleRecipesChanged} />
      )}

      <SaveRecipeDialog
        open={dialog !== null}
        title={dialog === 'saveAs' ? 'Save as new recipe' : 'Save recipe'}
        initialName={dialog === 'saveAs' && loadedRecipe ? `${loadedRecipe.name} (copy)` : ''}
        initialNote={dialog === 'saveAs' && loadedRecipe ? loadedRecipe.note : ''}
        onSubmit={handleSaveNew}
        onClose={() => setDialog(null)}
        submitError={saveError}
      />
    </PageContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Sourdough.jsx
git commit -m "feat: add sourdough page container"
```

---

### Task 7: Route and hub

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/Hub.jsx`

- [ ] **Step 1: Add route to App.jsx**

Add import and route:

```jsx
import Sourdough from './pages/Sourdough'
```

```jsx
<Route path="/sourdough" element={<Sourdough />} />
```

- [ ] **Step 2: Add to Hub.jsx**

Add to CALCULATORS array:

```js
{ name: 'Sourdough', description: 'Bread from starter, scaled to bake', icon: '🍞', path: '/sourdough', dot: 'bg-sourdough' },
```

- [ ] **Step 3: Add sourdough color to Tailwind config**

Check if `tailwind.config.js` exists and add the sourdough color. If not, add to `src/index.css` or equivalent.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/pages/Hub.jsx
git commit -m "feat: add sourdough route and hub entry"
```

---

### Task 8: Add sourdough color

**Files:**
- Modify: `tailwind.config.js` (or equivalent)

- [ ] **Step 1: Add sourdough color**

Add to the theme colors:

```js
sourdough: '#8B6914',
```

Or a warm bread-like color that fits the theme.

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: add sourdough theme color"
```

---

### Task 9: Test

- [ ] **Step 1: Run dev server and test**

```bash
npm run dev
```

Test:
1. Navigate to `/sourdough`
2. Verify calculator renders with defaults
3. Change baked weight, verify dough weight updates
4. Change hydration/salt, verify recipe updates
5. Set second flour %, verify it appears in recipe
6. Copy recipe, verify clipboard
7. Save recipe, verify it appears in Recipes tab
8. Load saved recipe, verify params restore
9. Delete recipe, verify removal

- [ ] **Step 2: Run lint and typecheck**

```bash
npm run lint
npm run typecheck
```

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: sourdough calculator lint and type fixes"
```
