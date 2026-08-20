import { useMemo, useState } from 'react'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import { loadSession } from '../db/session'
import useSessionSync from '../hooks/useSessionSync'

const accent = 'slambuc'

const PER_PERSON = { teszta: 100, krumpli: 215, szalonna: 50 }

const INGREDIENTS = [
  { key: 'teszta', label: 'Pasta', color: '#C4874A', unit: 'g', emoji: '🍝' },
  { key: 'krumpli', label: 'Potato', color: '#7A9E5B', unit: 'g', emoji: '🥔' },
  { key: 'szalonna', label: 'Bacon', color: '#C0504A', unit: 'g', emoji: '🥓' },
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
  const initial = useMemo(() => {
    const stored = loadSession('slambuc', {
      mode: 'people',
      people: 4,
      selectedIng: 'teszta',
      ingValue: 400,
    })
    if (!INGREDIENTS.some((ing) => ing.key === stored.selectedIng)) {
      stored.selectedIng = 'teszta'
    }
    return stored
  }, [])
  const [mode, setMode] = useState(initial.mode)
  const [people, setPeople] = useState(initial.people)
  const [selectedIng, setSelectedIng] = useState(initial.selectedIng)
  const [ingValue, setIngValue] = useState(initial.ingValue)

  useSessionSync('slambuc', { mode, people, selectedIng, ingValue })

  const resultsFromPeople = calcFromPeople(people)
  const resultsFromIng = calcFromIngredient(selectedIng, ingValue)
  const results = mode === 'people' ? resultsFromPeople : resultsFromIng
  const peopleDisplay = mode === 'people' ? people : resultsFromIng.people

  return (
    <PageContainer>
      <Header icon="🍲" title="Slambuc" accent={accent} />
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Mode Toggle */}
        <div className="grid grid-cols-2 bg-sunken border border-line rounded-xl p-1">
          <button
            onClick={() => setMode('people')}
            className={`py-2 px-4 min-h-11 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slambuc ${
              mode === 'people' ? 'bg-slambuc text-white' : 'text-ink-muted'
            }`}
          >
            👥 People
          </button>
          <button
            onClick={() => setMode('ingredient')}
            className={`py-2 px-4 min-h-11 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slambuc ${
              mode === 'ingredient' ? 'bg-slambuc text-white' : 'text-ink-muted'
            }`}
          >
            ⚖️ Ingredient
          </button>
        </div>

        {/* Input Panel */}
        <Card>
          {mode === 'people' ? (
            <>
              <label className="block text-sm font-medium text-ink mb-3">
                Number of people
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPeople((p) => Math.max(1, p - 1))}
                  className="w-11 h-11 shrink-0 rounded-lg border border-line bg-sunken text-xl font-bold text-ink flex items-center justify-center hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slambuc"
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
                  className="w-20 h-11 rounded-lg border border-line bg-sunken text-xl font-bold text-ink text-center tabular-nums focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slambuc focus:border-slambuc"
                />
                <button
                  onClick={() => setPeople((p) => p + 1)}
                  className="w-11 h-11 shrink-0 rounded-lg border border-line bg-sunken text-xl font-bold text-ink flex items-center justify-center hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slambuc"
                >
                  +
                </button>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={Math.min(people, 50)}
                onChange={(e) => setPeople(parseInt(e.target.value, 10))}
                className="w-full mt-4 accent-slambuc"
              />
              <div className="flex justify-between text-xs text-ink-muted mt-1">
                <span>1 person</span>
                <span>50 people</span>
              </div>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-ink mb-3">
                Ingredient & amount
              </label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {INGREDIENTS.map((ing) => (
                  <button
                    key={ing.key}
                    onClick={() => setSelectedIng(ing.key)}
                    className={`p-3 min-h-11 rounded-xl border-2 text-center transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slambuc ${
                      selectedIng === ing.key
                        ? 'border-slambuc bg-slambuc/10'
                        : 'border-line bg-surface'
                    }`}
                  >
                    <span className="text-2xl block">{ing.emoji}</span>
                    <span className="text-xs font-medium text-ink mt-1 block">{ing.label}</span>
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
                  className="flex-1 h-11 rounded-lg border border-line bg-sunken text-xl font-bold text-ink text-center tabular-nums focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slambuc focus:border-slambuc"
                />
                <span className="text-ink-muted font-semibold">g</span>
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
                    ? 'bg-slambuc border-slambuc text-white'
                    : 'bg-surface border-line'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ing.emoji}</span>
                  <div>
                    <div className={`text-sm font-semibold ${isSelected ? 'text-white/90' : 'text-ink'}`}>
                      {ing.label}
                    </div>
                    <div className={`text-xs tabular-nums ${isSelected ? 'text-white/70' : 'text-ink-muted'}`}>
                      {PER_PERSON[ing.key]}g / person
                    </div>
                  </div>
                </div>
                <div className={`text-2xl font-bold tabular-nums ${isSelected ? 'text-white' : ''}`} style={!isSelected ? { color: ing.color } : {}}>
                  {formatNum(val)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="bg-sunken rounded-2xl p-4 flex justify-between items-center border border-line">
          <div>
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Total</div>
            <div className="text-xl font-bold text-ink mt-1 tabular-nums">
              {formatNum(results.teszta + results.krumpli + results.szalonna)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">~People</div>
            <div className="text-xl font-bold text-ink mt-1 tabular-nums">
              {Number.isInteger(peopleDisplay) ? peopleDisplay : peopleDisplay.toFixed(1)}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted italic">
          Base ratio: 100g pasta · 215g potato · 50g bacon / person
        </p>
      </div>
    </PageContainer>
  )
}
