import { describe, it, expect } from 'vitest'
import { DEFAULT_SOURDOUGH_PARAMS, computeSourdough, buildRecipeText } from './sourdough'

describe('computeSourdough bread count', () => {
  it('defaults to a single loaf', () => {
    const d = computeSourdough({ ...DEFAULT_SOURDOUGH_PARAMS })
    expect(d.totalBaked).toBe(800)
    expect(Math.round(d.doughWeight * 10) / 10).toBe(941.2)
    expect(Math.round(d.perLoafDough * 10) / 10).toBe(941.2)
    expect(Math.round(d.totalFlour * 10) / 10).toBe(563.6)
  })

  it('scales every ingredient by the bread count', () => {
    const one = computeSourdough({ ...DEFAULT_SOURDOUGH_PARAMS, breads: 1 })
    const three = computeSourdough({ ...DEFAULT_SOURDOUGH_PARAMS, breads: 3 })
    expect(three.totalBaked).toBe(2400)
    expect(three.totalFlour).toBeCloseTo(one.totalFlour * 3, 6)
    expect(three.firstFlour).toBeCloseTo(one.firstFlour * 3, 6)
    expect(three.remainingWater).toBeCloseTo(one.remainingWater * 3, 6)
    expect(three.saltG).toBeCloseTo(one.saltG * 3, 6)
    expect(three.motherTbsp).toBeCloseTo(one.motherTbsp * 3, 6)
  })

  it('keeps the per-loaf dough weight independent of the count', () => {
    const d = computeSourdough({ ...DEFAULT_SOURDOUGH_PARAMS, breads: 4 })
    expect(Math.round(d.perLoafDough * 10) / 10).toBe(941.2)
  })
})

describe('buildRecipeText', () => {
  it('states the loaf count and batch totals', () => {
    const text = buildRecipeText({ ...DEFAULT_SOURDOUGH_PARAMS, breads: 2 })
    expect(text).toContain('Target: 2 × 800g baked = 1600g (1882.4g dough)')
    expect(text).toContain('Flour total: 1127.2g')
  })
})
