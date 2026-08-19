import { useState } from 'react'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import IngredientInput from '../components/IngredientInput'
import Toggle from '../components/Toggle'
import { Scale, Leaf, Clock } from 'lucide-react'

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
