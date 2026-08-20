# Pizza Recipe Library, PWA, and Interface Redesign — Design Spec

## Goal

Turn the recipe calculator app from a stateless set of forms into a tool that remembers.
Three changes, in one pass:

1. A pizza recipe library — save, load, edit, duplicate, delete, annotate.
2. Persistence and offline support — every calculator restores its last session, and the app
   installs to the home screen and works with no signal.
3. A visual redesign in a clean modern utility direction across the hub and all three calculators.

No calculation formula changes. No backend.

## Constraints

- The app is a static Vite build deployed on Vercel. There is no server and none will be added.
- No Supabase, no hosted database, no accounts, no sync.
- All persistence is device-local browser storage. The "database" is a small versioned module
  that lives in this repo under `src/db/`.
- The deployed site cannot write files into the repo, so recipes are never committed as repo data.

## Scope

### Included

- Pizza recipe save / load / rename / duplicate / delete, with a free-text note per recipe
- Auto-restore of the last working session on Kombucha, Slambuc, and Pizza
- Recipe sharing via URL, plus JSON export and import
- Installable, offline-capable PWA with an update prompt
- Visual redesign of the hub and all three calculator pages
- Extraction of pizza math into a pure, testable module
- Vitest coverage for the pizza math and the storage round-trip

### Excluded

- Save/load on Kombucha and Slambuc. The storage layer is written generically so this is a small
  addition later, but it is not built now.
- Accounts, sync, sharing to a server, any network write path
- Bake timers, push notifications, bake logs, ratings, flour presets
- Changes to any calculation formula or to existing input semantics

## Storage layer

A dependency-free versioned store in `src/db/`:

- `store.js` — wrapper over `localStorage` under the `rc.v1.` key namespace. JSON encode/decode.
  Every operation is failure-tolerant: if storage is unavailable (private mode, quota exceeded,
  disabled cookies) it falls back to an in-memory map for the session and surfaces a one-time
  non-blocking warning rather than throwing.
- `schema.js` — the recipe and session shapes, and the `SCHEMA_VERSION` constant.
- `migrations.js` — an ordered version-to-version upgrade chain applied on read. A stored record
  from an older schema version is migrated in memory, and rewritten on its next save. Records
  from a *newer* version than the running build are ignored rather than corrupted.
- `recipes.js` — the public API: `list()`, `get(id)`, `save(recipe)`, `remove(id)`, `duplicate(id)`.
- `session.js` — the public API for per-calculator working state: `load(key)`, `save(key, state)`.

`localStorage` is chosen over IndexedDB deliberately. Recipes are a few hundred bytes each and
will number in the dozens, and synchronous reads keep the React code free of async loading states.
The `store.js` boundary is the only place that names `localStorage`, so swapping to IndexedDB later
touches one file.

Session state is written on a debounce (roughly 400 ms after the last change) to avoid a write per
keystroke.

## Data model

A saved recipe:

```
{
  id,              // stable unique id
  name,            // user-supplied, required, non-empty after trim
  note,            // user-supplied free text, may be empty
  createdAt,       // ISO timestamp
  updatedAt,       // ISO timestamp
  schemaVersion,
  params: {
    balls, ballW,
    bigaPct, bigaTemp, bigaTime,
    finalHyd, finalTemp, finalTime,
    useFreshYeast,
    bigaHydFine, bigaYeastFine, saltFine
  }
}
```

Only inputs are stored, never computed outputs, so a saved recipe stays correct if a formula is
ever corrected. The bake date/time is explicitly *not* part of a recipe — it is per-bake, not
per-recipe — and lives in session state only.

Recipe names are not required to be unique. Identity is the `id`.

## Pizza page structure

The Pizza route gains two tabs directly under the header: **Calculator** and **Recipes**. Tabs
switch view state within the existing `/pizza` route; they do not add routes and do not reset
calculator state.

### Calculator tab

The current control layout, restyled. Above the controls, when a recipe is loaded, a slim context
line shows the recipe name and a modified indicator when the current values differ from the saved
copy. At the bottom of the page sits the primary save action:

- With no recipe loaded: a single **Save recipe** button, which opens a small dialog asking for a
  name and an optional note.
