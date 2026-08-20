import { useState } from 'react'
import Card from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import { Copy, Clock, Check } from 'lucide-react'
import {
  round,
  computeSourdough,
  equivalentHours,
  fermentationLevel,
  FERMENTATION_TEXT,
  buildRecipeText,
} from '../../lib/sourdough'

const FERMENTATION_COLOR = {
  short: 'text-amber-600 dark:text-amber-400',
  medium: 'text-green-600 dark:text-green-400',
  long: 'text-green-700 dark:text-green-400',
  'very-long': 'text-blue-600 dark:text-blue-400',
  extended: 'text-purple-600 dark:text-purple-400',
}

export default function SourDoughCalculator({ params, setParam, loadedRecipe, isDirty, footer }) {
  const [copied, setCopied] = useState(false)

  const d = computeSourdough(params)
  const fermentEq = equivalentHours(12, 20)
  const fermentLevel = fermentationLevel(fermentEq)

  function handleCopy() {
    const text = buildRecipeText(params)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">

      {loadedRecipe && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-ink">{loadedRecipe.name}</span>
          {isDirty && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-sourdough" aria-hidden="true" />
              unsaved changes
            </span>
          )}
        </div>
      )}

      {/* Bread */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">🍞</span> Bread
        </h2>
        <div className="space-y-4">
          <NumberInput label="Baked bread weight" value={params.bakedWeight} onChange={(v) => setParam('bakedWeight', v)} min={200} max={2000} step={50} unit="g" />
          <div className="bg-sunken rounded-xl p-3 flex justify-between items-center border border-line">
            <span className="text-sm text-ink-muted">Target dough weight</span>
            <span className="text-ink font-bold">{round(d.doughWeight)}g</span>
          </div>
        </div>
      </Card>

      {/* Sourdough */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">🫗</span> Sourdough <span className="text-xs text-ink-muted font-normal">12h ferment</span>
        </h2>
        <div className="space-y-4">
          <NumberInput label="Share of total flour" value={params.sourdoughPct} onChange={(v) => setParam('sourdoughPct', v)} min={10} max={40} step={1} unit="%" />
          <div className="bg-sunken rounded-xl p-3 border border-line">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-ink-muted">Fermentation equivalent</span>
              <span className="text-ink font-bold">{round(fermentEq)}h @ 18°C</span>
            </div>
            <p className={`text-xs font-medium ${FERMENTATION_COLOR[fermentLevel]}`}>{FERMENTATION_TEXT[fermentLevel]}</p>
          </div>
        </div>
      </Card>

      {/* Dough */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">🫓</span> Dough
        </h2>
        <div className="space-y-4">
          <NumberInput label="Hydration" value={params.hydration} onChange={(v) => setParam('hydration', v)} min={55} max={80} step={1} unit="%" />
          <NumberInput label="Salt" value={params.salt} onChange={(v) => setParam('salt', v)} min={1.5} max={3} step={0.1} unit="%" />
          <NumberInput label="Second flour" value={params.secondFlourPct} onChange={(v) => setParam('secondFlourPct', v)} min={0} max={100} step={5} unit="%" />
        </div>
      </Card>

      {/* Recipe */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">📋</span> Recipe <span className="text-xs text-ink-muted font-normal">{round(d.totalFlour)}g flour</span>
        </h2>

        {/* Sourdough table */}
        <div className="mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2 text-ink-muted font-normal text-xs uppercase tracking-wider" colSpan={2}>Sourdough</th>
                <th className="text-right py-2 text-ink-muted font-normal text-xs uppercase tracking-wider">g</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Flour</td>
                <td className="py-2 text-ink-muted text-xs">100%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.sourdoughFlour)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Water</td>
                <td className="py-2 text-ink-muted text-xs">100%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.sourdoughWater)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Mother</td>
                <td className="py-2 text-ink-muted text-xs">—</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.motherTbsp)} tbsp</td>
              </tr>
              <tr>
                <td className="py-2 text-ink font-semibold" colSpan={2}>Sourdough total</td>
                <td className="py-2 text-ink text-right font-bold tabular-nums">{round(d.sourdoughFlour + d.sourdoughWater)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main dough table */}
        <div className="mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2 text-ink-muted font-normal text-xs uppercase tracking-wider" colSpan={2}>Main Dough</th>
                <th className="text-right py-2 text-ink-muted font-normal text-xs uppercase tracking-wider">g</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">First flour</td>
                <td className="py-2 text-ink-muted text-xs">{round(100 - params.sourdoughPct - params.secondFlourPct)}%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.firstFlour)}</td>
              </tr>
              {params.secondFlourPct > 0 && (
                <tr className="border-b border-dashed border-line">
                  <td className="py-2 text-ink">Second flour</td>
                  <td className="py-2 text-ink-muted text-xs">{params.secondFlourPct}%</td>
                  <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.secondFlour)}</td>
                </tr>
              )}
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Water</td>
                <td className="py-2 text-ink-muted text-xs">—</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.remainingWater)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Salt</td>
                <td className="py-2 text-ink-muted text-xs">{params.salt}%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.saltG)}</td>
              </tr>
              <tr>
                <td className="py-2 text-ink font-semibold" colSpan={2}>Total</td>
                <td className="py-2 text-ink text-right font-bold tabular-nums">{round(d.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="w-full py-3 bg-sourdough hover:opacity-90 text-white rounded-xl font-semibold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy recipe'}
        </button>
      </Card>

      {footer}

      {/* Footer */}
      <p className="text-center text-xs text-ink-muted italic pb-4 font-mono">
        Fermentation rate roughly doubles per 10°C.<br />
        A planning aid, not a verdict — watch the dough.
      </p>
    </div>
  )
}
