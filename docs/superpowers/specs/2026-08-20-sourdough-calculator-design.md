# Sourdough Calculator Design

## Overview

A sourdough bread calculator that works backwards from target baked bread weight. Simpler than the pizza calculator — single-stage fermentation with a sourdough pre-ferment.

## Parameters

| Param | Key | Default | Range | Unit |
|-------|-----|---------|-------|------|
| Baked bread weight | `bakedWeight` | 800 | 200–2000 | g |
| Hydration | `hydration` | 65 | 55–80 | % |
| Salt | `salt` | 2 | 1.5–3 | % |
| Sourdough share | `sourdoughPct` | 20 | 10–40 | % |
| Second flour | `secondFlourPct` | 0 | 0–100 | % |

## Calculation

Working backwards from baked weight:

1. **Dough weight** = baked weight ÷ 0.85 (15% baking loss)
2. **Total flour** = dough weight ÷ (1 + hydration/100 + salt/100)
3. **Sourdough flour** = total flour × sourdoughPct / 100
4. **Sourdough water** = sourdough flour (1:1 ratio)
5. **Mother sourdough** = sourdough flour ÷ 100 tablespoons (1 tbsp per 100g flour)
6. **Second flour** = total flour × secondFlourPct / 100
7. **First flour** = total flour − second flour − sourdough flour
8. **Remaining water** = total flour × hydration/100 − sourdough water
9. **Salt** = total flour × salt / 100

## UI Structure

### Cards (top to bottom)

1. **Bread** — baked weight input, derived dough weight display
2. **Sourdough** — share %, pre-ferment breakdown (flour, water, mother, 12h ferment)
3. **Dough** — hydration, salt, second flour %
4. **Recipe** — two tables (sourdough pre-ferment + main dough), copy button

### Fermentation

Fixed at 12 hours. Display equivalent hours at 18°C using existing `equivalentHours()`.

## Recipe Text Output

```
🍞 Sourdough Bread Recipe
─────────────────────────
Target: 800g baked (941g dough)
Flour total: 533g

── Sourdough (20%) ──
Flour: 107g
Water: 107g
Mother: 1 tbsp
Ferment: 12h

── Main Dough ──
First flour: 319g
Second flour: 107g
Water: 239g
Salt: 11g

Total: 883g
```

## Files

### New files
- `src/lib/sourdough.js` — calculation logic, defaults, recipe text builder
- `src/pages/sourdough/SourdoughCalculator.jsx` — calculator UI
- `src/pages/sourdough/SourdoughRecipes.jsx` — saved recipes (reuses pizza pattern)
- `src/pages/sourdough/recipeSummary.js` — one-line summary for recipe list
- `src/pages/Sourdough.jsx` — page container with tabs, save/load logic

### Modified files
- `src/db/schema.js` — add `SOURDOUGH_PARAM_KEYS`, `normalizeSourdoughParams()`
- `src/db/recipes.js` — add `STORAGE_KEY_SOURDOUGH`, sourdough-specific CRUD
- `src/App.jsx` — add `/sourdough` route
- `src/pages/Hub.jsx` — add sourdough to calculator list

## Defaults

```js
export const DEFAULT_SOURDOUGH_PARAMS = {
  bakedWeight: 800,
  hydration: 65,
  salt: 2,
  sourdoughPct: 20,
  secondFlourPct: 0,
}
```

## Design Decisions

- **15% baking loss** — standard for bread, user confirmed
- **Sourdough is 20% of flour** — user confirmed, matches 100g flour in 500g batch
- **Mother scales with batch** — 1 tbsp per 100g sourdough flour
- **Second flour is % of total flour** — user confirmed
- **No schedule** — simpler than pizza, just show 12h ferment time
- **Reuse existing components** — Card, NumberInput, Button, Dialog, Tabs, Field
