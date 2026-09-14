import { describe, it, expect } from 'vitest'
import recipeSummary from './recipeSummary'

describe('pizza recipeSummary', () => {
  it('describes a biga recipe with its hydration', () => {
    expect(
      recipeSummary({ balls: 4, ballW: 260, finalHyd: 65, bigaPct: 30, prefermentType: 'biga', bigaHydFine: '' }),
    ).toBe('4 × 260 g · 65% hydration · 30% biga @ 42%')
  })

  it('falls back to biga when prefermentType is omitted', () => {
    expect(recipeSummary({ balls: 1, ballW: 300, finalHyd: 70, bigaPct: 25, bigaHydFine: '' })).toBe(
      '1 × 300 g · 70% hydration · 25% biga @ 42%',
    )
  })

  it('describes a poolish recipe without a hydration suffix', () => {
    expect(
      recipeSummary({ balls: 4, ballW: 270, finalHyd: 68, bigaPct: 40, prefermentType: 'poolish' }),
    ).toBe('4 × 270 g · 68% hydration · 40% poolish')
  })
})