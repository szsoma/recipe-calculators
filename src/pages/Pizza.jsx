import { useState } from 'react'
import Header from '../components/Header'
import { Copy, Clock, Check } from 'lucide-react'

const accent = 'red'

const SALT_DEFAULT = 3
const BIGA_HYD_DEFAULT = 55
const BIGA_YEAST_DEFAULT_FRESH = 0.8
const BIGA_YEAST_DEFAULT_INSTANT = 0.3
const FINAL_HYD_DEFAULT = 65
const BIGA_PCT_DEFAULT = 30

function round(v) {
  return Math.round(v * 10) / 10
}

function eq(hours, temp) {
  return hours * Math.pow(2, (temp - 18) / 10)
}

function getFermentationLabel(eqHours) {
  if (eqHours < 2) return { text: 'Very short — minimal flavor development', color: 'text-red-400' }
  if (eqHours < 6) return { text: 'Short — mild fermentation flavor', color: 'text-yellow-400' }
  if (eqHours < 12) return { text: 'Medium — good flavor balance', color: 'text-green-400' }
  if (eqHours < 24) return { text: 'Long — complex, developed flavor', color: 'text-green-300' }
  if (eqHours < 48) return { text: 'Very long — deep, artisan flavor', color: 'text-blue-400' }
  return { text: 'Extended — very deep, sour notes possible', color: 'text-purple-400' }
}

function formatScheduleTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3600000)
}

