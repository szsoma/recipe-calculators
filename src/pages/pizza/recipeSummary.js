import { resolveParams } from '../../lib/pizza'

export default function recipeSummary(params) {
  const { bigaHyd } = resolveParams(params)
  return `${params.balls} × ${params.ballW} g · ${params.finalHyd}% hydration · ${params.bigaPct}% biga @ ${bigaHyd}%`
}
