# Pizza Poolish Design

## Overview

Add a Poolish pre-ferment option to the Pizza calculator. The calculator gains a Biga /
Poolish selector; poolish mode locks pre-ferment hydration at 100%, adds a two-part final
fermentation (room rest then cold proof), and doses yeast into both the poolish and the
main dough. Biga mode is unchanged.

## Reference Recipe (user-provided)

Neapolitan, 4 × 270 g balls, 68% water, 2.5% salt, poolish 40% / 16 h, room rest 1 h @
23 °C, cold proof 24 h @ 6 °C:

```
Poolish        Flour 253 g · Water 253 g · Fresh yeast 0.25 g
Main dough     Flour 379 g · Water 177 g · Salt 16 g · Fresh yeast 1.89 g
```

Decoded, this is: poolish flour = 40% of total flour; poolish hydration 100%; poolish
yeast = 0.1% of poolish flour; main yeast = 0.5% of main flour; total flour solves
`target ÷ (1 + hydration + salt + combined yeast fraction)`.

Note: the reference used exact `4 × 270 = 1080 g`. **By user decision, poolish mode uses
the same 2% dough-loss allowance as biga** (`target = balls × ballW × 1.02`), so its output
is ~2% larger than the pasted numbers. This is intentional.

## Parameters

### Reused keys

| Key | Meaning in biga mode | Meaning in poolish mode |
|-----|---------------------|-------------------------|
| `bigaPct` | biga share of total flour | poolish share of total flour |
| `bigaTemp` / `bigaTime` | biga temp / time | poolish temp / time |
| `bigaYeastFine` | biga yeast % (fresh) | poolish yeast % (fresh, of poolish flour) |
| `bigaHydFine` | biga hydration % | unused (locked 100%) |
| `finalHyd` | final hydration % | final hydration % |
| `finalTemp` / `finalTime` | final temp / time | cold-proof temp / time |
| `saltFine`, `useFreshYeast`, `balls`, `ballW` | shared | shared |

### New keys

| Param | Key | Default | Values |
|-------|-----|---------|--------|
| Pre-ferment type | `prefermentType` | `'biga'` | `'biga'` \| `'poolish'` |
| Room rest time | `roomTime` | 1 | h |
| Room rest temp | `roomTemp` | 23 | °C |
| Main-dough yeast | `poolishMainYeastFine` | `'0.5'` | % fresh (of main flour) |

## Calculation

Biga mode keeps the existing `computeDough` path exactly.

Poolish mode:

1. `target = balls × ballW × 1.02`
2. `p = bigaPct / 100`
3. `yeastFraction = (poolishYeastPct/100)·p + (mainYeastPct/100)·(1−p)`
4. `F = target / (1 + finalHyd/100 + salt/100 + yeastFraction)`
5. Poolish: `Fp = F·p`, `Wp = Fp` (100% hydration), `Yp = Fp · poolishYeastPct/100`
6. Main: `Ff = F·(1−p)`, `Wf = F·finalHyd/100 − Wp`, `Ym = Ff · mainYeastPct/100`,
   `Sf = F·salt/100`
7. Fermentation equivalents via the existing Arrhenius `equivalentHours`:
   `poolishEq = eq(bigaTime, bigaTemp)`, `roomEq = eq(roomTime, roomTemp)`,
   `coldEq = eq(finalTime, finalTemp)`, `totalEq = poolishEq + roomEq + coldEq`

`computeDough` returns a superset compatible with existing consumers: `Fb/Wb/Yb` carry the
poolish amounts (`Fp/Wp/Yp`), `Ff/Wf/Sf` the main amounts, plus `mainYeastG`, `mainYeastPct`,
`poolishEq`, `roomEq`, `coldEq`, and the existing `target`, `bigaEq`, `finalEq`, `totalEq`,
`yeastPct`, `yeastG`, `salt`. In poolish mode `finalEq = roomEq + coldEq` and
`yeastPct`/`yeastG` describe the pre-ferment yeast (fresh basis, ÷3 for instant display).

## Defaults

`DEFAULT_PIZZA_PARAMS` remains biga-shaped (adds `prefermentType: 'biga'`, `roomTime: 1`,
`roomTemp: 23`, `poolishMainYeastFine: '0.5'`). A `prefermentDefaults(type)` helper returns
the full param patch applied on toggle:

**Poolish:** `balls: 4, ballW: 270, bigaPct: 40, bigaTemp: 23, bigaTime: 16,
bigaYeastFine: '0.1', bigaHydFine: '', finalHyd: 68, finalTemp: 6, finalTime: 24,
roomTemp: 23, roomTime: 1, poolishMainYeastFine: '0.5', saltFine: '2.5', useFreshYeast: true`

