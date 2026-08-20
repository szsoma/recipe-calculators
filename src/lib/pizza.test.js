import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PIZZA_PARAMS,
  resolveParams,
  computeDough,
  equivalentHours,
  fermentationLevel,
  computeSchedule,
  buildRecipeText,
  clamp,
  round,
} from './pizza'

describe('clamp and round', () => {
  it('clamps to the range', () => {
    expect(clamp(5, 1, 3)).toBe(3)
    expect(clamp(0, 1, 3)).toBe(1)
    expect(clamp(2, 1, 3)).toBe(2)
  })

  it('rounds to one decimal', () => {
    expect(round(1.94285)).toBe(1.9)
    expect(round(17.0485)).toBe(17)
  })
})

describe('resolveParams', () => {
  it('uses defaults when no fine overrides are set', () => {
    const r = resolveParams(DEFAULT_PIZZA_PARAMS)
    expect(r).toEqual({ salt: 2.7, bigaHyd: 42, bigaYeast: 1 })
  })

  it('uses the instant yeast default when fresh yeast is off', () => {
    const r = resolveParams({ ...DEFAULT_PIZZA_PARAMS, useFreshYeast: false })
    expect(r.bigaYeast).toBe(0.3)
  })

  it('prefers fine overrides over defaults', () => {
    const r = resolveParams({
      ...DEFAULT_PIZZA_PARAMS,
      saltFine: '3',
      bigaHydFine: '50',
      bigaYeastFine: '0.8',
    })
    expect(r).toEqual({ salt: 3, bigaHyd: 50, bigaYeast: 0.8 })
  })
})

describe('computeDough', () => {
  it('matches the known default batch', () => {
    const d = computeDough(DEFAULT_PIZZA_PARAMS)
    expect(round(d.target)).toBe(1060.8)
    expect(round(d.F)).toBe(631.4)
    expect(round(d.Fb)).toBe(189.4)
    expect(round(d.Wb)).toBe(79.6)
    expect(round(d.Yb)).toBe(1.9)
    expect(round(d.Ff)).toBe(442)
    expect(round(d.Wf)).toBe(330.9)
    expect(round(d.Sf)).toBe(17)
  })

  it('sums the components back to the target dough weight', () => {
    const d = computeDough(DEFAULT_PIZZA_PARAMS)
    expect(round(d.total)).toBe(round(d.target))
  })

  it('divides the displayed yeast by three for instant yeast', () => {
    const params = { ...DEFAULT_PIZZA_PARAMS, useFreshYeast: false, bigaYeastFine: '1' }
    const d = computeDough(params)
    expect(d.yeastPct).toBeCloseTo(1 / 3, 10)
    expect(d.yeastG).toBeCloseTo(d.Yb / 3, 10)
  })

  it('scales linearly with ball count', () => {
    const one = computeDough({ ...DEFAULT_PIZZA_PARAMS, balls: 1 })
    const four = computeDough({ ...DEFAULT_PIZZA_PARAMS, balls: 4 })
    expect(four.F).toBeCloseTo(one.F * 4, 6)
  })
})

describe('equivalentHours', () => {
  it('is the identity at the 18C reference', () => {
    expect(equivalentHours(12, 18)).toBe(12)
  })

  it('doubles the rate per 10C', () => {
    expect(equivalentHours(10, 28)).toBeCloseTo(20, 10)
    expect(equivalentHours(10, 20)).toBeCloseTo(11.48698355, 6)
    expect(equivalentHours(24, 4)).toBeCloseTo(9.0942994, 6)
  })
})

describe('fermentationLevel', () => {
  it('maps hours to bands at the boundaries', () => {
    expect(fermentationLevel(1.9)).toBe('very-short')
    expect(fermentationLevel(2)).toBe('short')
    expect(fermentationLevel(6)).toBe('medium')
    expect(fermentationLevel(12)).toBe('long')
    expect(fermentationLevel(24)).toBe('very-long')
    expect(fermentationLevel(48)).toBe('extended')
  })
})

describe('computeSchedule', () => {
  it('returns null without a bake time', () => {
    expect(computeSchedule(DEFAULT_PIZZA_PARAMS, '')).toBeNull()
  })

  it('returns null for an unparseable bake time', () => {
    expect(computeSchedule(DEFAULT_PIZZA_PARAMS, 'not-a-date')).toBeNull()
  })

  it('walks back final time then biga time from the bake', () => {
    const s = computeSchedule(
      { ...DEFAULT_PIZZA_PARAMS, bigaTime: 12, finalTime: 10 },
      '2026-08-22T18:00',
    )
    const hours = (a, b) => (b.getTime() - a.getTime()) / 3600000
    expect(hours(s.finalMixTime, s.bakeTime)).toBe(10)
    expect(hours(s.bigaMixTime, s.finalMixTime)).toBe(12)
  })
})

describe('buildRecipeText', () => {
  it('includes the totals and omits the schedule when there is no bake time', () => {
    const text = buildRecipeText(DEFAULT_PIZZA_PARAMS)
    expect(text).toContain('Flour total: 631.4g')
    expect(text).toContain('4 balls')
    expect(text).not.toContain('Schedule')
  })

  it('includes the schedule when a bake time is set', () => {
    const text = buildRecipeText({ ...DEFAULT_PIZZA_PARAMS, bakeDateTimeStr: '2026-08-22T18:00' })
    expect(text).toContain('Schedule')
    expect(text).toContain('Mix biga:')
  })

  it('uses the displayed instant yeast amount', () => {
    const text = buildRecipeText({ ...DEFAULT_PIZZA_PARAMS, useFreshYeast: false, bigaYeastFine: '1' })
    expect(text).toContain('Yeast (Instant): 0.6g')
  })
})
