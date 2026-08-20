import { useState } from 'react'
import Header from '../components/Header'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import { Copy, Clock, Check } from 'lucide-react'
import {
  SALT_DEFAULT,
  BIGA_HYD_DEFAULT,
  BIGA_YEAST_DEFAULT_FRESH,
  BIGA_YEAST_DEFAULT_INSTANT,
  FINAL_HYD_DEFAULT,
  BIGA_PCT_DEFAULT,
  clamp,
  round,
  computeDough,
  computeSchedule,
  buildRecipeText,
  fermentationLevel,
  FERMENTATION_TEXT,
  formatDateTime,
} from '../lib/pizza'

const accent = 'red'

const FERMENTATION_COLOR = {
  'very-short': 'text-red-600',
  short: 'text-yellow-600',
  medium: 'text-green-600',
  long: 'text-green-700',
  'very-long': 'text-blue-600',
  extended: 'text-purple-600',
}

function NumberInput({ label, value, onChange, min, max, step, unit }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step, min, max))}
          className="w-11 h-11 rounded-lg border-2 border-gray-200 bg-gray-50 text-lg font-bold text-gray-700 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value)
            if (!isNaN(n)) onChange(n)
          }}
          onBlur={(e) => {
            const n = parseFloat(e.target.value)
            if (!isNaN(n)) onChange(clamp(n, min, max))
          }}
          className="flex-1 px-2 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-lg text-gray-900 text-sm font-mono text-center focus:outline-none focus:border-red-500"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + step, min, max))}
          className="w-11 h-11 rounded-lg border-2 border-gray-200 bg-gray-50 text-lg font-bold text-gray-700 flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          +
        </button>
        {unit && <span className="text-gray-500 text-sm w-6">{unit}</span>}
      </div>
    </div>
  )
}

