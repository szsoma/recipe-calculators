import { resolveParams } from '../../lib/pizza'

export default function recipeSummary(params) {
  const { bigaHyd } = resolveParams(params)
  const preferment =
    params.prefermentType === 'poolish'
      ? `${params.bigaPct}% poolish`
      : `${params.bigaPct}% biga @ ${bigaHyd}%`
  return `${params.balls} × ${params.ballW} g · ${params.finalHyd}% hydration · ${preferment}`
}