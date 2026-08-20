export const SALT_DEFAULT = 2.7
export const BIGA_HYD_DEFAULT = 42
export const BIGA_YEAST_DEFAULT_FRESH = 1
export const BIGA_YEAST_DEFAULT_INSTANT = 0.3
export const FINAL_HYD_DEFAULT = 65
export const BIGA_PCT_DEFAULT = 30

export const DEFAULT_PIZZA_PARAMS = {
  balls: 4,
  ballW: 260,
  bigaPct: BIGA_PCT_DEFAULT,
  bigaTemp: 18,
  bigaTime: 12,
  finalHyd: FINAL_HYD_DEFAULT,
  finalTemp: 20,
  finalTime: 10,
  useFreshYeast: true,
  bigaHydFine: '',
  bigaYeastFine: '',
  saltFine: '',
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

export function round(v) {
  return Math.round(v * 10) / 10
}

export function resolveParams(params) {
  const salt = params.saltFine !== '' ? parseFloat(params.saltFine) : SALT_DEFAULT
  const bigaHyd = params.bigaHydFine !== '' ? parseFloat(params.bigaHydFine) : BIGA_HYD_DEFAULT
  const bigaYeast =
    params.bigaYeastFine !== ''
      ? parseFloat(params.bigaYeastFine)
      : params.useFreshYeast
        ? BIGA_YEAST_DEFAULT_FRESH
        : BIGA_YEAST_DEFAULT_INSTANT
  return { salt, bigaHyd, bigaYeast }
}

export function equivalentHours(hours, temp) {
  return hours * Math.pow(2, (temp - 18) / 10)
}

export const FERMENTATION_TEXT = {
  'very-short': 'Very short — minimal flavor development',
  short: 'Short — mild fermentation flavor',
  medium: 'Medium — good flavor balance',
  long: 'Long — complex, developed flavor',
  'very-long': 'Very long — deep, artisan flavor',
  extended: 'Extended — very deep, sour notes possible',
}

export function fermentationLevel(eqHours) {
  if (eqHours < 2) return 'very-short'
  if (eqHours < 6) return 'short'
  if (eqHours < 12) return 'medium'
  if (eqHours < 24) return 'long'
  if (eqHours < 48) return 'very-long'
  return 'extended'
}

export function computeDough(params) {
  const { salt, bigaHyd, bigaYeast } = resolveParams(params)

  const target = params.balls * params.ballW * 1.02
  const F =
    target /
    (1 + params.finalHyd / 100 + salt / 100 + (bigaYeast / 100) * (params.bigaPct / 100))

  const Fb = (F * params.bigaPct) / 100
  const Wb = (Fb * bigaHyd) / 100
  const Yb = (Fb * bigaYeast) / 100

  const Ff = F - Fb
  const Wf = (F * params.finalHyd) / 100 - Wb
  const Sf = (F * salt) / 100

  return {
    salt,
    bigaHyd,
    bigaYeast,
    target,
    F,
    Fb,
    Wb,
    Yb,
    Ff,
    Wf,
    Sf,
    total: Fb + Wb + Yb + Ff + Wf + Sf,
    bigaTotal: Fb + Wb + Yb,
    yeastPct: params.useFreshYeast ? bigaYeast : bigaYeast / 3,
    yeastG: params.useFreshYeast ? Yb : Yb / 3,
    bigaEq: equivalentHours(params.bigaTime, params.bigaTemp),
    finalEq: equivalentHours(params.finalTime, params.finalTemp),
  }
}

export function formatDateTime(date) {
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${time} ${day}`
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3600000)
}

export function computeSchedule(params, bakeDateTimeStr) {
  if (!bakeDateTimeStr) return null
  const bakeTime = new Date(bakeDateTimeStr)
  if (isNaN(bakeTime.getTime())) return null
  const finalMixTime = addHours(bakeTime, -params.finalTime)
  const bigaMixTime = addHours(finalMixTime, -params.bigaTime)
  return { bakeTime, finalMixTime, bigaMixTime }
}

export function buildRecipeText(params) {
  const d = computeDough(params)
  const schedule = computeSchedule(params, params.bakeDateTimeStr ?? '')
  const yeastTypeLabel = params.useFreshYeast ? 'Fresh' : 'Instant'

  const lines = []
  lines.push(`🍕 Biga Bench Recipe`)
  lines.push(`─────────────────`)
  lines.push(`Target: ${params.balls} balls × ${params.ballW}g = ${round(d.target)}g dough`)
  lines.push(`Flour total: ${round(d.F)}g`)
  lines.push(``)
  lines.push(`── Biga (${params.bigaPct}%) ──`)
  lines.push(`Flour: ${round(d.Fb)}g`)
  lines.push(`Water: ${round(d.Wb)}g (${d.bigaHyd}%)`)
  lines.push(`Yeast (${yeastTypeLabel}): ${round(d.Yb)}g`)
  lines.push(``)
  lines.push(`── Final Dough ──`)
  lines.push(`Flour: ${round(d.Ff)}g`)
  lines.push(`Water: ${round(d.Wf)}g`)
  lines.push(`Salt: ${round(d.Sf)}g`)
  lines.push(``)
  lines.push(`Total: ${round(d.total)}g`)

  if (schedule) {
    lines.push(``)
    lines.push(`── Schedule ──`)
    lines.push(`Mix biga: ${formatDateTime(schedule.bigaMixTime)}`)
    lines.push(`Final mix: ${formatDateTime(schedule.finalMixTime)}`)
    lines.push(`Bake: ${formatDateTime(schedule.bakeTime)}`)
  }

  return lines.join('\n')
}