export default function Pizza() {
  const [balls, setBalls] = useState(4)
  const [ballW, setBallW] = useState(260)

  const [bigaPct, setBigaPct] = useState(BIGA_PCT_DEFAULT)
  const [bigaTemp, setBigaTemp] = useState(18)
  const [bigaTime, setBigaTime] = useState(12)

  const [finalHyd, setFinalHyd] = useState(FINAL_HYD_DEFAULT)
  const [finalTemp, setFinalTemp] = useState(20)
  const [finalTime, setFinalTime] = useState(10)

  const [useFreshYeast, setUseFreshYeast] = useState(true)

  const [bigaHydFine, setBigaHydFine] = useState('')
  const [bigaYeastFine, setBigaYeastFine] = useState('')
  const [saltFine, setSaltFine] = useState('')

  const [bakeDateTimeStr, setBakeDateTimeStr] = useState('')
  const [copied, setCopied] = useState(false)

  const params = {
    balls, ballW, bigaPct, bigaTemp, bigaTime,
    finalHyd, finalTemp, finalTime, useFreshYeast,
    bigaHydFine, bigaYeastFine, saltFine,
    bakeDateTimeStr,
  }
  const d = computeDough(params)
  const { salt, bigaHyd, bigaYeast, F, Fb, Wb, Yb, Ff, Wf, Sf, bigaEq, finalEq, target } = d
  const schedule = computeSchedule(params, bakeDateTimeStr)

  const bigaLevel = fermentationLevel(bigaEq)
  const finalLevel = fermentationLevel(finalEq)

  const yeastTypeLabel = useFreshYeast ? 'Fresh' : 'Instant'

  function handleCopy() {
    const text = buildRecipeText(params)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <PageContainer>
      <Header icon="🍕" title="Pizza — Biga Bench" accent={accent} />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">

        {/* Batch */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">📦</span> Batch
          </h2>
          <div className="space-y-4">
            <NumberInput label="Pizza balls" value={balls} onChange={setBalls} min={1} max={40} step={1} unit="pcs" />
            <NumberInput label="Ball weight" value={ballW} onChange={setBallW} min={150} max={400} step={10} unit="g" />
            <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center border border-gray-100">
              <span className="text-sm text-gray-500">Target dough weight</span>
              <span className="text-gray-900 font-bold">{round(target)}g</span>
            </div>
          </div>
        </Card>

        {/* Biga */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🫗</span> Biga <span className="text-xs text-gray-400 font-normal">day 1 · no salt</span>
          </h2>
          <div className="space-y-4">
            <NumberInput label="Share of total flour" value={bigaPct} onChange={setBigaPct} min={10} max={100} step={5} unit="%" />
            <NumberInput label="Biga hydration" value={bigaHyd} onChange={(v) => setBigaHydFine(String(v))} min={30} max={80} step={1} unit="%" />
            <NumberInput label="Temperature" value={bigaTemp} onChange={setBigaTemp} min={4} max={30} step={1} unit="°C" />
            <NumberInput label="Time" value={bigaTime} onChange={setBigaTime} min={4} max={48} step={1} unit="h" />
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-500">Fermentation equivalent</span>
                <span className="text-gray-900 font-bold">{round(bigaEq)}h @ 18°C</span>
              </div>
              <p className={`text-xs font-medium ${FERMENTATION_COLOR[bigaLevel]}`}>{FERMENTATION_TEXT[bigaLevel]}</p>
            </div>
          </div>
        </Card>

        {/* Final Dough */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">🫓</span> Final Dough <span className="text-xs text-gray-400 font-normal">day 2</span>
          </h2>
          <div className="space-y-4">
            <NumberInput label="Hydration" value={finalHyd} onChange={setFinalHyd} min={55} max={85} step={1} unit="%" />
            <NumberInput label="Temperature" value={finalTemp} onChange={setFinalTemp} min={4} max={30} step={1} unit="°C" />
            <NumberInput label="Time" value={finalTime} onChange={setFinalTime} min={1} max={72} step={1} unit="h" />
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-500">Fermentation equivalent</span>
                <span className="text-gray-900 font-bold">{round(finalEq)}h @ 18°C</span>
              </div>
              <p className={`text-xs font-medium ${FERMENTATION_COLOR[finalLevel]}`}>{FERMENTATION_TEXT[finalLevel]}</p>
            </div>
          </div>
        </Card>

        {/* Recipe */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">📋</span> Recipe <span className="text-xs text-gray-400 font-normal">{round(F)}g flour</span>
          </h2>

          {/* Yeast toggle */}
          <div className="flex gap-1 bg-gray-200 p-1 rounded-lg mb-4">
            <button
              onClick={() => setUseFreshYeast(true)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                useFreshYeast ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Fresh yeast
            </button>
            <button
              onClick={() => setUseFreshYeast(false)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                !useFreshYeast ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Instant (÷3)
            </button>
          </div>

          {/* Biga table */}
          <div className="mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-400 font-normal text-xs uppercase tracking-wider" colSpan={2}>Biga</th>
                  <th className="text-right py-2 text-gray-400 font-normal text-xs uppercase tracking-wider">g</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-b border-dashed border-gray-200">
                  <td className="py-2 text-gray-600">Flour</td>
                  <td className="py-2 text-gray-400 text-xs">100%</td>
                  <td className="py-2 text-gray-900 text-right font-semibold">{round(Fb)}</td>
                </tr>
                <tr className="border-b border-dashed border-gray-200">
                  <td className="py-2 text-gray-600">Water</td>
                  <td className="py-2 text-gray-400 text-xs">{bigaHyd}%</td>
                  <td className="py-2 text-gray-900 text-right font-semibold">{round(Wb)}</td>
                </tr>
                <tr className="border-b border-dashed border-gray-200">
                  <td className="py-2 text-gray-600">{useFreshYeast ? 'Fresh yeast' : 'Instant yeast'}</td>
                  <td className="py-2 text-gray-400 text-xs">{round(d.yeastPct)}%</td>
                  <td className="py-2 text-gray-900 text-right font-semibold">{round(d.yeastG)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600 font-semibold" colSpan={2}>Biga total</td>
                  <td className="py-2 text-gray-900 text-right font-bold">{round(Fb + Wb + Yb)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Final mix table */}
          <div className="mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-400 font-normal text-xs uppercase tracking-wider" colSpan={2}>Final mix</th>
                  <th className="text-right py-2 text-gray-400 font-normal text-xs uppercase tracking-wider">g</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-b border-dashed border-gray-200">
                  <td className="py-2 text-gray-600">Mature biga</td>
                  <td className="py-2 text-gray-400 text-xs">—</td>
                  <td className="py-2 text-gray-900 text-right font-semibold">{round(Fb + Wb + Yb)}</td>
                </tr>
                <tr className="border-b border-dashed border-gray-200">
                  <td className="py-2 text-gray-600">Flour</td>
                  <td className="py-2 text-gray-400 text-xs">{round(100 - bigaPct)}%</td>
                  <td className="py-2 text-gray-900 text-right font-semibold">{round(Ff)}</td>
                </tr>
                <tr className="border-b border-dashed border-gray-200">
                  <td className="py-2 text-gray-600">Water</td>
                  <td className="py-2 text-gray-400 text-xs">{round(finalHyd - bigaHyd * bigaPct / 100)}%</td>
                  <td className="py-2 text-gray-900 text-right font-semibold">{round(Wf)}</td>
                </tr>
                <tr className="border-b border-dashed border-gray-200">
                  <td className="py-2 text-gray-600">Salt</td>
                  <td className="py-2 text-gray-400 text-xs">{salt}%</td>
                  <td className="py-2 text-gray-900 text-right font-semibold">{round(Sf)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-600 font-semibold" colSpan={2}>{balls} × {ballW}g</td>
                  <td className="py-2 text-gray-900 text-right font-bold">{round(target)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy recipe'}
          </button>
        </Card>

        {/* Variables */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">⚙️</span> Variables
          </h2>
          <div className="space-y-4">
            <NumberInput label="Biga yeast" value={bigaYeast} onChange={(v) => setBigaYeastFine(String(v))} min={0.1} max={5} step={0.05} unit="%" />
            <NumberInput label="Salt" value={salt} onChange={(v) => setSaltFine(String(v))} min={0.5} max={5} step={0.1} unit="%" />
          </div>
        </Card>

        {/* Schedule */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-500" /> Schedule
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">First pizza in the oven</label>
            <input
              type="datetime-local"
              value={bakeDateTimeStr}
              onChange={(e) => setBakeDateTimeStr(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-lg text-gray-900 text-sm font-mono focus:outline-none focus:border-red-500"
            />
          </div>

          {schedule ? (
            <div className="space-y-3">
              <div className="grid grid-cols-[88px_1fr] gap-3 items-start py-2.5 border-b border-dashed border-gray-200">
                <div className="font-mono text-sm font-semibold text-gray-900">
                  {formatDateTime(schedule.bigaMixTime).split(' ')[0]}
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">
                    {schedule.bigaMixTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-900">Mix biga</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    {round(Fb)}g flour · {round(Wb)}g water · {round(d.yeastG)}g {useFreshYeast ? 'fresh yeast' : 'instant yeast'} — crumble, don't knead
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{bigaTime}h at {bigaTemp}°C</div>
                </div>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-3 items-start py-2.5 border-b border-dashed border-gray-200">
                <div className="font-mono text-sm font-semibold text-gray-900">
                  {formatDateTime(schedule.finalMixTime).split(' ')[0]}
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">
                    {schedule.finalMixTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-900">Final mix</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    add {round(Ff)}g flour · {round(Wf)}g water · {round(Sf)}g salt — ball up within 1–2 h
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{finalTime}h at {finalTemp}°C</div>
                </div>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-3 items-start py-2.5">
                <div className="font-mono text-sm font-semibold text-gray-900">
                  {formatDateTime(schedule.bakeTime).split(' ')[0]}
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-normal">
                    {schedule.bakeTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-900">Bake</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    stretch by hand, 60–90 s at 430–480°C
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{balls} pizzas</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">Set a bake date & time to see the schedule</p>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 italic pb-4 font-mono">
          Fermentation rate roughly doubles per 10°C, so each stage is shown as equivalent hours at 18°C.<br />
          Below ~10°C it flatters the real activity. A planning aid, not a verdict — watch the dough.
        </p>
      </div>
    </PageContainer>
  )
}
