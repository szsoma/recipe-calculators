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

// ── Fermentation rate model ──────────────────────────────────────────────────
// Rate follows an Arrhenius law in absolute temperature rather than a fixed Q10.
// ARRHENIUS_B (= Ea/R) is fitted so the rate multiplies by 2.5 per 10 °C at the
// 18 °C reference. Because Arrhenius works on 1/T, the effective Q10 falls out
// steeper in the cold (~2.7 near 4 °C) and shallower when warm (~2.35 at 28 °C),
// which is how real dough behaves — a flat Q10 of 2 badly understates how much
// the fridge slows things down.
export const REF_TEMP_C = 18
export const ARRHENIUS_B = 8034 // Ea/R in kelvin (Ea ≈ 66.8 kJ/mol)

export function relativeRate(temp) {
  return Math.exp(ARRHENIUS_B * (1 / (REF_TEMP_C + 273.15) - 1 / (temp + 273.15)))
}

export function equivalentHours(hours, temp) {
  return hours * relativeRate(temp)
}

// ── Yeast dose model ─────────────────────────────────────────────────────────
// A biga is ripe once its yeast has produced a fixed amount of gas and acid, so
// (yeast × rate × time) is what stays constant. Rate × time is exactly the
// fermentation equivalent, which makes the required dose inversely proportional
// to it: warmer or longer means proportionally less yeast, or the biga blows
// past its peak and collapses.
//
// One anchor pins the whole curve: Giorilli's coded biga, 1% fresh yeast for
// 18 h at 18 °C. That also reproduces the common summer advice of dropping to
// ~0.7% fresh once the room sits in the low twenties.
export const YEAST_ANCHOR_PCT = 1
export const YEAST_ANCHOR_EQ_HOURS = 18
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
  ok: 'In step with the biga temperature and time.',
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

export function computeDough(params) {
  const resolved = resolveParams(params)
  const { salt, bigaHyd, bigaYeast } = resolved
  // Legacy/blank params may lack the new keys; fall back so they can't NaN.
  const roomTime = params.roomTime ?? POOLISH_ROOM_TIME_DEFAULT
  const roomTemp = params.roomTemp ?? POOLISH_ROOM_TEMP_DEFAULT

  const target = params.balls * params.ballW * 1.02

  let F, Fb, Wb, Yb, Ff, Wf, Sf, bigaEq, finalEq
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
    bigaEq = equivalentHours(params.bigaTime, params.bigaTemp)
    roomEq = equivalentHours(roomTime, roomTemp)
    coldEq = equivalentHours(params.finalTime, params.finalTemp)
    finalEq = roomEq + coldEq
  } else {
    F =
      target /
      (1 + params.finalHyd / 100 + salt / 100 + (bigaYeast / 100) * (params.bigaPct / 100))
    Fb = (F * params.bigaPct) / 100
    Wb = (Fb * bigaHyd) / 100
    Yb = (Fb * bigaYeast) / 100
    Ff = F - Fb
    Wf = (F * params.finalHyd) / 100 - Wb
    Sf = (F * salt) / 100
    bigaEq = equivalentHours(params.bigaTime, params.bigaTemp)
    finalEq = equivalentHours(params.finalTime, params.finalTemp)
    // bigaYeast is always held on a fresh-yeast basis; the instant conversion
    // is applied only where the amount is shown.
    suggestion = suggestedFreshYeast(bigaEq)
  }

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
    totalEq: params.prefermentType === 'poolish' ? bigaEq + roomEq + coldEq : bigaEq + finalEq,
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
