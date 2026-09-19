export const SALT_DEFAULT = 2.7
export const BIGA_HYD_DEFAULT = 42
// bigaYeast is always carried on a fresh-yeast basis; the instant conversion
// (÷3) is applied only where an amount is displayed.
export const BIGA_YEAST_DEFAULT = 1
export const FINAL_HYD_DEFAULT = 65
export const BIGA_PCT_DEFAULT = 30
export const POOLISH_YEAST_DEFAULT = 0.1
export const POOLISH_MAIN_YEAST_DEFAULT = 0.5
export const POOLISH_ROOM_TIME_DEFAULT = 1
export const POOLISH_ROOM_TEMP_DEFAULT = 23

export const DEFAULT_PIZZA_PARAMS = {
  balls: 4,
  ballW: 260,
  bigaPct: BIGA_PCT_DEFAULT,
  bigaTemp: 18,
  bigaTime: 12,
  finalHyd: FINAL_HYD_DEFAULT,
  finalTemp: 20,
  finalTime: 10,
  prefermentType: 'biga',
  roomTime: POOLISH_ROOM_TIME_DEFAULT,
  roomTemp: POOLISH_ROOM_TEMP_DEFAULT,
  useFreshYeast: true,
  bigaHydFine: '',
  bigaYeastFine: '',
  poolishMainYeastFine: '',
  saltFine: '',
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

export function round(v) {
  return Math.round(v * 10) / 10
}

export function prefermentDefaults(type) {
  if (type === 'poolish') {
    return {
      balls: 4,
      ballW: 270,
      bigaPct: 40,
      bigaTemp: 23,
      bigaTime: 16,
      bigaYeastFine: '0.1',
      bigaHydFine: '',
      finalHyd: 68,
      finalTemp: 6,
      finalTime: 24,
      roomTemp: POOLISH_ROOM_TEMP_DEFAULT,
      roomTime: POOLISH_ROOM_TIME_DEFAULT,
      poolishMainYeastFine: '0.5',
      saltFine: '2.5',
      useFreshYeast: true,
    }
  }
  return {
    balls: 4,
    ballW: 260,
    bigaPct: BIGA_PCT_DEFAULT,
    bigaTemp: 18,
    bigaTime: 12,
    bigaYeastFine: '',
    bigaHydFine: '',
    finalHyd: FINAL_HYD_DEFAULT,
    finalTemp: 20,
    finalTime: 10,
    roomTemp: POOLISH_ROOM_TEMP_DEFAULT,
    roomTime: POOLISH_ROOM_TIME_DEFAULT,
    poolishMainYeastFine: '0.5',
    saltFine: '',
    useFreshYeast: true,
  }
}

export function resolveParams(params) {
  const salt = params.saltFine !== '' ? parseFloat(params.saltFine) : SALT_DEFAULT
  const bigaHyd = params.bigaHydFine !== '' ? parseFloat(params.bigaHydFine) : BIGA_HYD_DEFAULT
  const bigaYeast =
    params.bigaYeastFine !== ''
      ? parseFloat(params.bigaYeastFine)
      : params.prefermentType === 'poolish'
        ? POOLISH_YEAST_DEFAULT
        : BIGA_YEAST_DEFAULT
  if (params.prefermentType === 'poolish') {
    const poolishMainYeast =
      params.poolishMainYeastFine !== ''
        ? parseFloat(params.poolishMainYeastFine)
        : POOLISH_MAIN_YEAST_DEFAULT
    return { salt, bigaHyd, bigaYeast, poolishMainYeast }
  }
  return { salt, bigaHyd, bigaYeast }
}

// ── Fermentation rate model (study-driven) ───────────────────────────────────
// Birch et al. 2013 shows dough expansion peaks ~25°C and falls at 35°C, while
// CO2 production keeps rising — dough expansion ≠ CO2. So we use a calibrated
// temperature-response curve peaked at 25°C instead of an unbounded Arrhenius
// exponential. Reference is 25°C = 1.0 per the study's shape proposal.
//
// Hydration is a small fermentation modifier (Codină et al. 2011) and a larger
// handling/maturation modifier (Dufour et al. 2024). Salt modestly inhibits
// yeast (Bernklau et al. 2017).
export const REF_TEMP_C = 25
// Keep exported for compat — no longer used internally.
export const ARRHENIUS_B = 8034

// Temperature-rate anchors from the study's proposed shape (± calibration)
// 4°C 0.07 (mid 0.05-0.10), 8°C 0.20, 12°C 0.35, 16°C 0.55, 20°C 0.80, 22°C 0.90, 25°C 1.00, 28°C 1.05, 35°C 1.05 (plateau)
const TEMP_RATE_TABLE = [
  [4, 0.07],
  [8, 0.2],
  [12, 0.35],
  [16, 0.55],
  [20, 0.8],
  [22, 0.9],
  [25, 1.0],
  [28, 1.05],
  [35, 1.05],
]

// Maturation (gluten relaxation / extensibility) follows a flatter curve than
// fermentation — cold still relaxes dough relatively faster than it ferments.
const MATURATION_RATE_TABLE = [
  [4, 0.18],
  [8, 0.3],
  [12, 0.45],
  [16, 0.62],
  [20, 0.83],
  [22, 0.92],
  [25, 1.0],
  [28, 1.05],
  [35, 1.05],
]

function lerpTable(table, temp) {
  if (temp <= table[0][0]) return table[0][1]
  if (temp >= table[table.length - 1][0]) return table[table.length - 1][1]
  for (let i = 0; i < table.length - 1; i++) {
    const [t0, r0] = table[i]
    const [t1, r1] = table[i + 1]
    if (temp >= t0 && temp <= t1) {
      const f = (temp - t0) / (t1 - t0)
      return r0 + f * (r1 - r0)
    }
  }
  return table[table.length - 1][1]
}

export function temperatureRate(temp) {
  return lerpTable(TEMP_RATE_TABLE, temp)
}

export function maturationRate(temp) {
  return lerpTable(MATURATION_RATE_TABLE, temp)
}

// Keep old name as alias (normalized to 25°C reference)
export function relativeRate(temp) {
  return temperatureRate(temp)
}

export function equivalentHours(hours, temp) {
  return hours * temperatureRate(temp)
}

// Hydration fermentation factor: small modifier per study
// 55%→0.94, 60%→0.98, 65%→1.02, 70%→1.06 (linear, extrapolate)
// Reference hydration for biga anchor is BIGA_HYD_DEFAULT (42%) which extrapolates to ~0.836
const HYDRA_FERMENT_TABLE = [
  [55, 0.94],
  [60, 0.98],
  [65, 1.02],
  [70, 1.06],
]

export function fermentationHydrationFactor(hydration) {
  const slope = 0.008 // 0.04 per 5%
  if (hydration <= 55) return 0.94 + (hydration - 55) * slope
  if (hydration >= 70) return 1.06 + (hydration - 70) * slope
  // interpolate within table
  for (let i = 0; i < HYDRA_FERMENT_TABLE.length - 1; i++) {
    const [h0, f0] = HYDRA_FERMENT_TABLE[i]
    const [h1, f1] = HYDRA_FERMENT_TABLE[i + 1]
    if (hydration >= h0 && hydration <= h1) {
      const frac = (hydration - h0) / (h1 - h0)
      return f0 + frac * (f1 - f0)
    }
  }
  return 1.0
}

export function hydrationMaturityFactor(hydration) {
  // Larger handling impact: ~2.5× the fermentation slope
  const ferm = fermentationHydrationFactor(hydration)
  return clamp(1 + (ferm - 1) * 2.5, 0.7, 1.4)
}

export function saltFactor(saltPct) {
  // Salt reference 2.7%. Each +1% salt inhibits fermentation ~9% (study: Bernklau 2017)
  // Clamped to avoid extreme values at unreasonable salt.
  return clamp(1 - 0.09 * (saltPct - SALT_DEFAULT), 0.7, 1.3)
}

// Fermentation exposure: Σ hours × tempRate × hydration × salt (study architecture)
// Kept as "equivalent hours @25°C" for UI comparability.
export function fermentationExposure(hours, temp, hydration, saltPct) {
  const hf = hydration != null ? fermentationHydrationFactor(hydration) : 1
  const sf = saltPct != null ? saltFactor(saltPct) : 1
  return hours * temperatureRate(temp) * hf * sf
}

export function maturationExposure(hours, temp, hydration) {
  const hf = hydration != null ? hydrationMaturityFactor(hydration) : 1
  return hours * maturationRate(temp) * hf
}

// ── Yeast dose model ─────────────────────────────────────────────────────────
// A biga is ripe once its yeast has produced a fixed amount of gas and acid, so
// (yeast × rate × time) stays constant. Rate × time is the fermentation
// exposure, now including hydration and salt. Required dose is inversely
// proportional to exposure.
//
// Anchor remains Giorilli's coded biga: 1% fresh at 18h/18°C, but now
// recalibrated to the new curve and hydration. Anchor hydration is BIGA_HYD_DEFAULT
// (42%) with no salt in the pre-ferment.
export const YEAST_ANCHOR_PCT = 1
// Anchor eq includes hydration factor at 42%: 18 * R(18)*hydra(42)
const ANCHOR_TEMP_RATE = temperatureRate(18)
const ANCHOR_HYDRA = fermentationHydrationFactor(BIGA_HYD_DEFAULT)
export const YEAST_ANCHOR_EQ_HOURS = 18 * ANCHOR_TEMP_RATE * ANCHOR_HYDRA
export const YEAST_MIN_PCT = 0.05
export const YEAST_MAX_PCT = 2

export function suggestedFreshYeast(eqHours) {
  if (!(eqHours > 0)) return null
  const raw = (YEAST_ANCHOR_PCT * YEAST_ANCHOR_EQ_HOURS) / eqHours
  return {
    raw,
    pct: clamp(raw, YEAST_MIN_PCT, YEAST_MAX_PCT),
    belowFloor: raw < YEAST_MIN_PCT,
    aboveCeiling: raw > YEAST_MAX_PCT,
  }
}

export function yeastDoseLevel(actualPct, suggestedPct) {
  if (!(suggestedPct > 0)) return 'ok'
  const ratio = actualPct / suggestedPct
  if (ratio > 1.5) return 'high'
  if (ratio < 0.67) return 'low'
  return 'ok'
}

export const YEAST_DOSE_TEXT = {
  high: 'More yeast than this temperature and time need — the biga may peak early and collapse.',
  ok: 'In step with the biga temperature, time and hydration.',
  low: 'Less yeast than this temperature and time need — the biga may still be under-ripe.',
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

// ── Maturation model ─────────────────────────────────────────────────────────
export const MATURITY_TEXT = {
  'very-short': 'Firm — still resistant',
  short: 'Slightly relaxed',
  medium: 'Balanced — extensible but elastic',
  long: 'Soft — nicely extensible',
  'very-long': 'Very extensible — handle gently',
  extended: 'Over-mature — may lack strength',
}

export function maturationLevel(matHours) {
  if (matHours < 2) return 'very-short'
  if (matHours < 6) return 'short'
  if (matHours < 12) return 'medium'
  if (matHours < 24) return 'long'
  if (matHours < 48) return 'very-long'
  return 'extended'
}

export function doughPrediction(fermLevel, matLevel) {
  // Simple heuristic combining Fermentation and Maturity bands
  const over = (fermLevel === 'very-long' || fermLevel === 'extended') && (matLevel === 'very-long' || matLevel === 'extended')
  const under = fermLevel === 'very-short' || matLevel === 'very-short'
  if (over) return 'May be highly extensible with reduced strength — shorten time or cool down if handling suffers.'
  if (under) return 'Under-mature — expect firmer dough with less extensibility.'
  if (fermLevel === 'long' && matLevel === 'long') return 'Good fermentation level — dough should retain reasonable elasticity.'
  return 'Balanced proof and handling window.'
}

export function computeDough(params) {
  const resolved = resolveParams(params)
  const salt = resolved.salt
  const bigaHyd = resolved.bigaHyd
  let bigaYeast = resolved.bigaYeast
  // Legacy/blank params may lack the new keys; fall back so they can't NaN.
  const roomTime = params.roomTime ?? POOLISH_ROOM_TIME_DEFAULT
  const roomTemp = params.roomTemp ?? POOLISH_ROOM_TEMP_DEFAULT

  const target = params.balls * params.ballW * 1.02

  let F, Fb, Wb, Yb, Ff, Wf, Sf, bigaEq, finalEq
  let bigaMat = 0, finalMat = 0, roomMat = 0, coldMat = 0
  let mainYeastPct = 0
  let mainYeastG = 0
  let roomEq = 0
  let coldEq = 0
  let suggestion = null

  if (params.prefermentType === 'poolish') {
    const mainYeast = resolved.poolishMainYeast
    const p = params.bigaPct / 100
    const yeastFraction = (bigaYeast / 100) * p + (mainYeast / 100) * (1 - p)
    F = target / (1 + params.finalHyd / 100 + salt / 100 + yeastFraction)
    Fb = F * p
    Wb = Fb
    Yb = (Fb * bigaYeast) / 100
    Ff = F - Fb
    Wf = (F * params.finalHyd) / 100 - Wb
    Sf = (F * salt) / 100
    mainYeastPct = mainYeast
    mainYeastG = (Ff * mainYeast) / 100
    // Poolish is 100% hydration, salt-free pre-ferment
    bigaEq = fermentationExposure(params.bigaTime, params.bigaTemp, 100, null)
    bigaMat = maturationExposure(params.bigaTime, params.bigaTemp, 100)
    roomEq = fermentationExposure(roomTime, roomTemp, params.finalHyd, salt)
    roomMat = maturationExposure(roomTime, roomTemp, params.finalHyd)
    coldEq = fermentationExposure(params.finalTime, params.finalTemp, params.finalHyd, salt)
    coldMat = maturationExposure(params.finalTime, params.finalTemp, params.finalHyd)
    finalEq = roomEq + coldEq
    finalMat = roomMat + coldMat
  } else {
    // Biga: hydration matters, salt-free. Final: hydration + salt matter.
    bigaEq = fermentationExposure(params.bigaTime, params.bigaTemp, bigaHyd, null)
    bigaMat = maturationExposure(params.bigaTime, params.bigaTemp, bigaHyd)
    finalEq = fermentationExposure(params.finalTime, params.finalTemp, params.finalHyd, salt)
    finalMat = maturationExposure(params.finalTime, params.finalTemp, params.finalHyd)
    suggestion = suggestedFreshYeast(bigaEq)
    // Yeast is fully dynamic per user request: it recalculates immediately
    // when time / temp / hydration change. The grams in Recipe are always
    // derived from the study model, so the display is live.
    const effectiveYeast = suggestion ? suggestion.pct : BIGA_YEAST_DEFAULT
    bigaYeast = effectiveYeast
    resolved.bigaYeast = effectiveYeast
    F =
      target /
      (1 + params.finalHyd / 100 + salt / 100 + (effectiveYeast / 100) * (params.bigaPct / 100))
    Fb = (F * params.bigaPct) / 100
    Wb = (Fb * bigaHyd) / 100
    Yb = (Fb * effectiveYeast) / 100
    Ff = F - Fb
    Wf = (F * params.finalHyd) / 100 - Wb
    Sf = (F * salt) / 100
  }

  const totalEq = params.prefermentType === 'poolish' ? bigaEq + roomEq + coldEq : bigaEq + finalEq
  const totalMat = params.prefermentType === 'poolish' ? bigaMat + roomMat + coldMat : bigaMat + finalMat

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
    mainYeastPct,
    mainYeastG,
    total:
      params.prefermentType === 'poolish'
        ? Fb + Wb + Yb + Ff + Wf + Sf + mainYeastG
        : Fb + Wb + Yb + Ff + Wf + Sf,
    bigaTotal: Fb + Wb + Yb,
    yeastPct: params.useFreshYeast ? bigaYeast : bigaYeast / 3,
    yeastG: params.useFreshYeast ? Yb : Yb / 3,
    bigaEq,
    finalEq,
    roomEq,
    coldEq,
    totalEq,
    bigaMat,
    finalMat,
    roomMat,
    coldMat,
    totalMat,
    maturityLevel: maturationLevel(totalMat),
    handlingPrediction: doughPrediction(fermentationLevel(totalEq), maturationLevel(totalMat)),
    suggestedYeast: suggestion,
    // Suggestions are quoted on the same basis as the table above them.
    suggestedYeastPct: suggestion
      ? params.useFreshYeast
        ? suggestion.pct
        : suggestion.pct / 3
      : null,
    yeastDose: suggestion ? yeastDoseLevel(bigaYeast, suggestion.pct) : 'ok',
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
  if (params.prefermentType === 'poolish') {
    const roomTime = params.roomTime ?? POOLISH_ROOM_TIME_DEFAULT
    const finalMixTime = addHours(bakeTime, -(params.finalTime + roomTime))
    const poolishMixTime = addHours(finalMixTime, -params.bigaTime)
    return { bakeTime, finalMixTime, poolishMixTime }
  }
  const finalMixTime = addHours(bakeTime, -params.finalTime)
  const bigaMixTime = addHours(finalMixTime, -params.bigaTime)
  return { bakeTime, finalMixTime, bigaMixTime }
}

export function buildRecipeText(params) {
  const d = computeDough(params)
  const schedule = computeSchedule(params, params.bakeDateTimeStr ?? '')
  const yeastTypeLabel = params.useFreshYeast ? 'Fresh' : 'Instant'

  const lines = []

  if (params.prefermentType === 'poolish') {
    const mainYeastG = params.useFreshYeast ? d.mainYeastG : d.mainYeastG / 3
    lines.push(`🍕 Poolish Pizza Recipe`)
    lines.push(`───────────────────`)
    lines.push(`Target: ${params.balls} balls × ${params.ballW}g = ${round(d.target)}g dough`)
    lines.push(`Flour total: ${round(d.F)}g`)
    lines.push(``)
    lines.push(`── Poolish (${params.bigaPct}%) ──`)
    lines.push(`Flour: ${round(d.Fb)}g`)
    lines.push(`Water: ${round(d.Wb)}g (100%)`)
    lines.push(`Yeast (${yeastTypeLabel}): ${round(d.yeastG)}g`)
    lines.push(``)
    lines.push(`── Final Dough ──`)
    lines.push(`Mature poolish: ${round(d.bigaTotal)}g`)
    lines.push(`Flour: ${round(d.Ff)}g`)
    lines.push(`Water: ${round(d.Wf)}g`)
    lines.push(`Salt: ${round(d.Sf)}g`)
    lines.push(`Yeast (${yeastTypeLabel}): ${round(mainYeastG)}g`)
    lines.push(``)
    lines.push(`Total: ${round(d.total)}g`)

    if (schedule) {
      lines.push(``)
      lines.push(`── Schedule ──`)
      lines.push(`Mix poolish: ${formatDateTime(schedule.poolishMixTime)}`)
      lines.push(`Final mix: ${formatDateTime(schedule.finalMixTime)}`)
      lines.push(`Bake: ${formatDateTime(schedule.bakeTime)}`)
    }

    return lines.join('\n')
  }

  lines.push(`🍕 Biga Bench Recipe`)
  lines.push(`─────────────────`)
  lines.push(`Target: ${params.balls} balls × ${params.ballW}g = ${round(d.target)}g dough`)
  lines.push(`Flour total: ${round(d.F)}g`)
  lines.push(``)
  lines.push(`── Biga (${params.bigaPct}%) ──`)
  lines.push(`Flour: ${round(d.Fb)}g`)
  lines.push(`Water: ${round(d.Wb)}g (${d.bigaHyd}%)`)
  lines.push(`Yeast (${yeastTypeLabel}): ${round(d.yeastG)}g`)
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
