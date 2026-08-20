import { useState } from 'react'
import Card from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import { Copy, Clock, Check } from 'lucide-react'
import {
  round,
  computeDough,
  computeSchedule,
  buildRecipeText,
  fermentationLevel,
  FERMENTATION_TEXT,
  formatDateTime,
} from '../../lib/pizza'

const FERMENTATION_COLOR = {
  'very-short': 'text-red-600 dark:text-red-400',
  short: 'text-amber-600 dark:text-amber-400',
  medium: 'text-green-600 dark:text-green-400',
  long: 'text-green-700 dark:text-green-400',
  'very-long': 'text-blue-600 dark:text-blue-400',
  extended: 'text-purple-600 dark:text-purple-400',
}

export default function PizzaCalculator({ params, setParam, bakeDateTimeStr, setBakeDateTimeStr, loadedRecipe, isDirty, footer }) {
  const [copied, setCopied] = useState(false)

  const { balls, ballW, bigaPct, bigaTemp, bigaTime, finalHyd, finalTemp, finalTime, useFreshYeast } = params

  const d = computeDough(params)
  const { salt, bigaHyd, bigaYeast, F, Fb, Wb, Yb, Ff, Wf, Sf, bigaEq, finalEq, target } = d
  const schedule = computeSchedule(params, bakeDateTimeStr)

  const bigaLevel = fermentationLevel(bigaEq)
  const finalLevel = fermentationLevel(finalEq)

  function handleCopy() {
    const text = buildRecipeText({ ...params, bakeDateTimeStr })
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
              <span className="w-1.5 h-1.5 rounded-full bg-pizza" aria-hidden="true" />
              unsaved changes
            </span>
          )}
        </div>
      )}

      {/* Batch */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">📦</span> Batch
        </h2>
        <div className="space-y-4">
          <NumberInput label="Pizza balls" value={balls} onChange={(v) => setParam('balls', v)} min={1} max={40} step={1} unit="pcs" />
          <NumberInput label="Ball weight" value={ballW} onChange={(v) => setParam('ballW', v)} min={150} max={400} step={10} unit="g" />
          <div className="bg-sunken rounded-xl p-3 flex justify-between items-center border border-line">
            <span className="text-sm text-ink-muted">Target dough weight</span>
            <span className="text-ink font-bold">{round(target)}g</span>
          </div>
        </div>
      </Card>

      {/* Biga */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">🫗</span> Biga <span className="text-xs text-ink-muted font-normal">day 1 · no salt</span>
        </h2>
        <div className="space-y-4">
          <NumberInput label="Share of total flour" value={bigaPct} onChange={(v) => setParam('bigaPct', v)} min={10} max={100} step={5} unit="%" />
          <NumberInput label="Biga hydration" value={bigaHyd} onChange={(v) => setParam('bigaHydFine', String(v))} min={30} max={80} step={1} unit="%" />
          <NumberInput label="Temperature" value={bigaTemp} onChange={(v) => setParam('bigaTemp', v)} min={4} max={30} step={1} unit="°C" />
          <NumberInput label="Time" value={bigaTime} onChange={(v) => setParam('bigaTime', v)} min={4} max={48} step={1} unit="h" />
          <div className="bg-sunken rounded-xl p-3 border border-line">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-ink-muted">Fermentation equivalent</span>
              <span className="text-ink font-bold">{round(bigaEq)}h @ 18°C</span>
            </div>
            <p className={`text-xs font-medium ${FERMENTATION_COLOR[bigaLevel]}`}>{FERMENTATION_TEXT[bigaLevel]}</p>
          </div>
        </div>
      </Card>

      {/* Final Dough */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">🫓</span> Final Dough <span className="text-xs text-ink-muted font-normal">day 2</span>
        </h2>
        <div className="space-y-4">
          <NumberInput label="Hydration" value={finalHyd} onChange={(v) => setParam('finalHyd', v)} min={55} max={85} step={1} unit="%" />
          <NumberInput label="Temperature" value={finalTemp} onChange={(v) => setParam('finalTemp', v)} min={4} max={30} step={1} unit="°C" />
          <NumberInput label="Time" value={finalTime} onChange={(v) => setParam('finalTime', v)} min={1} max={72} step={1} unit="h" />
          <div className="bg-sunken rounded-xl p-3 border border-line">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-ink-muted">Fermentation equivalent</span>
              <span className="text-ink font-bold">{round(finalEq)}h @ 18°C</span>
            </div>
            <p className={`text-xs font-medium ${FERMENTATION_COLOR[finalLevel]}`}>{FERMENTATION_TEXT[finalLevel]}</p>
          </div>
        </div>
      </Card>

      {/* Recipe */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">📋</span> Recipe <span className="text-xs text-ink-muted font-normal">{round(F)}g flour</span>
        </h2>

        {/* Yeast toggle */}
        <div className="flex gap-1 bg-sunken p-1 rounded-lg mb-4">
          <button
            onClick={() => setParam('useFreshYeast', true)}
            className={`flex-1 min-h-11 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              useFreshYeast ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
            }`}
          >
            Fresh yeast
          </button>
          <button
            onClick={() => setParam('useFreshYeast', false)}
            className={`flex-1 min-h-11 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              !useFreshYeast ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
            }`}
          >
            Instant (÷3)
          </button>
        </div>

        {/* Biga table */}
        <div className="mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2 text-ink-muted font-normal text-xs uppercase tracking-wider" colSpan={2}>Biga</th>
                <th className="text-right py-2 text-ink-muted font-normal text-xs uppercase tracking-wider">g</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Flour</td>
                <td className="py-2 text-ink-muted text-xs">100%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(Fb)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Water</td>
                <td className="py-2 text-ink-muted text-xs">{bigaHyd}%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(Wb)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">{useFreshYeast ? 'Fresh yeast' : 'Instant yeast'}</td>
                <td className="py-2 text-ink-muted text-xs">{round(d.yeastPct)}%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.yeastG)}</td>
              </tr>
              <tr>
                <td className="py-2 text-ink font-semibold" colSpan={2}>Biga total</td>
                <td className="py-2 text-ink text-right font-bold tabular-nums">{round(Fb + Wb + Yb)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Final mix table */}
        <div className="mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2 text-ink-muted font-normal text-xs uppercase tracking-wider" colSpan={2}>Final mix</th>
                <th className="text-right py-2 text-ink-muted font-normal text-xs uppercase tracking-wider">g</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Mature biga</td>
                <td className="py-2 text-ink-muted text-xs">—</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(Fb + Wb + Yb)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Flour</td>
                <td className="py-2 text-ink-muted text-xs">{round(100 - bigaPct)}%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(Ff)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Water</td>
                <td className="py-2 text-ink-muted text-xs">{round(finalHyd - bigaHyd * bigaPct / 100)}%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(Wf)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Salt</td>
                <td className="py-2 text-ink-muted text-xs">{salt}%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(Sf)}</td>
              </tr>
              <tr>
                <td className="py-2 text-ink font-semibold" colSpan={2}>{balls} × {ballW}g</td>
                <td className="py-2 text-ink text-right font-bold tabular-nums">{round(target)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="w-full py-3 bg-pizza hover:opacity-90 text-white rounded-xl font-semibold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy recipe'}
        </button>
      </Card>

      {/* Variables */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">⚙️</span> Variables
        </h2>
        <div className="space-y-4">
          <NumberInput label="Biga yeast" value={bigaYeast} onChange={(v) => setParam('bigaYeastFine', String(v))} min={0.1} max={5} step={0.05} unit="%" />
          <NumberInput label="Salt" value={salt} onChange={(v) => setParam('saltFine', String(v))} min={0.5} max={5} step={0.1} unit="%" />
        </div>
      </Card>

      {/* Schedule */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-pizza" /> Schedule
        </h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-ink mb-1">First pizza in the oven</label>
          <input
            type="datetime-local"
            value={bakeDateTimeStr}
            onChange={(e) => setBakeDateTimeStr(e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-line bg-sunken rounded-lg text-ink text-sm font-mono focus:outline-none focus:border-pizza"
          />
        </div>

        {schedule ? (
          <div className="space-y-3">
            <div className="grid grid-cols-[88px_1fr] gap-3 items-start py-2.5 border-b border-dashed border-line">
              <div className="font-mono text-sm font-semibold text-ink">
                {formatDateTime(schedule.bigaMixTime).split(' ')[0]}
                <div className="text-[10px] text-ink-muted uppercase tracking-wider font-normal">
                  {schedule.bigaMixTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div>
                <div className="text-sm text-ink">Mix biga</div>
                <div className="text-xs text-ink-muted font-mono mt-0.5">
                  {round(Fb)}g flour · {round(Wb)}g water · {round(d.yeastG)}g {useFreshYeast ? 'fresh yeast' : 'instant yeast'} — crumble, don't knead
                </div>
                <div className="text-xs text-ink-muted font-mono">{bigaTime}h at {bigaTemp}°C</div>
              </div>
            </div>
            <div className="grid grid-cols-[88px_1fr] gap-3 items-start py-2.5 border-b border-dashed border-line">
              <div className="font-mono text-sm font-semibold text-ink">
                {formatDateTime(schedule.finalMixTime).split(' ')[0]}
                <div className="text-[10px] text-ink-muted uppercase tracking-wider font-normal">
                  {schedule.finalMixTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div>
                <div className="text-sm text-ink">Final mix</div>
                <div className="text-xs text-ink-muted font-mono mt-0.5">
                  add {round(Ff)}g flour · {round(Wf)}g water · {round(Sf)}g salt — ball up within 1–2 h
                </div>
                <div className="text-xs text-ink-muted font-mono">{finalTime}h at {finalTemp}°C</div>
              </div>
            </div>
            <div className="grid grid-cols-[88px_1fr] gap-3 items-start py-2.5">
              <div className="font-mono text-sm font-semibold text-ink">
                {formatDateTime(schedule.bakeTime).split(' ')[0]}
                <div className="text-[10px] text-ink-muted uppercase tracking-wider font-normal">
                  {schedule.bakeTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div>
                <div className="text-sm text-ink">Bake</div>
                <div className="text-xs text-ink-muted font-mono mt-0.5">
                  stretch by hand, 60–90 s at 430–480°C
                </div>
                <div className="text-xs text-ink-muted font-mono">{balls} pizzas</div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-ink-muted text-sm text-center py-4">Set a bake date & time to see the schedule</p>
        )}
      </Card>

      {footer}

      {/* Footer */}
      <p className="text-center text-xs text-ink-muted italic pb-4 font-mono">
        Fermentation rate roughly doubles per 10°C, so each stage is shown as equivalent hours at 18°C.<br />
        Below ~10°C it flatters the real activity. A planning aid, not a verdict — watch the dough.
      </p>
    </div>
  )
}
