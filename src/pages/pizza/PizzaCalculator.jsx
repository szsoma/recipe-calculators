import { useState } from 'react'
import Card from '../../components/Card'
import NumberInput from '../../components/NumberInput'
import InfoPopover from '../../components/InfoPopover'
import { Copy, Clock, Check } from 'lucide-react'
import {
  round,
  computeDough,
  computeSchedule,
  buildRecipeText,
  fermentationLevel,
  FERMENTATION_TEXT,
  maturationLevel,
  MATURITY_TEXT,
  YEAST_DOSE_TEXT,
  formatDateTime,
  prefermentDefaults,
} from '../../lib/pizza'

const YEAST_DOSE_COLOR = {
  high: 'text-red-600 dark:text-red-400',
  ok: 'text-green-700 dark:text-green-400',
  low: 'text-amber-600 dark:text-amber-400',
}

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

  const { balls, ballW, bigaPct, bigaTemp, bigaTime, finalHyd, finalTemp, finalTime, roomTime, roomTemp, prefermentType, useFreshYeast } = params

  const d = computeDough(params)
  const { salt, bigaHyd, bigaYeast, F, Fb, Wb, Yb, Ff, Wf, Sf, bigaEq, finalEq, target } = d
  const schedule = computeSchedule(params, bakeDateTimeStr)

  const isPoolish = prefermentType === 'poolish'
  // mainYeastPct/mainYeastG are held on a fresh basis in the model; the instant
  // conversion (÷3) is applied only where an amount is displayed.
  const mainYeastPct = useFreshYeast ? d.mainYeastPct : d.mainYeastPct / 3
  const mainYeastG = useFreshYeast ? d.mainYeastG : d.mainYeastG / 3

  const bigaLevel = fermentationLevel(bigaEq)
  const finalLevel = fermentationLevel(finalEq)
  const roomLevel = fermentationLevel(d.roomEq)
  const coldLevel = fermentationLevel(d.coldEq)
  const totalLevel = fermentationLevel(d.totalEq)
  const totalMatLevel = maturationLevel(d.totalMat)
  const { suggestedYeast, suggestedYeastPct, yeastDose } = d
  const yeastUnit = useFreshYeast ? 'fresh' : 'instant'
  const suggestionMatches = suggestedYeast && round(bigaYeast) === round(suggestedYeast.pct)
  const isAutoYeast = !isPoolish // biga yeast is now always auto — recalculates immediately on time/temp/hydration

  function handlePrefermentType(next) {
    setParam('prefermentType', next)
    for (const [key, value] of Object.entries(prefermentDefaults(next))) {
      setParam(key, value)
    }
  }

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

      {/* Pre-ferment toggle */}
      <div className="flex items-center justify-end gap-1 mb-2 text-xs text-ink-muted">
        Pre-ferment
        <InfoPopover label="Pre-ferment">
          Choose how the dough gets its initial boost. A biga is a stiff (~42% water) dough that
          ferments for many hours; a poolish is an equal-parts flour-and-water (100% hydration)
          preferment that raises faster. Each mode loads its own set of defaults.
        </InfoPopover>
      </div>
      <div className="flex gap-1 bg-sunken p-1 rounded-lg mb-4">
        <button
          onClick={() => handlePrefermentType('biga')}
          className={`flex-1 min-h-11 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            !isPoolish ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
          }`}
        >
          Biga
        </button>
        <button
          onClick={() => handlePrefermentType('poolish')}
          className={`flex-1 min-h-11 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            isPoolish ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
          }`}
        >
          Poolish
        </button>
      </div>

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

      {/* Pre-ferment */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">🫗</span> {isPoolish ? 'Poolish' : 'Biga'} <span className="text-xs text-ink-muted font-normal">day 1 · no salt</span>
        </h2>
        <div className="space-y-4">
          <NumberInput label="Share of total flour" value={bigaPct} onChange={(v) => setParam('bigaPct', v)} min={10} max={100} step={5} unit="%" />
          {!isPoolish && (
            <NumberInput label="Biga hydration" value={bigaHyd} onChange={(v) => setParam('bigaHydFine', String(v))} min={30} max={80} step={1} unit="%" />
          )}
          <NumberInput label="Temperature" value={bigaTemp} onChange={(v) => setParam('bigaTemp', v)} min={4} max={30} step={1} unit="°C" />
          <NumberInput label="Time" value={bigaTime} onChange={(v) => setParam('bigaTime', v)} min={4} max={48} step={1} unit="h" />
          {isPoolish && (
            <NumberInput label="Poolish yeast" fieldId="num-poolish-yeast-preferment" value={bigaYeast} onChange={(v) => setParam('bigaYeastFine', String(v))} min={0.05} max={5} step={0.05} unit="%" />
          )}
          <div className="bg-sunken rounded-xl p-3 border border-line">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-ink-muted flex items-center gap-1">
                Fermentation equivalent
                <InfoPopover label="Fermentation equivalent" align="left">
                  How much fermentation this stage delivers, restated as hours at 25°C so you can
                  compare a cold slow biga against a warm fast one. Rate follows Birch et al. 2013:
                  fastest around 25°C, slower at 35°C (gas ≠ volume). Each hour is also scaled by
                  hydration (~0.94 at 55% → 1.06 at 70%) and salt (~−9% per +1% salt).
                  Reference anchored to Giorilli's biga (1% fresh, 18h at 18°C, ~42% hydration).
                </InfoPopover>
              </span>
              <span className="text-ink font-bold">{round(bigaEq)}h @ 25°C</span>
            </div>
            <p className={`text-xs font-medium ${FERMENTATION_COLOR[bigaLevel]}`}>{FERMENTATION_TEXT[bigaLevel]}</p>
            <p className="text-[11px] text-ink-muted mt-1">Hydration + salt factored — change either and the grams move.</p>
          </div>

          {!isPoolish && suggestedYeast && (
            <div className="bg-sunken rounded-xl p-3 border border-line">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-ink-muted flex items-center gap-1">
                  {isAutoYeast ? 'Yeast — auto' : 'Suggested yeast'}
                  <InfoPopover label={isAutoYeast ? 'Auto yeast' : 'Suggested yeast'} align="left">
                    {isAutoYeast
                      ? 'Auto mode is on (yeast field empty). Yeast is calculated from time × temperatureRate × hydration × salt so the grams in Recipe update live when you change any dial. Enter a value in Variables to lock it manually.'
                      : 'Yeast × fermentation exposure stays constant. Exposure is Σ hours × temperatureRate × hydrationFactor × saltFactor. Warmer, longer or higher hydration needs less yeast or the biga peaks early and collapses. Pinned to Giorilli\'s biga: 1% fresh, 18h at 18°C (~42% hyd). Tap Use to snap to auto, or clear the field to return to auto.'}
                  </InfoPopover>
                  {isAutoYeast && <span className="ml-1 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-semibold px-2 py-0.5">AUTO</span>}
                </span>
                <span className="text-ink font-bold tabular-nums">
                  {round(suggestedYeastPct)}% {yeastUnit}
                  {isAutoYeast && <span className="ml-1 text-xs font-normal text-green-700 dark:text-green-300">↻ live</span>}
                </span>
              </div>
              <p className={`text-xs font-medium ${YEAST_DOSE_COLOR[yeastDose]}`}>
                {isAutoYeast
                  ? `Auto-calculated — Recipe grams follow this value. ${YEAST_DOSE_TEXT[yeastDose]}`
                  : suggestedYeast.aboveCeiling
                    ? 'Capped at 2% — this is too cold or too short for the biga to ripen fully. Give it longer or warmer.'
                    : suggestedYeast.belowFloor
                      ? 'Floored at 0.05% — too little to weigh reliably. Shorten the biga or cool it down.'
                      : YEAST_DOSE_TEXT[yeastDose]}
              </p>
              {!isAutoYeast && !suggestionMatches && (
                <button
                  type="button"
                  onClick={() => setParam('bigaYeastFine', String(round(suggestedYeast.pct)))}
                  className="mt-2 w-full min-h-11 rounded-lg border border-line bg-surface text-sm font-medium text-ink hover:bg-line active:scale-[0.99] transition"
                >
                  Use {round(suggestedYeastPct)}% (now {round(d.yeastPct)}%)
                </button>
              )}
              {!isAutoYeast && (
                <button
                  type="button"
                  onClick={() => setParam('bigaYeastFine', '')}
                  className="mt-2 w-full min-h-11 rounded-lg border border-dashed border-line bg-sunken text-xs font-medium text-ink-muted hover:bg-surface transition"
                >
                  ↺ Back to auto (live)
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Final Dough */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">🫓</span> Final Dough <span className="text-xs text-ink-muted font-normal">day 2</span>
        </h2>
        <div className="space-y-4">
          <NumberInput label="Hydration" value={finalHyd} onChange={(v) => setParam('finalHyd', v)} min={55} max={100} step={1} unit="%" />
          {!isPoolish && (
            <>
              <NumberInput label="Temperature" value={finalTemp} onChange={(v) => setParam('finalTemp', v)} min={4} max={30} step={1} unit="°C" />
              <NumberInput label="Time" value={finalTime} onChange={(v) => setParam('finalTime', v)} min={1} max={72} step={1} unit="h" />
              <div className="bg-sunken rounded-xl p-3 border border-line">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-ink-muted">Fermentation equivalent</span>
                  <span className="text-ink font-bold">{round(finalEq)}h @ 25°C</span>
                </div>
                <p className={`text-xs font-medium ${FERMENTATION_COLOR[finalLevel]}`}>{FERMENTATION_TEXT[finalLevel]}</p>
                <p className="text-[11px] text-ink-muted mt-1">Hydration + salt factored.</p>
              </div>
            </>
          )}
          {isPoolish && (
            <>
              <div className="bg-sunken rounded-xl p-3 border border-line">
                <div className="mb-3">
                  <div className="text-sm font-medium text-ink">Room rest</div>
                  <div className="text-xs text-ink-muted">bulk proof before shaping</div>
                </div>
                <NumberInput label="Room rest time" value={roomTime} onChange={(v) => setParam('roomTime', v)} min={0} max={48} step={1} unit="h" />
                <NumberInput label="Room rest temperature" value={roomTemp} onChange={(v) => setParam('roomTemp', v)} min={0} max={35} step={1} unit="°C" />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-ink-muted">Fermentation equivalent</span>
                  <span className="text-ink font-bold">{round(d.roomEq)}h @ 25°C</span>
                </div>
                <p className={`text-xs font-medium mt-1 ${FERMENTATION_COLOR[roomLevel]}`}>{FERMENTATION_TEXT[roomLevel]}</p>
              </div>
              <div className="bg-sunken rounded-xl p-3 border border-line">
                <div className="mb-3">
                  <div className="text-sm font-medium text-ink">Cold proof</div>
                  <div className="text-xs text-ink-muted">final proof in the fridge</div>
                </div>
                <NumberInput label="Cold proof time" value={finalTime} onChange={(v) => setParam('finalTime', v)} min={1} max={96} step={1} unit="h" />
                <NumberInput label="Cold proof temperature" value={finalTemp} onChange={(v) => setParam('finalTemp', v)} min={-4} max={30} step={1} unit="°C" />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm text-ink-muted">Fermentation equivalent</span>
                  <span className="text-ink font-bold">{round(d.coldEq)}h @ 25°C</span>
                </div>
                <p className={`text-xs font-medium mt-1 ${FERMENTATION_COLOR[coldLevel]}`}>{FERMENTATION_TEXT[coldLevel]}</p>
              </div>
            </>
          )}

          <div className="bg-sunken rounded-xl p-3 border border-line">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-ink-muted flex items-center gap-1">
                Total maturation
                <InfoPopover label="Total maturation" align="left">
                  {isPoolish
                    ? 'Fermentation (CO₂) and maturity (gluten relaxation) are separate per Covino et al. 2023. Poolish + room + cold. Exposure is Σ hours × temperatureRate × hydration × salt. Hydration affects handling ~2.5× more than gas. Over-fermentation is a total-budget problem.'
                    : 'Fermentation (gas) and maturity (extensibility) evolve separately. Biga + final. Σ exposure as above; biga dose only balances the biga stage — if total runs long, shorten final time or cool it rather than cutting yeast further. Capped yeast means lengthen/warm instead.'}
                </InfoPopover>
              </span>
              <span className="text-ink font-bold">{round(d.totalEq)}h @ 25°C</span>
            </div>
            <p className={`text-xs font-medium ${FERMENTATION_COLOR[totalLevel]}`}>Fermentation: {FERMENTATION_TEXT[totalLevel]}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-ink-muted">Maturity (handling)</span>
              <span className="text-ink font-bold text-sm">{round(d.totalMat)}h</span>
            </div>
            <p className={`text-xs font-medium ${FERMENTATION_COLOR[totalMatLevel]}`}>{MATURITY_TEXT[totalMatLevel]}</p>
            <p className="text-[11px] text-ink-muted mt-2 italic">{d.handlingPrediction}</p>
          </div>
        </div>
      </Card>

      {/* Recipe */}
      <Card>
        <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <span className="text-lg">📋</span> Recipe <span className="text-xs text-ink-muted font-normal">{round(F)}g flour</span>
        </h2>

        {/* Yeast toggle */}
        <div className="flex items-center justify-end gap-1 mb-1 text-xs text-ink-muted">
          Yeast type
          <InfoPopover label="Fresh vs instant yeast">
            Instant dry yeast is about three times as concentrated as fresh (compressed) yeast, so
            the same fermentation needs a third of the weight. Every yeast figure in this app is
            held on a fresh basis and divided by 3 only for display — switching the toggle changes
            what you weigh out, never how fast the dough ferments.
          </InfoPopover>
        </div>
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
                <th className="text-left py-2 text-ink-muted font-normal text-xs uppercase tracking-wider" colSpan={2}>{isPoolish ? 'Poolish' : 'Biga'}</th>
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
                <td className="py-2 text-ink-muted text-xs">{isPoolish ? '100%' : `${bigaHyd}%`}</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(Wb)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">{useFreshYeast ? 'Fresh yeast' : 'Instant yeast'} {isAutoYeast && <span className="text-[10px] text-green-700 dark:text-green-300 font-normal">auto</span>}</td>
                <td className="py-2 text-ink-muted text-xs">{round(d.yeastPct)}%{isAutoYeast && ' auto'}</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(d.yeastG)} {isAutoYeast && <span className="text-[10px] text-green-600 dark:text-green-400">↻</span>}</td>
              </tr>
              <tr>
                <td className="py-2 text-ink font-semibold" colSpan={2}>{isPoolish ? 'Poolish total' : 'Biga total'}</td>
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
                <td className="py-2 text-ink">{isPoolish ? 'Mature poolish' : 'Mature biga'}</td>
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
                <td className="py-2 text-ink-muted text-xs">
                  {isPoolish ? round(finalHyd - 100 * bigaPct / 100) : round(finalHyd - bigaHyd * bigaPct / 100)}%
                </td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(Wf)}</td>
              </tr>
              <tr className="border-b border-dashed border-line">
                <td className="py-2 text-ink">Salt</td>
                <td className="py-2 text-ink-muted text-xs">{salt}%</td>
                <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(Sf)}</td>
              </tr>
              {isPoolish && (
                <tr className="border-b border-dashed border-line">
                  <td className="py-2 text-ink">{useFreshYeast ? 'Fresh yeast' : 'Instant yeast'}</td>
                  <td className="py-2 text-ink-muted text-xs">{round(mainYeastPct)}%</td>
                  <td className="py-2 text-ink text-right font-semibold tabular-nums">{round(mainYeastG)}</td>
                </tr>
              )}
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
          {isPoolish ? (
            <InfoPopover label="Poolish yeast">
              Set on a fresh-yeast basis: poolish yeast as a percentage of the poolish's flour,
              main yeast as a percentage of the main dough's flour. Poolish keeps these fixed —
              there is no schedule-driven suggestion — so the dials only move when you change your
              recipe.
            </InfoPopover>
          ) : (
            <InfoPopover label="Biga yeast">
              Auto when empty — grams in Recipe follow time/temp/hydration live. Enter a value to lock it manually; clear to return to auto.
            </InfoPopover>
          )}
        </h2>
        <div className="space-y-4">
          {isPoolish ? (
            <NumberInput label="Poolish yeast" value={bigaYeast} onChange={(v) => setParam('bigaYeastFine', String(v))} min={0.05} max={5} step={0.05} unit="%" />
          ) : (
            <div className="bg-sunken rounded-xl p-3 border border-line">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-ink flex items-center gap-1.5">
                  Biga yeast <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-semibold px-2 py-0.5">AUTO</span>
                  <span className="text-[11px] text-green-600 dark:text-green-400 font-normal">↻ live</span>
                </span>
                <span className="text-ink font-bold tabular-nums">{round(bigaYeast)}% <span className="text-xs font-normal text-ink-muted">· {round(d.yeastG)}g {useFreshYeast ? 'fresh' : 'instant'}</span></span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1.5">Calculated from time × temp × hydration × salt — change any dial and the grams update immediately. No manual field needed; the Recipe below mirrors this value.</p>
            </div>
          )}
          {isPoolish && (
            <NumberInput
              label="Main yeast"
              value={params.poolishMainYeastFine !== '' ? parseFloat(params.poolishMainYeastFine) : d.mainYeastPct}
              onChange={(v) => setParam('poolishMainYeastFine', String(v))}
              min={0.05}
              max={5}
              step={0.05}
              unit="%"
            />
          )}
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
                {formatDateTime(isPoolish ? schedule.poolishMixTime : schedule.bigaMixTime).split(' ')[0]}
                <div className="text-[10px] text-ink-muted uppercase tracking-wider font-normal">
                  {(isPoolish ? schedule.poolishMixTime : schedule.bigaMixTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div>
                <div className="text-sm text-ink">{isPoolish ? 'Mix poolish' : 'Mix biga'}</div>
                <div className="text-xs text-ink-muted font-mono mt-0.5">
                  {round(Fb)}g flour · {round(Wb)}g water · {round(d.yeastG)}g {useFreshYeast ? 'fresh yeast' : 'instant yeast'} — {isPoolish ? 'mix, let ripen' : "crumble, don't knead"}
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
                  add {round(Ff)}g flour · {round(Wf)}g water · {round(Sf)}g salt{isPoolish ? ` · ${round(mainYeastG)}g ${useFreshYeast ? 'fresh yeast' : 'instant yeast'}` : ''} — ball up within 1–2 h
                </div>
                {isPoolish ? (
                  <>
                    <div className="text-xs text-ink-muted font-mono">room rest {roomTime}h at {roomTemp}°C</div>
                    <div className="text-xs text-ink-muted font-mono">cold proof {finalTime}h at {finalTemp}°C</div>
                  </>
                ) : (
                  <div className="text-xs text-ink-muted font-mono">{finalTime}h at {finalTemp}°C</div>
                )}
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
        Fermentation rate peaks near 25°C per Birch et al. 2013 (gas ≠ volume per Limongi 2012) — stages shown as h @ 25°C and scaled by hydration (55% 0.94 → 70% 1.06) + salt (−9%/+1%). Maturity tracks gluten relaxation separately (Covino 2023, Dufour 2024). A planning aid — watch the dough.
      </p>
    </div>
  )
}
