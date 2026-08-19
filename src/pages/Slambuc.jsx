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
