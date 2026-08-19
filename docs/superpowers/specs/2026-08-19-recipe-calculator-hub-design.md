# Recipe Calculator Hub — Design Spec

## Overview

A mobile-first PWA that serves as a hub for recipe calculators. Three calculators: Kombucha (batch scaling), Slambuc (ingredient ratios), and Pizza (placeholder for future dough calculator with save/load).

## Tech Stack

- **Build:** Vite
- **Framework:** React 18+
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **PWA:** vite-plugin-pwa
- **Icons:** lucide-react (for UI icons) + emoji (for ingredient icons)

## Project Structure

```
calculators/
├── public/
│   └── icons/              # PWA icons (192x192, 512x512)
├── src/
│   ├── components/
│   │   ├── Header.jsx      # Top bar with back button + title
│   │   ├── IngredientInput.jsx  # Labeled number input + unit
│   │   ├── Card.jsx        # White container with shadow
│   │   ├── Toggle.jsx      # On/off switch
│   │   └── PageContainer.jsx    # Full-page wrapper
│   ├── pages/
│   │   ├── Hub.jsx         # Card grid landing
│   │   ├── Kombucha.jsx    # Batch scaling calculator
│   │   ├── Slambuc.jsx     # Ingredient ratio calculator
│   │   └── Pizza.jsx       # Placeholder
│   ├── App.jsx             # Router setup
│   ├── main.jsx
│   └── index.css           # Tailwind directives
├── docs/
│   └── references/         # Original calculator references
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Design System

### Color Palette

**Base (shared):**
- Background: `bg-gray-50`
- Cards: `bg-white` + `shadow-sm` + `rounded-2xl` + `border border-gray-100`
- Text primary: `text-gray-900`
- Text secondary: `text-gray-500`
- Borders: `border-gray-200`

**Accents (per calculator):**

| Calculator | Accent Tailwind | Hex | Usage |
|-----------|----------------|-----|-------|
| Kombucha | `amber-500` | #f59e0b | Header bg, buttons, focus rings |
| Slambuc | `orange-700` | #c2410c | Header bg, buttons, focus rings |
| Pizza | `red-500` | #ef4444 | Header bg, placeholder accent |

### Shared Components

#### Header
- Fixed top, full width, accent-colored background
- Back arrow (left), centered title, calculator emoji on right
- Height: `h-14` (56px)
- Back navigates to hub (`/`)
- Uses lucide-react `ArrowLeft` for back button

#### IngredientInput
- Icon + label on top row
- Number input + unit badge side by side on bottom row
- Focus ring uses calculator's accent color
- Props: `label`, `value`, `onChange`, `unit`, `icon`, `accent`

#### Card
- White background, `rounded-2xl`, `shadow-sm`, `border border-gray-100`
- Optional `title` and `icon` props
- Padding: `p-4 sm:p-6`

#### Toggle
- On/off switch with label
- Checked state uses calculator's accent color
- Props: `label`, `checked`, `onChange`, `accent`

#### PageContainer
- Full-screen wrapper with `min-h-screen bg-gray-50`
- Handles safe-area insets for PWA notch devices: `pb-[env(safe-area-inset-bottom)]`
- Centers content with `max-w-lg mx-auto px-4 py-6`

## Pages

### Hub (`/`)
- Title: "Recipe Calculators" with 🧮 icon
- Card grid: `grid grid-cols-2 sm:grid-cols-3 gap-4`
- Each card: emoji + name + short description + arrow
- Pizza card: `opacity-60` + "Coming soon" badge, no link

### Kombucha (`/kombucha`)
- Two-column layout on `lg:`, single column on mobile
- Left: Base Recipe (editable, sets proportions)
- Right: Your Batch (scaled version with controls)
- Features: Fixed Volume toggle, Delayed Sugar toggle, Target Volume input
- All behaviors from reference preserved

### Slambuc (`/slambuc`)
- Single column, mobile-first
- Mode toggle: People-based vs Ingredient-based
- People mode: +/- buttons, number input, slider (1-50)
- Ingredient mode: emoji selector grid (3 columns), number input
- Results: ingredient cards with emoji + name + calculated amount
- Summary: total weight + estimated people

### Pizza (`/pizza`)
- Placeholder page with red accent header
- Centered content: large icon, "Coming soon", feature list
- No calculator logic

## PWA Configuration

- **Display:** standalone
- **Theme color:** `#f59e0b` (amber, matching Kombucha as primary)
- **Icons:** SVG-based, 192x192 and 512x512
- **Service worker:** cache-first for static assets
- **Offline:** all calculators work offline (pure client-side)

## Mobile-First Approach

- All layouts start single-column on mobile
- Touch targets: minimum 44px
- Safe area insets for notch devices
- Responsive breakpoints: `sm:` (640px), `lg:` (1024px)
- Font sizes scale up on larger screens

## Future Considerations

- Pizza calculator: dough calculator with baker's percentages, save/load custom recipes (localStorage)
- Additional calculators can be added by creating new page + adding card to hub
- Shared components make new calculators fast to build