export default function Pizza() {
  const [balls, setBalls] = useState(4)
  const [ballW, setBallW] = useState(250)

  const [bigaPct, setBigaPct] = useState(BIGA_PCT_DEFAULT)
  const [bigaTemp, setBigaTemp] = useState(18)
  const [bigaTime, setBigaTime] = useState(12)

  const [finalHyd, setFinalHyd] = useState(FINAL_HYD_DEFAULT)
  const [finalTemp, setFinalTemp] = useState(18)
  const [finalTime, setFinalTime] = useState(8)

  const [useFreshYeast, setUseFreshYeast] = useState(true)

  const [bigaHydFine, setBigaHydFine] = useState('')
  const [bigaYeastFine, setBigaYeastFine] = useState('')
  const [saltFine, setSaltFine] = useState('')

  const [bakeTimeStr, setBakeTimeStr] = useState('')
  const [copied, setCopied] = useState(false)

  const salt = saltFine !== '' ? parseFloat(saltFine) : SALT_DEFAULT
  const bigaHyd = bigaHydFine !== '' ? parseFloat(bigaHydFine) : BIGA_HYD_DEFAULT
  const bigaYeast = bigaYeastFine !== ''
    ? parseFloat(bigaYeastFine)
    : useFreshYeast
      ? BIGA_YEAST_DEFAULT_FRESH
      : BIGA_YEAST_DEFAULT_INSTANT

  const target = balls * ballW * 1.02
  const F = target / (1 + finalHyd / 100 + salt / 100 + (bigaYeast / 100) * bigaPct / 100)

  const Fb = F * bigaPct / 100
  const Wb = Fb * bigaHyd / 100
  const Yb = Fb * bigaYeast / 100

  const Ff = F - Fb
  const Wf = F * finalHyd / 100 - Wb
  const Sf = F * salt / 100

  const bigaEq = eq(bigaTime, bigaTemp)
  const finalEq = eq(finalTime, finalTemp)

  const bigaFerm = getFermentationLabel(bigaEq)
  const finalFerm = getFermentationLabel(finalEq)

  const yeastTypeLabel = useFreshYeast ? 'Fresh' : 'Instant'

  let schedule = null
  if (bakeTimeStr) {
    const [h, m] = bakeTimeStr.split(':').map(Number)
    const bakeTime = new Date()
    bakeTime.setHours(h || 0, m || 0, 0, 0)

    const finalMixTime = addHours(bakeTime, -(finalTime))
    const bigaMixTime = addHours(finalMixTime, -(bigaTime))

    schedule = { bakeTime, finalMixTime, bigaMixTime }
  }

  function buildRecipeText() {
    const lines = []
    lines.push(`🍕 Biga Bench Recipe`)
    lines.push(`─────────────────`)
    lines.push(`Target: ${balls} balls × ${ballW}g = ${round(target)}g dough`)
    lines.push(`Flour total: ${round(F)}g`)
    lines.push(``)
    lines.push(`── Biga (${bigaPct}%) ──`)
    lines.push(`Flour: ${round(Fb)}g`)
    lines.push(`Water: ${round(Wb)}g (${bigaHyd}%)`)
    lines.push(`Yeast (${yeastTypeLabel}): ${round(Yb)}g`)
    lines.push(``)
    lines.push(`── Final Dough ──`)
    lines.push(`Flour: ${round(Ff)}g`)
    lines.push(`Water: ${round(Wf)}g`)
    lines.push(`Salt: ${round(Sf)}g`)
    lines.push(``)
    lines.push(`Total: ${round(Fb + Wb + Yb + Ff + Wf + Sf)}g`)

    if (schedule) {
      lines.push(``)
      lines.push(`── Schedule ──`)
      lines.push(`Mix biga: ${formatScheduleTime(schedule.bigaMixTime)}`)
      lines.push(`Final mix: ${formatScheduleTime(schedule.finalMixTime)}`)
      lines.push(`Bake: ${formatScheduleTime(schedule.bakeTime)}`)
    }

    return lines.join('\n')
  }

  function handleCopy() {
    const text = buildRecipeText()
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-[#0D1014] pb-[env(safe-area-inset-bottom)]">
      <Header icon="🍕" title="Pizza — Biga Bench" accent={accent} />

      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">

        {/* Batch */}
        <section className="bg-[#141a22] rounded-2xl p-4 sm:p-6 border border-[#1e2a36]">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-lg">📦</span> Batch
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pizza balls</label>
              <div className="flex items-center gap-3">
                <input type="range" min="1" max="40" value={balls}
                  onChange={(e) => setBalls(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#FF6A2C]" />
                <input type="number" min="1" max="40" value={balls}
                  onChange={(e) => { const n = parseInt(e.target.value, 10); setBalls(isNaN(n) || n < 1 ? 1 : Math.min(n, 40)) }}
                  className="w-16 px-2 py-1.5 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-center text-sm focus:outline-none focus:border-[#FF6A2C]" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ball weight (g)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="150" max="400" step="5" value={ballW}
                  onChange={(e) => setBallW(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#FF6A2C]" />
                <input type="number" min="150" max="400" value={ballW}
                  onChange={(e) => { const n = parseInt(e.target.value, 10); setBallW(isNaN(n) || n < 150 ? 150 : Math.min(n, 400)) }}
                  className="w-16 px-2 py-1.5 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-center text-sm focus:outline-none focus:border-[#FF6A2C]" />
                <span className="text-gray-400 text-sm">g</span>
              </div>
            </div>
            <div className="bg-[#0D1014] rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-gray-400">Target dough weight</span>
              <span className="text-white font-bold">{round(target)}g</span>
            </div>
          </div>
        </section>

        {/* Biga */}
        <section className="bg-[#141a22] rounded-2xl p-4 sm:p-6 border border-[#1e2a36]">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-lg">🫗</span> Biga
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Share of total flour (%)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="10" max="100" value={bigaPct}
                  onChange={(e) => setBigaPct(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#FF6A2C]" />
                <input type="number" min="10" max="100" value={bigaPct}
                  onChange={(e) => { const n = parseInt(e.target.value, 10); setBigaPct(isNaN(n) || n < 10 ? 10 : Math.min(n, 100)) }}
                  className="w-16 px-2 py-1.5 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-center text-sm focus:outline-none focus:border-[#FF6A2C]" />
                <span className="text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Temperature (°C)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="4" max="30" value={bigaTemp}
                  onChange={(e) => setBigaTemp(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#FF6A2C]" />
                <input type="number" min="4" max="30" value={bigaTemp}
                  onChange={(e) => { const n = parseInt(e.target.value, 10); setBigaTemp(isNaN(n) || n < 4 ? 4 : Math.min(n, 30)) }}
                  className="w-16 px-2 py-1.5 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-center text-sm focus:outline-none focus:border-[#FF6A2C]" />
                <span className="text-gray-400 text-sm">°C</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Time (hours)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="4" max="48" value={bigaTime}
                  onChange={(e) => setBigaTime(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#FF6A2C]" />
                <input type="number" min="4" max="48" value={bigaTime}
                  onChange={(e) => { const n = parseInt(e.target.value, 10); setBigaTime(isNaN(n) || n < 4 ? 4 : Math.min(n, 48)) }}
                  className="w-16 px-2 py-1.5 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-center text-sm focus:outline-none focus:border-[#FF6A2C]" />
                <span className="text-gray-400 text-sm">h</span>
              </div>
            </div>
            <div className="bg-[#0D1014] rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">Fermentation equivalent</span>
                <span className="text-white font-bold">{round(bigaEq)}h @ 18°C</span>
              </div>
              <p className={`text-xs ${bigaFerm.color}`}>{bigaFerm.text}</p>
            </div>
          </div>
        </section>

        {/* Final Dough */}
        <section className="bg-[#141a22] rounded-2xl p-4 sm:p-6 border border-[#1e2a36]">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-lg">🫓</span> Final Dough
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Hydration (%)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="55" max="85" value={finalHyd}
                  onChange={(e) => setFinalHyd(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#FF6A2C]" />
                <input type="number" min="55" max="85" value={finalHyd}
                  onChange={(e) => { const n = parseInt(e.target.value, 10); setFinalHyd(isNaN(n) || n < 55 ? 55 : Math.min(n, 85)) }}
                  className="w-16 px-2 py-1.5 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-center text-sm focus:outline-none focus:border-[#FF6A2C]" />
                <span className="text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Temperature (°C)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="4" max="30" value={finalTemp}
                  onChange={(e) => setFinalTemp(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#FF6A2C]" />
                <input type="number" min="4" max="30" value={finalTemp}
                  onChange={(e) => { const n = parseInt(e.target.value, 10); setFinalTemp(isNaN(n) || n < 4 ? 4 : Math.min(n, 30)) }}
                  className="w-16 px-2 py-1.5 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-center text-sm focus:outline-none focus:border-[#FF6A2C]" />
                <span className="text-gray-400 text-sm">°C</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Time (hours)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="1" max="72" value={finalTime}
                  onChange={(e) => setFinalTime(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#FF6A2C]" />
                <input type="number" min="1" max="72" value={finalTime}
                  onChange={(e) => { const n = parseInt(e.target.value, 10); setFinalTime(isNaN(n) || n < 1 ? 1 : Math.min(n, 72)) }}
                  className="w-16 px-2 py-1.5 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-center text-sm focus:outline-none focus:border-[#FF6A2C]" />
                <span className="text-gray-400 text-sm">h</span>
              </div>
            </div>
            <div className="bg-[#0D1014] rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">Fermentation equivalent</span>
                <span className="text-white font-bold">{round(finalEq)}h @ 18°C</span>
              </div>
              <p className={`text-xs ${finalFerm.color}`}>{finalFerm.text}</p>
            </div>
          </div>
        </section>

        {/* Recipe */}
        <section className="bg-[#141a22] rounded-2xl p-4 sm:p-6 border border-[#1e2a36]">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="text-lg">📋</span> Recipe
          </h2>

          {/* Yeast toggle */}
          <div className="flex items-center justify-between p-3 bg-[#0D1014] rounded-lg mb-4">
            <span className="text-sm text-gray-400">Yeast type</span>
            <button
              onClick={() => setUseFreshYeast(!useFreshYeast)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D1014] ${
                useFreshYeast ? 'bg-[#FF6A2C]' : 'bg-gray-600'
              }`}
              role="switch"
              aria-checked={useFreshYeast}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useFreshYeast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-white w-14 text-right">{useFreshYeast ? 'Fresh' : 'Instant'}</span>
          </div>

          {/* Biga table */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Biga</h3>
            <div className="bg-[#0D1014] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2a36]">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">Ingredient</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#1e2a36]">
                    <td className="py-2 px-3 text-white">🌾 Flour</td>
                    <td className="py-2 px-3 text-white text-right font-medium">{round(Fb)}g</td>
                  </tr>
                  <tr className="border-b border-[#1e2a36]">
                    <td className="py-2 px-3 text-white">💧 Water</td>
                    <td className="py-2 px-3 text-white text-right font-medium">{round(Wb)}g</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white">🧬 Yeast ({yeastTypeLabel})</td>
                    <td className="py-2 px-3 text-white text-right font-medium">{round(Yb)}g</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Final mix table */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Final Mix</h3>
            <div className="bg-[#0D1014] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2a36]">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">Ingredient</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#1e2a36]">
                    <td className="py-2 px-3 text-white">🌾 Flour</td>
                    <td className="py-2 px-3 text-white text-right font-medium">{round(Ff)}g</td>
                  </tr>
                  <tr className="border-b border-[#1e2a36]">
                    <td className="py-2 px-3 text-white">💧 Water</td>
                    <td className="py-2 px-3 text-white text-right font-medium">{round(Wf)}g</td>
                  </tr>
                  <tr className="border-b border-[#1e2a36]">
                    <td className="py-2 px-3 text-white">🧂 Salt</td>
                    <td className="py-2 px-3 text-white text-right font-medium">{round(Sf)}g</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white">🫗 Biga (from above)</td>
                    <td className="py-2 px-3 text-[#FF6A2C] text-right font-medium">{round(Fb + Wb + Yb)}g</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Fine-tuning */}
          <details className="mb-4">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">
              Fine-tune baker's percentages...
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Biga hydration (%)</label>
                <input type="number" min="0" max="100" step="0.1" placeholder={BIGA_HYD_DEFAULT}
                  value={bigaHydFine}
                  onChange={(e) => setBigaHydFine(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6A2C]" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Biga yeast (%)</label>
                <input type="number" min="0" max="5" step="0.01"
                  placeholder={useFreshYeast ? BIGA_YEAST_DEFAULT_FRESH : BIGA_YEAST_DEFAULT_INSTANT}
                  value={bigaYeastFine}
                  onChange={(e) => setBigaYeastFine(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6A2C]" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Salt (%)</label>
                <input type="number" min="0" max="10" step="0.1" placeholder={SALT_DEFAULT}
                  value={saltFine}
                  onChange={(e) => setSaltFine(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6A2C]" />
              </div>
            </div>
          </details>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-[#FF6A2C] hover:bg-[#e55a1f] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Recipe'}
          </button>
        </section>

        {/* Schedule */}
        <section className="bg-[#141a22] rounded-2xl p-4 sm:p-6 border border-[#1e2a36]">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FF6A2C]" /> Schedule
          </h2>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Bake time</label>
            <input type="time" value={bakeTimeStr}
              onChange={(e) => setBakeTimeStr(e.target.value)}
              className="w-full px-3 py-2 bg-[#0D1014] border border-[#1e2a36] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF6A2C]" />
          </div>

          {schedule ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF6A2C] flex items-center justify-center text-white text-sm font-bold shrink-0">1</div>
                <div className="flex-1 bg-[#0D1014] rounded-xl p-3">
                  <div className="text-xs text-gray-500">Mix biga</div>
                  <div className="text-white font-semibold">{formatScheduleTime(schedule.bigaMixTime)}</div>
                  <div className="text-xs text-gray-500 mt-1">Combine flour, water, and yeast. Knead briefly.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF6A2C] flex items-center justify-center text-white text-sm font-bold shrink-0">2</div>
                <div className="flex-1 bg-[#0D1014] rounded-xl p-3">
                  <div className="text-xs text-gray-500">Final mix</div>
                  <div className="text-white font-semibold">{formatScheduleTime(schedule.finalMixTime)}</div>
                  <div className="text-xs text-gray-500 mt-1">Add biga + remaining flour, water, salt. Knead until smooth.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF6A2C] flex items-center justify-center text-white text-sm font-bold shrink-0">3</div>
                <div className="flex-1 bg-[#0D1014] rounded-xl p-3">
                  <div className="text-xs text-gray-500">Bake</div>
                  <div className="text-white font-semibold">{formatScheduleTime(schedule.bakeTime)}</div>
                  <div className="text-xs text-gray-500 mt-1">Divide into {balls} balls. Shape, top, and bake.</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">Enter a bake time to see the schedule</p>
          )}
        </section>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 italic pb-4">
          2% buffer included · Equivalence formula: h × 2^((T−18)/10)
        </p>
      </div>
    </div>
  )
}
