# Pizza Poolish Implementation Plan

Source: `docs/superpowers/specs/2026-09-13-pizza-poolish-design.md` (user-approved).
Date: 2026-09-13. Status: Approved for implementation.

## Goal

Add a Biga / Poolish selector to the Pizza calculator. Poolish mode locks pre-ferment
hydration at 100%, adds a room-rest + cold-proof final schedule, and doses yeast into both
parts. Biga mode, saved recipes, sessions, and share links stay byte-compatible.

## Fixed Points (from the spec, do not re-negotiate)

- Pre-ferment key set is **reused**: `bigaPct`, `bigaTemp`, `bigaTime`, `bigaYeastFine`
  carry the poolish values too. `bigaHydFine` is ignored in poolish (locked 100%).
- New params: `prefermentType: 'biga' | 'poolish'` (default `'biga'`), `roomTime` (1),
  `roomTemp` (23), `poolishMainYeastFine` (fresh %, default 0.5).
- Poolish `target = balls × ballW × 1.02` (user chose the 2% allowance).
- Poolish yeast %: poolish `0.1` (of poolish flour), main `0.5` (of main flour), both
  editable, fresh basis; ÷3 only for instant display.
- Mode toggle applies that mode's defaults, discarding edits.
- Header title -> `Pizza — Dough Bench`. Hub description -> mentions biga & poolish.

## Verified Expected Values (defaults, fresh yeast)

Poolish params (`prefermentType:'poolish'`, balls 4, ballW 270, bigaPct 40, bigaTemp 23,
bigaTime 16, finalHyd 68, finalTemp 6, finalTime 24, roomTemp 23, roomTime 1, salt 2.5,
poolish yeast 0.1, main yeast 0.5):

| Value | Expected |
|---|---|
| target | 1101.6 |
| F | 644.8 |
| Fb / Wb / Yb | 257.9 / 257.9 / 0.3 |
| Ff / Wf / Sf | 386.9 / 180.5 / 16.1 |
| mainYeastG | 1.9 |
| total | 1101.6 |
| poolishEq / roomEq / coldEq | 25.5 / 1.6 / 7.3 |
| finalEq | 8.9 (= roomEq + coldEq) |
| totalEq | 34.4 |

Biga defaults regression (must stay): target 1060.8, F 631.4, Fb 189.4, Wb 79.6, Yb 1.9,
Ff 442, Wf 330.9, Sf 17, bigaEq 12, finalEq 12.1, totalEq 24.1.

`round(x)` = `Math.round(x*10)/10`.

## Tasks

### Task 1 — Poolish model in `src/lib/pizza.js` (with `pizza.test.js`)

Purpose: calculation, defaults helper, resolved params, recipe text.

Steps (write tests first, same file):
1. Add imports/exports and constants: `POOLISH_YEAST_DEFAULT = 0.1`,
   `POOLISH_MAIN_YEAST_DEFAULT = 0.5`, `POOLISH_ROOM_TIME_DEFAULT = 1`,
   `POOLISH_ROOM_TEMP_DEFAULT = 23`.
2. Extend `DEFAULT_PIZZA_PARAMS` with `prefermentType: 'biga'`, `roomTime: 1`,
   `roomTemp: 23`, `poolishMainYeastFine: ''`.
3. Add `prefermentDefaults(type)` returning the full patch per the spec's Defaults table
   (Poolish set + Biga set). The Biga patch mirrors existing defaults.
4. `resolveParams`: add `poolishMainYeast` (fine else
   `POOLISH_MAIN_YEAST_DEFAULT`), and make `bigaYeast` fall back to
   `POOLISH_YEAST_DEFAULT` when `prefermentType==='poolish'` and no fine override.
