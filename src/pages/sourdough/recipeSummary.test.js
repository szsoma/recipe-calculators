import { describe, it, expect } from 'vitest'
import recipeSummary from './recipeSummary'

describe('sourdough recipeSummary', () => {
  it('prefixes the bake with the loaf count', () => {
    expect(recipeSummary({ breads: 2, bakedWeight: 800, hydration: 65, sourdoughPct: 20 })).toBe(
      '2 × 800g baked · 65% hydration · 20% sourdough',
    )
  })

  it('defaults a missing bread count to 1', () => {
    expect(recipeSummary({ bakedWeight: 800, hydration: 65, sourdoughPct: 20 })).toBe(
      '1 × 800g baked · 65% hydration · 20% sourdough',
    )
  })
})
