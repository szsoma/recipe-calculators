# Sourdough Bread Count Design

## Overview

Add a "Number of breads" input to the Sourdough calculator so the recipe scales to any
batch size. Mirrors the existing pizza pattern (`balls × ballW`): the per-loaf weight stays
fixed and a count multiplies the whole batch.

## Parameters

| Param | Key | Default | Range | Unit |
|-------|-----|---------|-------|------|
| Number of breads | `breads` | 1 | 1–12 | — |
| Baked bread weight | `bakedWeight` | 800 | 200–2000 | g (per loaf) |

All other sourdough params are unchanged.

## Calculation

`bakedWeight` now means the weight of one loaf. The target baked weight for the batch is
`bakedWeight × breads`, so:

1. **Dough weight** = (baked weight × breads) ÷ 0.85 (15% baking loss)
2. **Total flour** = dough weight ÷ (1 + hydration/100 + salt/100)
3–9. Sourdough flour, sourdough water, mother, second flour, first flour, remaining water,
   and salt are unchanged — each derives from total flour / dough weight and therefore
   scales with the batch.

All returned values represent the full batch (what you actually mix). Add a `totalBaked`
value (`bakedWeight × breads`) for display.

## UI Structure

### Bread card

- **Baked bread weight** — per loaf (200–2000g, step 50)
- **Number of breads** — (1–12, step 1)
- Derived box shows **Target dough weight** for the whole batch, with the per-loaf dough
  weight as a sub-line.

The Sourdough, Dough, and Recipe cards are unchanged; their numbers are batch totals.

## Recipe Text Output

```
🍞 Sourdough Bread Recipe
─────────────────────────
Target: 2 × 800g baked = 1600g (1882g dough)
Flour total: 1127g
...
```

## Recipe Summary

```
2 × 800g baked · 65% hydration · 20% sourdough
```

## Files

### Modified files
- `src/lib/sourdough.js` — add `breads` default, scale `doughWeight`, add `totalBaked`,
  update `buildRecipeText`
- `src/db/schema.js` — add `breads` to `SOURDOUGH_PARAM_KEYS` / `SOURDOUGH_NUMERIC_KEYS`
- `src/pages/sourdough/SourdoughCalculator.jsx` — count input, batch/per-loaf dough display
- `src/pages/sourdough/recipeSummary.js` — prefix `{breads} ×`
- `src/pages/Sourdough.jsx` — normalize params on recipe load so old recipes get `breads: 1`

### New files
- `src/lib/sourdough.test.js` — scaling and recipe-text tests

## Design Decisions

- **Per-loaf weight × count** — user confirmed; stacks cleanly on the existing
  `computeSourdough` formula and matches the pizza calculator convention.
- **Default `breads: 1`, range 1–12** — user confirmed.
- **Recipe tables show full-batch totals** — user confirmed; that is what gets mixed.
- **No `SCHEMA_VERSION` bump** — missing `breads` is filled in by
  `normalizeSourdoughParams` on load and on save, so older saved recipes default to 1.
