# Warm Editorial Recipe Calculators — Design Spec

## Goal

Redesign the recipe calculator app as a warm editorial kitchen journal: tactile, calm, and memorable while remaining quick to use on a phone. Redesign the hub and all three calculator routes without changing their calculation formulas, route behavior, or existing calculator interactions.

## Product direction

The app should feel like a well-used kitchen notebook rather than a generic utility dashboard. The memorable idea is an editorial recipe desk: cream paper, espresso ink, tomato and olive accents, restrained borders, and expressive recipe-card typography.

The redesign is intentionally presentation-focused. Existing calculations remain the source of truth:

- Kombucha keeps batch scaling, fixed volume, delayed sugar, and ingredient editing.
- Slambuc keeps people-based and ingredient-based modes, ratios, steppers, slider, and results.
- Pizza keeps the current Biga Bench calculator and its schedule/copy behavior.

## Visual system

### Color

- Canvas: warm paper `#f5f0e8`
- Surface: parchment `#fffdf8`
- Primary ink: espresso `#2f2924`
- Muted ink: `#786e64`
- Rule: `#d8cec1`
- Tomato accent: `#b74738`
- Olive accent: `#69734b`
- Mustard accent: `#c58a32`
- Soft tomato wash: `#f4dfd8`
- Soft olive wash: `#e8ebdc`
- Soft mustard wash: `#f5e9ca`

Use a dominant paper/ink palette. Calculator accents identify the route without turning every page into a different unrelated theme.

### Typography

- Display: a distinctive serif with editorial character, used for mastheads, page titles, recipe names, and key result values.
- Interface: a readable humanist sans-serif for labels, helper copy, controls, and metadata.
- Use uppercase, letter-spaced micro-labels sparingly for section metadata and eyebrow text.

### Shape and depth

- Cards use modest corner radii, thin ink-tinted borders, and low soft shadows.
- Avoid oversized rounded “app bubble” styling.
- Add a subtle paper/grain texture with CSS, keeping it lightweight and nonessential to readability.
- Use small rules, stamps, ingredient dots, and handwritten-style micro-details as decorative accents, not as controls.

## Layout and components

### Shared shell

`PageContainer` owns the paper canvas, safe-area padding, and responsive content width. A shared page frame provides consistent horizontal gutters and vertical rhythm.

`Header` becomes a compact editorial masthead on calculator pages: back button on the left, route label/title in the center or left-aligned at larger widths, and a small ingredient mark/accent on the right. It remains sticky and preserves the existing back-to-hub behavior.

`Card` becomes a parchment surface with a section eyebrow/title pattern and optional accent rule. Existing consumers should continue to work.

`IngredientInput` and `Toggle` keep their current APIs and behavior, but receive the new field, unit-chip, focus, and switch styling.

### Hub

The hub gets an editorial masthead:

- Eyebrow: `THE KITCHEN DESK`
- Title: `Recipes, scaled with care.`
- Supporting copy explaining that the calculators turn familiar recipes into the right batch.

Below it, calculator cards form an asymmetric responsive grid. Each card includes the ingredient mark, name, short description, a small category/status line, and a clear open action. Kombucha, Slambuc, and Pizza each get a distinct accent wash. Pizza is presented as the next notebook entry while remaining linked to the existing calculator.

### Calculator pages

On desktop, use a two-column layout: the input/workbench column is wider and the live summary/result column is visually anchored. On mobile, collapse to one column and keep the most important result near the top after the primary input.

Each calculator page follows the same rhythm:

1. Route header and small contextual eyebrow.
2. Short page intro or current batch summary.
3. Primary controls grouped into parchment sections.
4. Live result cards with strong display values.
5. Secondary actions such as copy/schedule/help.

The underlying page-specific control sets stay intact; only grouping, hierarchy, labels, and visual treatment change.

## Interaction and motion

- Preserve all current routes, formulas, state updates, and input semantics.
- Use 44px or larger touch targets for steppers, toggles, and navigation.
- Add visible keyboard focus using tomato/olive/mustard accent rings.
- Add a short staggered page entrance and subtle card hover/press feedback.
- Avoid animations that delay input response or cause layout shifts.
- Respect `prefers-reduced-motion` by disabling entrance and transform effects.

## Responsive behavior

- Mobile-first single-column layout.
- Tablet and desktop use a centered editorial rail with wider calculator workspaces.
- Preserve safe-area bottom padding for standalone/PWA contexts.
- Keep result values readable and controls usable at narrow widths without horizontal scrolling.

## Accessibility and quality

- Keep semantic headings and labels tied to their inputs.
- Preserve or improve `aria-label`, `role="switch"`, and button semantics.
- Maintain visible focus states and accessible contrast for text and controls.
- Use emoji/ingredient marks as decorative where the adjacent text already names the item.
- Verify production build after the redesign and manually inspect hub plus each route at mobile and desktop widths.

## Scope boundaries

Included: shared styling system, page layout, typography, visual hierarchy, card/control redesign, responsive behavior, and lightweight motion.

Excluded: new calculator formulas, persistence, authentication, server/data changes, new routes, external image assets, and changes to recipe behavior.