5. `computeDough`: branch on `params.prefermentType === 'poolish'`.
   - Poolish: `target`, `p = bigaPct/100`,
     `yeastFraction = (poolishYeast/100)*p + (poolishMainYeast/100)*(1-p)`,
     `F = target/(1 + finalHyd/100 + salt/100 + yeastFraction)`,
     `Fb = F*p`, `Wb = Fb` (100%), `Yb = Fb*poolishYeast/100`,
     `Ff = F - Fb`, `Wf = F*finalHyd/100 - Wb`, `Sf = F*salt/100`,
     `mainYeastG = Ff*poolishMainYeast/100`.
   - Equivalents: `bigaEq = eq(bigaTime, bigaTemp)` (poolish stage),
     `roomEq = eq(roomTime, roomTemp)`, `coldEq = eq(finalTime, finalTemp)`,
     `finalEq = roomEq + coldEq`, `totalEq = bigaEq + roomEq + coldEq`.
   - Unified return always includes `salt, bigaHyd, bigaYeast, target, F, Fb, Wb, Yb, Ff,
     Wf, Sf, mainYeastPct, mainYeastG, total, bigaTotal, yeastPct, yeastG, bigaEq,
     finalEq, roomEq, coldEq, totalEq, suggestedYeast, suggestedYeastPct, yeastDose`.
   - Biga path keeps identical arithmetic; adds `mainYeastPct: 0, mainYeastG: 0,
     roomEq: 0, coldEq: 0`. `suggestedYeast` is `null` and `yeastDose 'ok'` in poolish.
   - `yeastPct/yeastG` describe pre-ferment yeast (fresh basis; ÷3 when instant).
   - Guard legacy/blank params: missing `roomTime/roomTemp` fall back to the new
     defaults (so old saved recipes can't produce NaN).
6. `computeSchedule`: in poolish, `finalMixTime = bakeTime − (finalTime + roomTime)`,
   `poolishMixTime = finalMixTime − bigaTime`; biga unchanged.
7. `buildRecipeText`: poolish branch (heading `🍕 Poolish Pizza Recipe`, Poolish table,
   Final Dough table with main yeast, then schedule lines "Mix poolish / Final mix /
   Bake"); biga path unchanged.

Verify: new tests in `pizza.test.js` assert the expected values above (fresh + one
instant `÷3` case), biga regression tests still pass, `prefermentDefaults` returns both
full sets, poolish `suggestedYeast` is null, legacy params without `roomTime`/`roomTemp`
compute without NaN.

### Task 2 — Schema in `src/db/schema.js` (with `recipes.test.js`)

Purpose: persist and normalize the new params.

Steps:
1. `PARAM_KEYS` = `['prefermentType', ...existing... , 'roomTime', 'roomTemp',
   'poolishMainYeastFine']` (order: `prefermentType` first, `roomTime`/`roomTemp` after
   `finalTime`, `poolishMainYeastFine` after `bigaYeastFine`).
2. Add `roomTime`, `roomTemp` to `NUMERIC_KEYS`; add `poolishMainYeastFine` to
   `FINE_KEYS`.
3. In `normalizeParams`, normalize `prefermentType` explicitly:
   `src.prefermentType === 'poolish' ? 'poolish' : 'biga'`.

Verify: new tests in `recipes.test.js` (or schema tests): normalize fills
`prefermentType` to `'biga'` and room defaults when absent; accepts `'poolish'`; bad
string -> `'biga'`; `poolishMainYeastFine` behaves like other fine keys ('' | finite
string). Existing normalization tests pass.

### Task 3 — Calculator UI in `src/pages/pizza/PizzaCalculator.jsx`

Purpose: toggle, conditional cards, tables, schedule, footer text.

Steps:
1. Destructure `prefermentType, roomTime, roomTemp` from params; compute
   `isPoolish = prefermentType === 'poolish'`.
2. Add a Biga / Poolish segmented toggle (same styling as the Fresh/Instant toggle,
   placed above the Batch card). Clicking calls `setParam('prefermentType', v)` **and**
   applies `prefermentDefaults(v)` for every key in the patch.
3. Pre-ferment card (rendered from `d`):
   - Biga: unchanged (share, hydration, temp, time, fermentation equivalent, Suggested
     yeast panel).
   - Poolish: title "Poolish · day 1", inputs share / temperature / time / poolish
     yeast % (from `bigaYeast`), fermentation equivalent box; no hydration input, no
     Suggested-yeast block.
4. Final Dough card:
   - Biga: unchanged.
   - Poolish: hydration input, then Room rest block (share? no — `roomTime` h at
     `roomTemp`°C with its fermentation equivalent + level), then Cold proof block
     (`finalTime` h at `finalTemp`°C + equivalent + level), then Total maturation
     (`d.totalEq`). Reuse existing sunken-box styling and FERMENTATION_COLOR/TEXT.
5. Recipe card (per card):
   - Keep yeast toggle and Copy button for both modes.
   - Poolish tables: Poolish header row (g column), rows Flour `100%`, Water `100%`,
     `{Fresh yeast}` `{poolishYeastPct}%`, Poolish total `Fb+Wb+Yb`; then Final mix
     table with Mature poolish (—), Flour `{100-bigaPct}%`, Water (no % subline, or
     `round(finalHyd - 100*bigaPct/100)`), Salt `{salt}%`, `{Fresh yeast}` `{mainYeastPct}%`,
     then `{balls} × {ballW}g` / round(target).
   - Add `mainYeastPct`/`mainYeastG` to the fresh-yeast ÷3 handling (`d.mainYeastPct`,
     `d.mainYeastG` are fresh basis already).
6. Variables card:
   - Poolish: "Poolish yeast" (edits `bigaYeastFine`), "Main yeast" (edits
     `poolishMainYeastFine`), "Salt". Info popover text adapted (fix-% model, no
     suggested yeast).
   - Biga: unchanged.
7. Schedule card (poolish): 4 rows — "Mix poolish" (`bigaTime` h at `bigaTemp`°C, with
   `d.yeastG`), "Final mix" (room rest row: `roomTime` h at `roomTemp`°C), "Cold proof"
   (`finalTime` h at `finalTemp`°C), "Bake". Reuse the date-grid layout. Biga: unchanged.
8. Footer paragraph: keep as is (poolish also uses the same Arrhenius model).

Verify: `npm run build` passes; manual: toggle renders poolish defaults, hydration lock
(no hydration input in poolish), tables show poolish numbers (257.9/257.9/0.3 …) per the
expected values, schedule counts 25 h final / 41 h poolish for defaults, variables show
poolish + main yeast.

### Task 4 — Summary, page wiring, hub (with new `recipeSummary.test.js`)

Purpose: summary strings, header/hub copy, legacy-load normalization.

Steps:
1. `src/pages/pizza/recipeSummary.js`: mode-aware:
   `... · {bigaPct}% {prefermentType}` and for biga append ` @ {bigaHyd}%`. (Section
   "biga @ 42%" vs "poolish").
2. New `src/pages/pizza/recipeSummary.test.js` (pattern of the sourdough one): biga
   string, poolish string.
3. `src/pages/Pizza.jsx`:
   - Header title -> `Pizza — Dough Bench`.
   - `handleLoad` and the initial `loadedRecipe` from `getRecipe` normalize params, so
     legacy recipes (missing new keys) compare clean against `params` in `isDirty`:
     `setLoadedRecipe({ ...recipe, params: normalizeParams(recipe.params) })`, and
     `setParams(normalizeParams(recipe.params))`.
4. `src/pages/Hub.jsx`: pizza description -> `Biga & poolish dough, schedule, and saved
   recipes`.

Verify: `recipeSummary` tests pass; `npm test` green.

### Task 5 — Full verification

Purpose: prove the feature and no regression.

Steps:
1. `npm test` (Vitest, full suite).
2. `npm run build`.
3. Manual smoke via dev server / browser: legacy biga recipe loads without "unsaved
   changes"; share a poolish URL and reopen; toggle resets to mode defaults.

## Definition of Done

- All of the above green; biga `computeDough` outputs unchanged; legacy recipes, sessions,
  and share links load without fake dirty/NaN.
- `git diff` clean of unrelated files (e.g., no Slambuc changes).