- With a recipe loaded and unmodified: the save action is disabled with a "Saved" state.
- With a recipe loaded and modified: **Save** (overwrite) and **Save as new** (name + note dialog).

### Recipes tab

A list of saved recipes, most recently updated first. Each row shows the name, a one-line parameter
summary (`4 × 260 g · 65% hydration · 30% biga`), and the note preview when present. Row actions:
Load, Edit (rename and note), Duplicate, Share, Delete. Delete requires confirmation. Loading a
recipe switches to the Calculator tab with the values applied.

When no recipes exist, the empty state explains how to save one and links to the Calculator tab.

### File organisation

`src/pages/Pizza.jsx` is currently 438 lines and would exceed 700 with this feature. As part of
this work:

- Pure calculation moves to `src/lib/pizza.js`, exporting the dough math, the equivalent-hours
  fermentation function, the fermentation labels, and the recipe-text builder. No React imports.
- The page splits into `src/pages/pizza/PizzaCalculator.jsx` and `src/pages/pizza/PizzaRecipes.jsx`,
  with a thin `src/pages/Pizza.jsx` owning tab state, loaded-recipe state, and session persistence.
- The local `NumberInput` is promoted to a shared component.

## Sharing

A recipe encodes to a compact JSON payload, base64url-encoded, carried as
`/pizza?r=<payload>`. Opening such a link loads the recipe into the calculator as *unsaved*, with a
prompt to save it to the library. The encoder is versioned with the schema, and decode failures
show a clear error and leave the calculator at its previous state rather than blanking it.

The same encoder backs a **Copy JSON** action. Share and Copy JSON both live on the recipe row in
the Recipes tab. **Import JSON** is an action in the Recipes tab header; it accepts either a pasted
payload or a selected `.json` file, validates it against the schema, and rejects malformed input
with a message. An imported recipe is added to the library as a new record with a new id.

## Progressive web app

`vite-plugin-pwa` is added as the single new dev dependency, configured for:

- A web app manifest with name, theme colour, standalone display, and generated icon set
- A precache service worker covering the whole static build, giving true offline use
- An update prompt shown when a new deployment is available, so a cached build is never sticky

Safe-area insets are respected for standalone display on iOS.

## Visual direction

Clean modern utility: an evolution of the current look rather than a new theme. Light and dark are
both supported and follow the system preference.

- Surfaces are white or near-white in light mode, with a restrained neutral scale
- One clear type scale, generous spacing, and thin borders instead of heavy shadows
- One accent colour per calculator, used for focus and primary actions only
- Result values use tabular figures so numbers do not jitter as they change
- All interactive targets are at least 44 px, with visible keyboard focus rings

Shared primitives are extracted to `src/components/`: `Button`, `Tabs`, `Field`, `Stat`, and the
promoted `NumberInput`. Existing `Card`, `Header`, `Toggle`, and `IngredientInput` consumers keep
working; only their styling changes.

Formulas, routes, and every existing interaction stay exactly as they are.

## Error handling

- Storage unavailable or full: operations degrade to in-memory, and the user sees one clear warning
  that recipes will not persist. The calculator itself never breaks.
- Corrupt or unreadable stored record: it is skipped and reported in the list rather than crashing
  the page.
- Record from a newer schema version: skipped, not migrated, not overwritten.
- Malformed share payload or imported JSON: rejected with a message, no state change.
- Empty or whitespace-only recipe name: save is blocked with inline validation.

## Testing

Vitest is added. Coverage is limited to the two places where a silent bug is expensive:

- `src/lib/pizza.js` — dough weights, biga split, equivalent-hours fermentation, schedule offsets,
  and the recipe text builder, including boundary values
- `src/db/` — save/load/duplicate/delete round-trips, migration from an older schema version,
  rejection of newer-version records, and graceful behaviour when storage throws

No component tests and no end-to-end tests. Manual verification covers the redesign: a production
build plus an inspection of the hub and each route at mobile and desktop widths, in light and dark.

## Success criteria

- A pizza recipe can be saved with a note, then loaded after a full app restart and a device reboot
- A recipe can be renamed, duplicated, and deleted, and the list reflects each change immediately
- Reopening any calculator restores the values last used
- The app installs to the home screen and a saved recipe loads with networking disabled
- A shared link opens the recipe on another device
- Every calculator produces the same numbers as before the redesign
