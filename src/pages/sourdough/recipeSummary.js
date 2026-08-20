import { round } from '../../lib/sourdough'

export default function recipeSummary(params) {
  return `${params.bakedWeight}g baked · ${params.hydration}% hydration · ${params.sourdoughPct}% sourdough`
}
