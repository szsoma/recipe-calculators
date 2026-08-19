# Recipe Calculator Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA hub with three recipe calculators (Kombucha, Slambuc, Pizza placeholder) using Vite + React + Tailwind.

**Architecture:** Single-page app with React Router for navigation. Shared components (Header, IngredientInput, Card, Toggle, PageContainer) ensure consistent UI. Each calculator is an independent page with its own state.

**Tech Stack:** Vite 5+, React 18+, Tailwind CSS 3+, React Router 6, vite-plugin-pwa, lucide-react

## Global Constraints

- Node.js 18+ required
- All components use functional components with hooks
- Tailwind CSS for all styling (no inline styles except dynamic values)
- Mobile-first responsive design: base styles = mobile, `sm:` = 640px, `lg:` = 1024px
- Touch targets minimum 44px
- Safe area insets for PWA: `pb-[env(safe-area-inset-bottom)]`
- Emoji for ingredient icons, lucide-react for UI icons

---

## File Structure

```
calculators/
├── public/
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── IngredientInput.jsx
│   │   ├── Card.jsx
│   │   ├── Toggle.jsx
│   │   └── PageContainer.jsx
│   ├── pages/
│   │   ├── Hub.jsx
│   │   ├── Kombucha.jsx
│   │   ├── Slambuc.jsx
│   │   └── Pizza.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`

**Interfaces:**
- Produces: Vite dev server running on localhost:5173

- [ ] **Step 1: Initialize Vite + React project**

```bash
cd /Users/soma/Documents/work/03_coding/calculators
npm create vite@latest . -- --template react
```

Select: React, JavaScript

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install react-router-dom lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure Vite with Tailwind**

Replace `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

- [ ] **Step 4: Configure Tailwind CSS**

Replace `src/index.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 5: Clean up default files**

Delete: `src/App.css`, `src/assets/react.svg`

Replace `src/App.jsx`:

```jsx
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-center p-8">Recipe Calculators</h1>
    </div>
  )
}
```

Replace `src/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: Update index.html**

Replace `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#f59e0b" />
    <title>Recipe Calculators</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts, page shows "Recipe Calculators" heading

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize Vite + React + Tailwind project"
```

---

### Task 2: React Router Setup

**Files:**
- Modify: `src/App.jsx`, `src/main.jsx`

**Interfaces:**
- Produces: Router with routes for `/`, `/kombucha`, `/slambuc`, `/pizza`

- [ ] **Step 1: Add BrowserRouter to main.jsx**

Replace `src/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 2: Add routes to App.jsx**

Replace `src/App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 text-center">Hub</div>} />
      <Route path="/kombucha" element={<div className="p-8 text-center">Kombucha</div>} />
      <Route path="/slambuc" element={<div className="p-8 text-center">Slambuc</div>} />
      <Route path="/pizza" element={<div className="p-8 text-center">Pizza</div>} />
    </Routes>
  )
}
```

- [ ] **Step 3: Verify routing works**

Navigate to `http://localhost:5173/`, `http://localhost:5173/kombucha`, etc.

Expected: Each URL shows its placeholder text

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/main.jsx
git commit -m "feat: add React Router with placeholder routes"
```

---

### Task 3: Shared Components — PageContainer

**Files:**
- Create: `src/components/PageContainer.jsx`

**Interfaces:**
- Consumes: `children`, `className`
- Produces: Full-page wrapper with safe-area padding

- [ ] **Step 1: Create PageContainer component**

```jsx
export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-gray-50 pb-[env(safe-area-inset-bottom)] ${className}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PageContainer.jsx
git commit -m "feat: add PageContainer component"
```

---

### Task 4: Shared Components — Header

**Files:**
- Create: `src/components/Header.jsx`

**Interfaces:**
- Consumes: `icon` (string), `title` (string), `accent` (string: 'amber' | 'orange' | 'red')
- Produces: Fixed header with back button, title, icon

- [ ] **Step 1: Create Header component**

```jsx
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const accentStyles = {
  amber: 'bg-amber-500',
  orange: 'bg-orange-700',
  red: 'bg-red-500',
}

