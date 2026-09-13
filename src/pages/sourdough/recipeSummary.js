export default function recipeSummary(params) {
  const breads = params.breads ?? 1
  return `${breads} × ${params.bakedWeight}g baked · ${params.hydration}% hydration · ${params.sourdoughPct}% sourdough`
}
