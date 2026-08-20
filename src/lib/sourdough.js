export const BAKING_LOSS = 0.15
export const MOTHER_TBSP_PER_100G = 1

export const DEFAULT_SOURDOUGH_PARAMS = {
  bakedWeight: 800,
  hydration: 65,
  salt: 2,
  sourdoughPct: 20,
  secondFlourPct: 0,
}

export function round(v) {
  return Math.round(v * 10) / 10
}

export function computeSourdough(params) {
  const { bakedWeight, hydration, salt, sourdoughPct, secondFlourPct } = params

  const doughWeight = bakedWeight / (1 - BAKING_LOSS)
  const totalFlour = doughWeight / (1 + hydration / 100 + salt / 100)

  const sourdoughFlour = (totalFlour * sourdoughPct) / 100
  const sourdoughWater = sourdoughFlour
  const motherTbsp = sourdoughFlour / 100 * MOTHER_TBSP_PER_100G

  const secondFlour = (totalFlour * secondFlourPct) / 100
  const firstFlour = totalFlour - secondFlour - sourdoughFlour
  const remainingWater = (totalFlour * hydration) / 100 - sourdoughWater
  const saltG = (totalFlour * salt) / 100

  return {
    doughWeight,
    totalFlour,
    sourdoughFlour,
    sourdoughWater,
    motherTbsp,
    secondFlour,
    firstFlour,
    remainingWater,
    saltG,
    total: firstFlour + secondFlour + sourdoughFlour + remainingWater + sourdoughWater + saltG,
  }
}

export function equivalentHours(hours, temp) {
  return hours * Math.pow(2, (temp - 18) / 10)
}

export const FERMENTATION_TEXT = {
  short: 'Short — mild fermentation flavor',
  medium: 'Medium — good flavor balance',
  long: 'Long — complex, developed flavor',
  'very-long': 'Very long — deep, artisan flavor',
  extended: 'Extended — very deep, sour notes possible',
}

export function fermentationLevel(eqHours) {
  if (eqHours < 6) return 'short'
  if (eqHours < 12) return 'medium'
  if (eqHours < 24) return 'long'
  if (eqHours < 48) return 'very-long'
  return 'extended'
}

export function formatDateTime(date) {
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${time} ${day}`
}

export function buildRecipeText(params) {
  const d = computeSourdough(params)

  const lines = []
  lines.push(`🍞 Sourdough Bread Recipe`)
  lines.push(`─────────────────────────`)
  lines.push(`Target: ${params.bakedWeight}g baked (${round(d.doughWeight)}g dough)`)
  lines.push(`Flour total: ${round(d.totalFlour)}g`)
  lines.push(``)
  lines.push(`── Sourdough (${params.sourdoughPct}%) ──`)
  lines.push(`Flour: ${round(d.sourdoughFlour)}g`)
  lines.push(`Water: ${round(d.sourdoughWater)}g`)
  lines.push(`Mother: ${round(d.motherTbsp)} tbsp`)
  lines.push(`Ferment: 12h`)
  lines.push(``)
  lines.push(`── Main Dough ──`)
  lines.push(`First flour: ${round(d.firstFlour)}g`)
  if (params.secondFlourPct > 0) {
    lines.push(`Second flour: ${round(d.secondFlour)}g`)
  }
  lines.push(`Water: ${round(d.remainingWater)}g`)
  lines.push(`Salt: ${round(d.saltG)}g`)
  lines.push(``)
  lines.push(`Total: ${round(d.total)}g`)

  return lines.join('\n')
}