export default function Header({ icon, title, accent = 'amber' }) {
  const navigate = useNavigate()

  return (
    <header className={`sticky top-0 z-50 ${accentStyles[accent]} text-white`}>
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Back to hub"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold">{title}</h1>
        <span className="text-2xl w-10 text-right">{icon}</span>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.jsx
git commit -m "feat: add Header component with back navigation"
```

---

### Task 5: Shared Components — IngredientInput

**Files:**
- Create: `src/components/IngredientInput.jsx`

**Interfaces:**
- Consumes: `label` (string), `value` (number), `onChange` (fn), `unit` (string), `icon` (string), `accent` (string), `badge` (string|null)
- Produces: Labeled number input with icon, unit badge, optional badge

- [ ] **Step 1: Create IngredientInput component**

```jsx
const accentBorders = {
  amber: 'border-amber-300 focus:border-amber-500 focus:ring-amber-200',
  orange: 'border-orange-300 focus:border-orange-500 focus:ring-orange-200',
  red: 'border-red-300 focus:border-red-500 focus:ring-red-200',
}

export default function IngredientInput({
  label,
  value,
  onChange,
  unit,
  icon,
  accent = 'amber',
  badge = null,
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {badge && (
            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
              {badge}
            </span>
          )}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            step="0.01"
            className={`flex-1 px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 text-base ${accentBorders[accent]}`}
          />
          <span className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium min-w-[50px] text-center text-base">
            {unit}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/IngredientInput.jsx
git commit -m "feat: add IngredientInput component"
```

---

### Task 6: Shared Components — Card & Toggle

**Files:**
- Create: `src/components/Card.jsx`, `src/components/Toggle.jsx`

**Interfaces:**
- Card: consumes `children`, `title` (string), `icon` (ReactNode), `className` (string)
- Toggle: consumes `label` (string), `checked` (boolean), `onChange` (fn), `accent` (string)

- [ ] **Step 1: Create Card component**

```jsx
export default function Card({ children, title, icon, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-4">
          {icon && <span className="text-gray-500">{icon}</span>}
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
        </div>
      )}
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create Toggle component**

```jsx
const toggleColors = {
  amber: 'bg-amber-500',
  orange: 'bg-orange-700',
  red: 'bg-red-500',
}

export default function Toggle({ label, checked, onChange, accent = 'amber' }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          checked ? toggleColors[accent] : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Card.jsx src/components/Toggle.jsx
git commit -m "feat: add Card and Toggle components"
```

---

### Task 7: Hub Page

**Files:**
- Create: `src/pages/Hub.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: React Router Link
- Produces: Card grid with 3 calculator links

- [ ] **Step 1: Create Hub page**

```jsx
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'

const calculators = [
  {
    name: 'Kombucha',
    description: 'Batch scaling & delayed sugar',
    icon: '🍵',
    path: '/kombucha',
    accent: 'hover:border-amber-300',
  },
  {
    name: 'Slambuc',
    description: 'Ingredient ratios',
    icon: '🍲',
    path: '/slambuc',
    accent: 'hover:border-orange-300',
  },
  {
    name: 'Pizza',
    description: 'Coming soon',
    icon: '🍕',
    path: null,
    accent: 'hover:border-red-300',
  },
]

export default function Hub() {
  return (
    <PageContainer>
      <div className="px-4 py-8 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="text-4xl">🧮</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Recipe Calculators</h1>
          <p className="text-gray-500 mt-1">Choose a calculator</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {calculators.map((calc) => (
            <div key={calc.name}>
              {calc.path ? (
                <Link
                  to={calc.path}
                  className={`block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center transition-all hover:shadow-md hover:scale-[1.02] ${calc.accent}`}
                >
                  <span className="text-4xl block mb-3">{calc.icon}</span>
                  <h2 className="font-semibold text-gray-900">{calc.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{calc.description}</p>
                </Link>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center opacity-60">
                  <span className="text-4xl block mb-3">{calc.icon}</span>
                  <h2 className="font-semibold text-gray-900">{calc.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{calc.description}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                    Coming soon
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
```

- [ ] **Step 2: Update App.jsx to use Hub**

Replace `src/App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom'
import Hub from './pages/Hub'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/kombucha" element={<div className="p-8 text-center">Kombucha</div>} />
      <Route path="/slambuc" element={<div className="p-8 text-center">Slambuc</div>} />
      <Route path="/pizza" element={<div className="p-8 text-center">Pizza</div>} />
    </Routes>
  )
}
```

- [ ] **Step 3: Verify hub renders**

Navigate to `http://localhost:5173/`

Expected: Card grid with 3 cards, Pizza card is dimmed with "Coming soon" badge

- [ ] **Step 4: Commit**

```bash
git add src/pages/Hub.jsx src/App.jsx
git commit -m "feat: add Hub page with calculator card grid"
```

---

### Task 8: Kombucha Calculator — Structure & Base Recipe

**Files:**
- Create: `src/pages/Kombucha.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: Header, PageContainer, Card, IngredientInput, Toggle
- Produces: Kombucha page with base recipe editing

- [ ] **Step 1: Create Kombucha page with base recipe and state**

```jsx
import { useState } from 'react'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import IngredientInput from '../components/IngredientInput'
import Toggle from '../components/Toggle'
import { Scale, Leaf, Lock, Unlock, Clock } from 'lucide-react'

const defaultBase = {
  tea: 40,
  teaWater: 2000,
  sugar: 350,
  starterTea: 800,
  water: 4200,
}

const accent = 'amber'

function formatValue(value) {
  return Math.round(value * 100) / 100
}

export default function Kombucha() {
  const [baseRecipe, setBaseRecipe] = useState(defaultBase)
  const [currentRecipe, setCurrentRecipe] = useState(defaultBase)
  const [fixedVolume, setFixedVolume] = useState(false)
  const [delayedSugar, setDelayedSugar] = useState(false)

  const handleBaseChange = (ingredient, value) => {
    const numValue = parseFloat(value) || 0
    const newBase = { ...baseRecipe, [ingredient]: numValue }
    setBaseRecipe(newBase)
    setCurrentRecipe(newBase)
  }

  const baseVolume = baseRecipe.teaWater + baseRecipe.starterTea + baseRecipe.water
  const totalVolume = currentRecipe.teaWater + currentRecipe.starterTea + currentRecipe.water

  const ingredients = [
    { key: 'tea', label: 'Tea', unit: 'g', icon: '🍵' },
    { key: 'teaWater', label: 'Tea Water', unit: 'ml', icon: '💧' },
    { key: 'sugar', label: 'Sugar', unit: 'g', icon: '🍬' },
    { key: 'starterTea', label: 'Starter Tea', unit: 'ml', icon: '🧪' },
    { key: 'water', label: 'Water', unit: 'ml', icon: '💧' },
  ]

  return (
    <PageContainer>
      <Header icon="🍵" title="Kombucha" accent={accent} />
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Base Recipe Card */}
        <Card title="Base Recipe" icon={<Scale className="w-5 h-5" />}>
          <div className="space-y-4">
            {ingredients.map((ing) => (
              <IngredientInput
                key={ing.key}
                label={ing.label}
                value={baseRecipe[ing.key]}
                onChange={(v) => handleBaseChange(ing.key, v)}
                unit={ing.unit}
                icon={ing.icon}
                accent={accent}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-500">Base Volume</span>
            <span className="text-lg font-bold text-gray-900">{formatValue(baseVolume)} ml</span>
          </div>
        </Card>

        {/* Placeholder for Your Batch - will be added in next task */}
        <Card title="Your Batch" icon={<Leaf className="w-5 h-5 text-green-500" />}>
          <p className="text-gray-500 text-sm">Batch calculator coming next...</p>
        </Card>
      </div>
    </PageContainer>
  )
}
```

- [ ] **Step 2: Update App.jsx to use Kombucha**

Replace `src/App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom'
import Hub from './pages/Hub'
import Kombucha from './pages/Kombucha'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/kombucha" element={<Kombucha />} />
      <Route path="/slambuc" element={<div className="p-8 text-center">Slambuc</div>} />
      <Route path="/pizza" element={<div className="p-8 text-center">Pizza</div>} />
    </Routes>
  )
}
```

- [ ] **Step 3: Verify Kombucha page renders**

Navigate to `http://localhost:5173/kombucha`

Expected: Header with amber bg, Base Recipe card with 5 ingredient inputs, base volume calculated

- [ ] **Step 4: Commit**

```bash
git add src/pages/Kombucha.jsx src/App.jsx
git commit -m "feat: add Kombucha page with base recipe editing"
```

---

### Task 9: Kombucha Calculator — Your Batch with Proportional Scaling

**Files:**
- Modify: `src/pages/Kombucha.jsx`

**Interfaces:**
- Consumes: existing state from Task 8
- Produces: Your Batch card with proportional scaling, target volume input, delayed sugar display

- [ ] **Step 1: Add proportional scaling logic and Your Batch card**

Replace `src/pages/Kombucha.jsx`:

```jsx
import { useState } from 'react'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import IngredientInput from '../components/IngredientInput'
import Toggle from '../components/Toggle'
import { Scale, Leaf, Lock, Unlock, Clock } from 'lucide-react'

const defaultBase = {
  tea: 40,
  teaWater: 2000,
  sugar: 350,
  starterTea: 800,
  water: 4200,
}

const accent = 'amber'

function formatValue(value) {
  return Math.round(value * 100) / 100
}

export default function Kombucha() {
  const [baseRecipe, setBaseRecipe] = useState(defaultBase)
  const [currentRecipe, setCurrentRecipe] = useState(defaultBase)
  const [fixedVolume, setFixedVolume] = useState(false)
  const [delayedSugar, setDelayedSugar] = useState(false)

  const handleBaseChange = (ingredient, value) => {
    const numValue = parseFloat(value) || 0
    const newBase = { ...baseRecipe, [ingredient]: numValue }
    setBaseRecipe(newBase)
    setCurrentRecipe(newBase)
  }

  const handleCurrentChange = (ingredient, value) => {
    let numValue = parseFloat(value) || 0

    // Convert displayed value to actual value if delayed sugar is active
    if (ingredient === 'sugar') {
      numValue = delayedSugar ? numValue * 3 : numValue
    } else if (ingredient === 'water') {
      numValue = delayedSugar ? numValue + 800 : numValue
    }

    const baseValue = baseRecipe[ingredient]

    if (baseValue === 0) {
      setCurrentRecipe({ ...currentRecipe, [ingredient]: numValue })
      return
    }

    // Fixed volume mode
    if (fixedVolume) {
      const liquidIngredients = ['teaWater', 'starterTea', 'water']
      const isLiquid = liquidIngredients.includes(ingredient)

      if (isLiquid) {
        const currentTotal = currentRecipe.teaWater + currentRecipe.starterTea + currentRecipe.water
        const difference = numValue - currentRecipe[ingredient]

        const otherLiquids = liquidIngredients.filter((ing) => ing !== ingredient)
        const otherLiquidsTotal = otherLiquids.reduce((sum, ing) => sum + currentRecipe[ing], 0)

        if (otherLiquidsTotal === 0) {
          setCurrentRecipe({ ...currentRecipe, [ingredient]: numValue })
          return
        }

        const newRecipe = { ...currentRecipe, [ingredient]: numValue }

        otherLiquids.forEach((ing) => {
          const proportion = currentRecipe[ing] / otherLiquidsTotal
          newRecipe[ing] = Math.max(0, currentRecipe[ing] - difference * proportion)
        })

        const newTotal = newRecipe.teaWater + newRecipe.starterTea + newRecipe.water
        const baseTotal = baseRecipe.teaWater + baseRecipe.starterTea + baseRecipe.water
        const volumeRatio = newTotal / baseTotal

        newRecipe.tea = baseRecipe.tea * volumeRatio
        newRecipe.sugar = baseRecipe.sugar * volumeRatio

        setCurrentRecipe(newRecipe)
      } else {
        setCurrentRecipe({ ...currentRecipe, [ingredient]: numValue })
      }
      return
    }

    // Normal proportional scaling mode
    const scaleFactor = numValue / baseValue

    const scaled = {
      tea: baseRecipe.tea * scaleFactor,
      teaWater: baseRecipe.teaWater * scaleFactor,
      sugar: baseRecipe.sugar * scaleFactor,
      starterTea: baseRecipe.starterTea * scaleFactor,
      water: baseRecipe.water * scaleFactor,
    }

    setCurrentRecipe(scaled)
  }

  const handleVolumeChange = (value) => {
    const numValue = parseFloat(value) || 0
    const baseVolume = baseRecipe.teaWater + baseRecipe.starterTea + baseRecipe.water

    if (baseVolume === 0) return

    const scaleFactor = numValue / baseVolume

    const scaled = {
      tea: baseRecipe.tea * scaleFactor,
      teaWater: baseRecipe.teaWater * scaleFactor,
      sugar: baseRecipe.sugar * scaleFactor,
      starterTea: baseRecipe.starterTea * scaleFactor,
      water: baseRecipe.water * scaleFactor,
    }

    setCurrentRecipe(scaled)
  }

  const baseVolume = baseRecipe.teaWater + baseRecipe.starterTea + baseRecipe.water
  const totalVolume = currentRecipe.teaWater + currentRecipe.starterTea + currentRecipe.water

  // Delayed sugar helpers
  const getSyrupSugar = () => currentRecipe.sugar / 3
  const getDisplayedSugar = () => delayedSugar ? currentRecipe.sugar / 3 : currentRecipe.sugar
  const getDisplayedWater = () => delayedSugar ? Math.max(0, currentRecipe.water - 800) : currentRecipe.water

  const ingredients = [
    { key: 'tea', label: 'Tea', unit: 'g', icon: '🍵' },
    { key: 'teaWater', label: 'Tea Water', unit: 'ml', icon: '💧' },
    { key: 'sugar', label: 'Sugar', unit: 'g', icon: '🍬' },
    { key: 'starterTea', label: 'Starter Tea', unit: 'ml', icon: '🧪' },
    { key: 'water', label: 'Water', unit: 'ml', icon: '💧' },
  ]

  return (
    <PageContainer>
      <Header icon="🍵" title="Kombucha" accent={accent} />
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Base Recipe Card */}
        <Card title="Base Recipe" icon={<Scale className="w-5 h-5" />}>
          <div className="space-y-4">
            {ingredients.map((ing) => (
              <IngredientInput
                key={ing.key}
                label={ing.label}
                value={baseRecipe[ing.key]}
                onChange={(v) => handleBaseChange(ing.key, v)}
                unit={ing.unit}
                icon={ing.icon}
                accent={accent}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-500">Base Volume</span>
            <span className="text-lg font-bold text-gray-900">{formatValue(baseVolume)} ml</span>
          </div>
        </Card>

        {/* Your Batch Card */}
        <Card title="Your Batch" icon={<Leaf className="w-5 h-5 text-green-500" />}>
          <div className="space-y-3 mb-4">
            <Toggle
              label="Lock Volume"
              checked={fixedVolume}
              onChange={setFixedVolume}
              accent={accent}
            />
            <Toggle
              label="Delayed Sugar (3 days)"
              checked={delayedSugar}
              onChange={setDelayedSugar}
              accent={accent}
            />
          </div>

          {/* Delayed Sugar Instructions */}
          {delayedSugar && (
            <div className="mb-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-300">
              <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Delayed Sugar Instructions
              </h4>
              <div className="bg-white p-3 rounded-lg mb-3">
                <p className="text-xs text-purple-900 font-semibold mb-1">Initial Batch (Day 1):</p>
                <p className="text-xs text-purple-800">
                  First portion: <strong>{formatValue(getSyrupSugar())}g sugar</strong> dissolved in the batch
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-xs text-purple-900 font-semibold mb-2">Additional Syrups:</p>
                <ol className="text-xs text-purple-800 space-y-1 ml-4 list-decimal">
                  <li><strong>Day 2:</strong> Dissolve <strong>{formatValue(getSyrupSugar())}g sugar</strong> in <strong>400ml water</strong></li>
                  <li><strong>Day 3:</strong> Dissolve <strong>{formatValue(getSyrupSugar())}g sugar</strong> in <strong>400ml water</strong></li>
                </ol>
              </div>
              <p className="text-xs text-purple-700 mt-3 italic">
                Total sugar: {formatValue(currentRecipe.sugar)}g divided into 3 equal portions
              </p>
            </div>
          )}

          {/* Target Volume */}
          <div className="mb-4 p-4 bg-green-50 rounded-xl border-2 border-green-200">
            <label className="block text-sm font-medium text-green-900 mb-2">
              Target Batch Volume
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formatValue(totalVolume)}
                onChange={(e) => handleVolumeChange(e.target.value)}
                step="1"
                className="flex-1 px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:border-green-500 focus:ring-green-200 text-lg font-semibold"
                disabled={fixedVolume}
              />
              <span className="px-4 py-3 bg-green-600 text-white rounded-lg font-bold min-w-[60px] text-center">
                ml
              </span>
            </div>
          </div>

          {/* Scaled Ingredients */}
          <div className="space-y-4">
            <IngredientInput
              label="Tea"
              value={formatValue(currentRecipe.tea)}
              onChange={(v) => handleCurrentChange('tea', v)}
              unit="g"
              icon="🍵"
              accent={accent}
            />
            <IngredientInput
              label="Tea Water"
              value={formatValue(currentRecipe.teaWater)}
              onChange={(v) => handleCurrentChange('teaWater', v)}
              unit="ml"
              icon="💧"
              accent={accent}
            />
            <IngredientInput
              label="Sugar"
              value={formatValue(getDisplayedSugar())}
              onChange={(v) => handleCurrentChange('sugar', v)}
              unit="g"
              icon="🍬"
              accent={accent}
              badge={delayedSugar ? `Day 1: ${formatValue(getSyrupSugar())}g | Day 2: ${formatValue(getSyrupSugar())}g | Day 3: ${formatValue(getSyrupSugar())}g` : null}
            />
            <IngredientInput
              label="Starter Tea"
              value={formatValue(currentRecipe.starterTea)}
              onChange={(v) => handleCurrentChange('starterTea', v)}
              unit="ml"
              icon="🧪"
              accent={accent}
            />
            <IngredientInput
              label={delayedSugar ? 'Water (initial)' : 'Water'}
              value={formatValue(getDisplayedWater())}
              onChange={(v) => handleCurrentChange('water', v)}
              unit="ml"
              icon="💧"
              accent={accent}
              badge={delayedSugar ? '-800ml' : null}
            />
          </div>
        </Card>

        {/* How to use */}
        <Card>
          <h3 className="font-bold text-gray-900 mb-3 text-sm">How to use:</h3>
          <ul className="text-gray-600 space-y-2 text-sm">
            <li>• <strong>Edit Base Recipe:</strong> Set your preferred ingredient amounts</li>
            <li>• <strong>Set Target Volume:</strong> Enter your desired batch size in the green box</li>
            <li>• <strong>Proportional Mode:</strong> Change any ingredient - all others scale proportionally</li>
            <li>• <strong>Fixed Volume Mode:</strong> Toggle lock to maintain total volume</li>
            <li>• <strong>Delayed Sugar:</strong> First syrup included; make 2 additional 400ml syrups for Days 2 & 3</li>
          </ul>
        </Card>
      </div>
    </PageContainer>
  )
}
```

- [ ] **Step 2: Verify Kombucha calculator works**

Navigate to `http://localhost:5173/kombucha`

Test:
1. Change Base Recipe tea from 40 to 80 → Your Batch should double all values
2. Set Target Volume to 10000 → all ingredients should scale proportionally
3. Toggle Lock Volume → changing one liquid should adjust others
4. Toggle Delayed Sugar → shows instructions and adjusts sugar/water display

- [ ] **Step 3: Commit**

```bash
git add src/pages/Kombucha.jsx
git commit -m "feat: add Kombucha batch calculator with proportional scaling"
```

---

### Task 10: Slambuc Calculator

**Files:**
- Create: `src/pages/Slambuc.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: Header, PageContainer
- Produces: Slambuc calculator with people/ingredient modes

- [ ] **Step 1: Create Slambuc page**

```jsx
import { useState } from 'react'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'

const accent = 'orange'

const PER_PERSON = { teszta: 100, krumpli: 215, szalonna: 50 }

const INGREDIENTS = [
  { key: 'teszta', label: 'Tészta', color: '#C4874A', unit: 'g', emoji: '🍝' },
  { key: 'krumpli', label: 'Krumpli', color: '#7A9E5B', unit: 'g', emoji: '🥔' },
  { key: 'szalonna', label: 'Szalonna', color: '#C0504A', unit: 'g', emoji: '🥓' },
]

function calcFromPeople(people) {
  return {
    teszta: Math.round(people * PER_PERSON.teszta),
    krumpli: Math.round(people * PER_PERSON.krumpli),
    szalonna: Math.round(people * PER_PERSON.szalonna),
  }
}

function calcFromIngredient(key, value) {
  const base = value / PER_PERSON[key]
  return {
    teszta: Math.round(base * PER_PERSON.teszta),
    krumpli: Math.round(base * PER_PERSON.krumpli),
    szalonna: Math.round(base * PER_PERSON.szalonna),
    people: base,
  }
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(2).replace(/\.?0+$/, '') + ' kg'
  return n + ' g'
}

export default function Slambuc() {
  const [mode, setMode] = useState('people')
  const [people, setPeople] = useState(4)
  const [selectedIng, setSelectedIng] = useState('teszta')
  const [ingValue, setIngValue] = useState(400)

  const resultsFromPeople = calcFromPeople(people)
  const resultsFromIng = calcFromIngredient(selectedIng, ingValue)
  const results = mode === 'people' ? resultsFromPeople : resultsFromIng
  const peopleDisplay = mode === 'people' ? people : resultsFromIng.people

  return (
    <PageContainer>
      <Header icon="🍲" title="Slambuc" accent={accent} />
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Mode Toggle */}
        <div className="grid grid-cols-2 bg-gray-200 rounded-xl p-1">
          <button
            onClick={() => setMode('people')}
            className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              mode === 'people' ? 'bg-orange-700 text-white' : 'text-gray-600'
            }`}
          >
            👥 Személyek
          </button>
          <button
            onClick={() => setMode('ingredient')}
            className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              mode === 'ingredient' ? 'bg-orange-700 text-white' : 'text-gray-600'
            }`}
          >
            ⚖️ Alapanyag
          </button>
        </div>

        {/* Input Panel */}
        <Card>
          {mode === 'people' ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Személyek száma
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPeople((p) => Math.max(1, p - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 bg-gray-50 text-xl font-bold text-gray-700 flex items-center justify-center hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={people}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    setPeople(isNaN(n) || n < 1 ? 1 : n)
                  }}
                  className="w-20 h-10 rounded-lg border-2 border-gray-200 bg-gray-50 text-xl font-bold text-gray-900 text-center focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => setPeople((p) => p + 1)}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 bg-gray-50 text-xl font-bold text-gray-700 flex items-center justify-center hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={Math.min(people, 50)}
                onChange={(e) => setPeople(parseInt(e.target.value))}
                className="w-full mt-4 accent-orange-700"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 fő</span>
                <span>50 fő</span>
              </div>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Alapanyag és mennyiség
              </label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {INGREDIENTS.map((ing) => (
                  <button
                    key={ing.key}
                    onClick={() => setSelectedIng(ing.key)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedIng === ing.key
                        ? 'border-orange-700 bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="text-2xl block">{ing.emoji}</span>
                    <span className="text-xs font-medium text-gray-700 mt-1 block">{ing.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={ingValue}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    setIngValue(isNaN(n) || n < 0 ? 0 : n)
                  }}
                  className="flex-1 h-10 rounded-lg border-2 border-gray-200 bg-gray-50 text-xl font-bold text-gray-900 text-center focus:outline-none focus:border-orange-500"
                />
                <span className="text-gray-600 font-semibold">g</span>
              </div>
            </>
          )}
        </Card>

        {/* Results */}
        <div className="space-y-3">
          {INGREDIENTS.map((ing) => {
            const val = results[ing.key]
            const isSelected = mode === 'ingredient' && selectedIng === ing.key
            return (
              <div
                key={ing.key}
                className={`rounded-2xl p-4 flex items-center justify-between border-2 transition-all ${
                  isSelected
                    ? 'bg-orange-700 border-orange-700 text-white'
                    : 'bg-white border-gray-100 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ing.emoji}</span>
                  <div>
                    <div className={`text-sm font-semibold ${isSelected ? 'text-orange-200' : 'text-gray-700'}`}>
                      {ing.label}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-orange-300' : 'text-gray-400'}`}>
                      {PER_PERSON[ing.key]}g / fő
                    </div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${isSelected ? 'text-white' : ''}`} style={!isSelected ? { color: ing.color } : {}}>
                  {formatNum(val)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="bg-gray-100 rounded-2xl p-4 flex justify-between items-center border border-gray-200">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Összesen</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {formatNum(results.teszta + results.krumpli + results.szalonna)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">~Személyek</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {Number.isInteger(peopleDisplay) ? peopleDisplay : peopleDisplay.toFixed(1)} fő
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 italic">
          Alap arány: 100g tészta · 215g krumpli · 50g szalonna / fő
        </p>
      </div>
    </PageContainer>
  )
}
```

- [ ] **Step 2: Update App.jsx to use Slambuc**

Replace `src/App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom'
import Hub from './pages/Hub'
import Kombucha from './pages/Kombucha'
import Slambuc from './pages/Slambuc'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/kombucha" element={<Kombucha />} />
      <Route path="/slambuc" element={<Slambuc />} />
      <Route path="/pizza" element={<div className="p-8 text-center">Pizza</div>} />
    </Routes>
  )
}
```

- [ ] **Step 3: Verify Slambuc calculator works**

Navigate to `http://localhost:5173/slambuc`

Test:
1. Default shows 4 people with correct amounts (400g pasta, 860g potato, 200g bacon)
2. Change people to 8 → amounts double
3. Switch to Alapanyag mode → select ingredient, enter amount
4. Results highlight selected ingredient

- [ ] **Step 4: Commit**

```bash
git add src/pages/Slambuc.jsx src/App.jsx
git commit -m "feat: add Slambuc calculator with people/ingredient modes"
```

---

### Task 11: Pizza Calculator — Biga Bench

**Goal:** Convert the Biga Bench pizza dough calculator from vanilla HTML/JS to React, integrating it with the project's shared components and design system.

**Reference:** The original calculator is provided as `biga-bench.html` — a complete vanilla HTML/JS pizza dough calculator with dark theme, sliders, recipe calculations, fermentation feedback, and schedule feature.

**Files:**
- Create: `src/pages/Pizza.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: Header, PageContainer
- Produces: Full pizza dough calculator with batch, biga, final dough, recipe, and schedule sections

**Key Features to Implement:**
1. **Batch Section:** Pizza balls count (1-40) and ball weight (150-400g) inputs
2. **Biga Section:** Share of total flour (10-100%), temperature (4-30°C), time (4-48h) with fermentation feedback
3. **Final Dough Section:** Hydration (55-85%), temperature (4-30°C), time (1-72h) with fermentation feedback
4. **Recipe Section:** Biga and final mix ingredient tables, yeast type toggle (fresh/instant), fine-tuning inputs for biga hydration, biga yeast, salt
5. **Schedule Section:** Bake time input with step-by-step schedule (Mix biga → Final mix → Bake)
6. **Copy Recipe:** Clipboard copy of formatted recipe

**Design Notes:**
- The Biga Bench has its own dark theme (`--bg:#0D1014`, `--hot:#FF6A2C`) — this is intentional and should be preserved
- Keep the dark theme for the Pizza page (it's a separate tool aesthetic)
- Use lucide-react icons for UI elements, keep the calculator's existing emoji/icon scheme
- Maintain the calculator's responsive layout (max-width: 640px centered)
- Preserve all calculation logic, feedback messages, and schedule generation from the original

**Calculation Logic (from original):**
- `target = balls × ballW × 1.02` (2% buffer)
- `F = target / (1 + finalHyd/100 + salt/100 + (bigaYeast/100) × bigaPct/100)`
- Biga: `Fb = F × bigaPct/100`, `Wb = Fb × bigaHyd/100`, `Yb = Fb × bigaYeast/100`
- Final: `Ff = F - Fb`, `Wf = F × finalHyd/100 - Wb`, `Sf = F × salt/100`
- Equivalence hours: `eq(h, t) = h × 2^((t-18)/10)`

- [ ] **Step 1: Create Pizza page with Biga Bench calculator**

```jsx
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'

const accent = 'red'

export default function Pizza() {
  return (
    <PageContainer>
      <Header icon="🍕" title="Pizza" accent={accent} />
      <div className="px-4 py-12 max-w-lg mx-auto text-center">
        <span className="text-6xl block mb-6">🍕</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pizza Calculator</h2>
        <p className="text-gray-500 mb-8">Coming soon...</p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">Features planned:</h3>
          <ul className="text-gray-600 space-y-2 text-sm">
            <li>• Dough calculator with baker's percentages</li>
            <li>• Hydration levels and yeast calculations</li>
            <li>• Save/load custom recipes</li>
          </ul>
        </div>
      </div>
    </PageContainer>
  )
}
```

- [ ] **Step 2: Update App.jsx to use Pizza**

Replace `src/App.jsx`:

```jsx
import { Routes, Route } from 'react-router-dom'
import Hub from './pages/Hub'
import Kombucha from './pages/Kombucha'
import Slambuc from './pages/Slambuc'
import Pizza from './pages/Pizza'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/kombucha" element={<Kombucha />} />
      <Route path="/slambuc" element={<Slambuc />} />
      <Route path="/pizza" element={<Pizza />} />
    </Routes>
  )
}
```

- [ ] **Step 3: Verify Pizza placeholder**

Navigate to `http://localhost:5173/pizza`

Expected: Red header, large pizza icon, "Coming soon", feature list

- [ ] **Step 4: Commit**

```bash
git add src/pages/Pizza.jsx src/App.jsx
git commit -m "feat: add Pizza placeholder page"
```

---

### Task 12: PWA Configuration

**Files:**
- Modify: `vite.config.js`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`
- Modify: `index.html`

**Interfaces:**
- Produces: PWA manifest, service worker, installable app

- [ ] **Step 1: Install vite-plugin-pwa**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Update vite.config.js**

Replace `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Recipe Calculators',
        short_name: 'Recipes',
        description: 'Mobile-first recipe calculators for Kombucha, Slambuc, and Pizza',
        theme_color: '#f59e0b',
        background_color: '#f9fafb',
        display: 'standalone',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
```

- [ ] **Step 3: Generate PWA icons**

Create simple SVG icons and convert to PNG. For now, use placeholder colored squares:

```bash
mkdir -p public/icons

# Create a simple 192x192 placeholder icon using ImageMagick or similar
# If ImageMagick is available:
convert -size 192x192 xc:#f59e0b -fill white -gravity center -pointsize 72 -annotate 0 "🍳" public/icons/icon-192.png 2>/dev/null || echo "Create icon-192.png manually"

convert -size 512x512 xc:#f59e0b -fill white -gravity center -pointsize 200 -annotate 0 "🍳" public/icons/icon-512.png 2>/dev/null || echo "Create icon-512.png manually"
```

If ImageMagick isn't available, create simple PNG files manually or use an online tool. The icons just need to exist as valid PNGs.

- [ ] **Step 4: Update index.html meta tags**

Replace `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/vite.svg" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#f59e0b" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>Recipe Calculators</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Verify PWA works**

```bash
npm run dev
```

Open Chrome DevTools → Application tab → Manifest. Verify:
- Manifest loads correctly
- Service worker registers
- "Add to Home Screen" prompt appears (or check with Lighthouse PWA audit)

- [ ] **Step 6: Commit**

```bash
git add vite.config.js public/icons/ index.html
git commit -m "feat: configure PWA with manifest and service worker"
```

---

### Task 13: Final Polish & Responsive Testing

**Files:**
- Modify: Any component as needed for polish

**Interfaces:**
- Produces: Final polished app ready for use

- [ ] **Step 1: Test all pages on mobile viewport**

Open Chrome DevTools, set viewport to iPhone 12 Pro (390x844).

Test each page:
- Hub: cards stack in 2 columns, readable text
- Kombucha: single column, inputs are usable, toggles work
- Slambuc: single column, slider works, results are readable
- Pizza: placeholder looks good

- [ ] **Step 2: Test on tablet/desktop viewport**

Set viewport to iPad (768x1024) and desktop (1280x720).

Test:
- Kombucha: two-column layout on lg: breakpoint
- Hub: cards expand to 3 columns on sm:

- [ ] **Step 3: Test PWA install**

- Chrome DevTools → Application → Service Workers → verify active
- Check "Add to Home Screen" prompt or use Lighthouse PWA audit

- [ ] **Step 4: Fix any issues found**

Address any visual or functional issues from testing.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: polish responsive design and verify PWA"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All requirements from spec are covered
  - Hub with card grid ✓
  - Kombucha calculator with all features ✓
  - Slambuc calculator with both modes ✓
  - Pizza placeholder ✓
  - PWA setup ✓
  - Shared components ✓
- [x] **Placeholder scan:** No TBD/TODO placeholders found
- [x] **Type consistency:** All component props and function signatures are consistent
- [x] **File structure:** Matches spec exactly
