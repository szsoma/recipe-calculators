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