**Biga:** the existing defaults: `balls: 4, ballW: 260, bigaPct: 30, bigaTemp: 18,
bigaTime: 12, bigaYeastFine: '', bigaHydFine: '', finalHyd: 65, finalTemp: 20,
finalTime: 10, roomTemp: 23, roomTime: 1, poolishMainYeastFine: '0.5', saltFine: '',
useFreshYeast: true`

Toggling applies the patch, discarding current edits (user decision).

## UI Structure

### Toggle

A Biga / Poolish segmented control at the top of the calculator (same visual pattern as the
fresh/instant yeast toggle).

### Cards

1. **Batch** — unchanged.
2. **Pre-ferment** — title and fields depend on type.
   - Biga: share, hydration, temperature, time, fermentation equivalent, Suggested yeast.
   - Poolish: share, temperature, time, poolish yeast %, fermentation equivalent. No
     hydration input, no Suggested yeast panel.
3. **Final Dough** — Biga unchanged. Poolish: hydration, room-rest temp/time, cold-proof
   temp/time, room and cold fermentation equivalents, total maturation.
4. **Recipe** — yeast-type toggle, then:
   - Biga: Biga table + Final mix table (unchanged).
   - Poolish: Poolish table (flour, water 100%, yeast) + Final mix table (mature poolish,
     flour, water, salt, main yeast, target).
5. **Variables** — Poolish: poolish yeast, main yeast, salt. Biga: biga yeast, salt.
6. **Schedule** — Poolish: mix poolish (`bigaTime` @ `bigaTemp`) → final mix → room rest
   (`roomTime` @ `roomTemp`) + cold proof (`finalTime` @ `finalTemp`) → bake.
   `finalMixTime = bakeTime − (roomTime + finalTime)`,
   `poolishMixTime = finalMixTime − bigaTime`.

Header title: `Pizza — Biga Bench` → `Pizza — Dough Bench`.

## Recipe Text / Summary

`buildRecipeText` gains a poolish branch:

```
🍕 Poolish Pizza Recipe
───────────────────────
Target: 4 balls × 270g = 1102g dough
Flour total: 645g

── Poolish (40%) ──
Flour: 258g
Water: 258g (100%)
Yeast (Fresh): 0.26g

── Final Dough ──
Mature poolish: 516g
Flour: 387g
Water: 181g
Salt: 16g
Yeast (Fresh): 1.93g

Total: 1102g
```

`recipeSummary` becomes
`{balls} × {ballW} g · {finalHyd}% hydration · {bigaPct}% {prefermentType} [@ {bigaHyd}%]`
(the hydration suffix only for biga).

## Compat & Schema

- `normalizeParams` adds `prefermentType` (string, default `'biga'`, only accepts the two
  values), `roomTime`/`roomTemp` (numeric), `poolishMainYeastFine` (fine string).
- Missing `prefermentType` → `'biga'`, so existing saved recipes, sessions, and share links
  load unchanged. `share.js` uses `normalizeParams`, so new keys flow automatically.
- No `SCHEMA_VERSION` bump (defaults fill new keys).

## Files

### Modified
- `src/lib/pizza.js` — poolish params, `prefermentDefaults`, poolish calculation branch,
  text builder.
- `src/db/schema.js` — new keys + normalization.
- `src/pages/pizza/PizzaCalculator.jsx` — toggle, conditional cards/tables/schedule.
- `src/pages/pizza/recipeSummary.js` — preferment-aware summary.
- `src/pages/Pizza.jsx` — header title.
- `src/pages/Hub.jsx` — pizza description mentions biga & poolish.

### Tests
- `src/lib/pizza.test.js` — poolish math, defaults helper, biga regression, text.
- `src/db/recipes.test.js` — normalization for new keys and legacy default.
- `src/pages/pizza/recipeSummary.test.js` (new) — both modes.

## Design Decisions

- **Pre-ferment toggle, not a separate tab** — user choice; reuses the existing fields.
- **Yeast is fixed editable percentages** (poolish 0.1% / main 0.5%), not the schedule-driven
  biga model; poolish mode hides the Suggested yeast panel.
- **Three stages** (poolish, room rest, cold proof) — user choice.
- **2% dough-loss allowance** in both modes — user choice, accepting a ~2% difference from
  the reference recipe.
- **Mode switch applies that mode's defaults**, discarding edits — user choice.
- **Biga mode behavior, saved recipes, and share links are unchanged.**
