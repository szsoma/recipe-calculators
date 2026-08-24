import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PIZZA_PARAMS,
  resolveParams,
  computeDough,
  equivalentHours,
  relativeRate,
  fermentationLevel,
  suggestedFreshYeast,
  yeastDoseLevel,
  YEAST_MAX_PCT,
  YEAST_MIN_PCT,
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

  it('keeps the fresh-yeast basis when the instant toggle is on', () => {
    const r = resolveParams({ ...DEFAULT_PIZZA_PARAMS, useFreshYeast: false })
    expect(r.bigaYeast).toBe(1)
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

  it('reports the total maturation across both stages', () => {
    const d = computeDough(DEFAULT_PIZZA_PARAMS)
    expect(d.totalEq).toBeCloseTo(d.bigaEq + d.finalEq, 10)
  })

  it('quotes the yeast suggestion on the same basis as the displayed dose', () => {
    const fresh = computeDough(DEFAULT_PIZZA_PARAMS)
    const instant = computeDough({ ...DEFAULT_PIZZA_PARAMS, useFreshYeast: false })
    expect(fresh.suggestedYeastPct).toBeCloseTo(fresh.suggestedYeast.pct, 10)
    expect(instant.suggestedYeastPct).toBeCloseTo(instant.suggestedYeast.pct / 3, 10)
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

describe('relativeRate and equivalentHours', () => {
  it('is the identity at the 18C reference', () => {
    expect(relativeRate(18)).toBeCloseTo(1, 10)
    expect(equivalentHours(12, 18)).toBeCloseTo(12, 10)
  })

  it('multiplies the rate by 2.5 per 10C at the reference', () => {
    expect(relativeRate(28) / relativeRate(18)).toBeCloseTo(2.5, 4)
  })

  it('is steeper in the cold and shallower when warm', () => {
    const q10 = (t) => relativeRate(t + 10) / relativeRate(t)
    expect(q10(4)).toBeGreaterThan(q10(18))
    expect(q10(18)).toBeGreaterThan(q10(28))
    expect(q10(4)).toBeCloseTo(2.744, 2)
    expect(q10(28)).toBeCloseTo(2.357, 2)
  })

  it('slows the fridge down far more than a flat Q10 of 2 would', () => {
    // Flat Q10=2 put 24h at 4C at 9.1 equivalent hours, which overstated it.
    expect(equivalentHours(24, 4)).toBeCloseTo(5.954, 2)
  })
})

describe('suggestedFreshYeast', () => {
  it('reproduces the Giorilli anchor: 1% fresh for 18h at 18C', () => {
    const s = suggestedFreshYeast(equivalentHours(18, 18))
    expect(s.pct).toBeCloseTo(1, 6)
    expect(s.belowFloor).toBe(false)
    expect(s.aboveCeiling).toBe(false)
  })

  it('is inversely proportional to the fermentation equivalent', () => {
    expect(suggestedFreshYeast(36).pct).toBeCloseTo(suggestedFreshYeast(18).pct / 2, 10)
  })

  it('calls for less yeast as the biga gets warmer at a fixed time', () => {
    const at = (temp) => suggestedFreshYeast(equivalentHours(18, temp)).pct
    expect(at(22)).toBeLessThan(at(18))
    expect(at(25)).toBeLessThan(at(22))
    // Matches the common summer guidance of dropping to roughly 0.7% fresh.
    expect(at(22)).toBeCloseTo(0.69, 2)
  })

  it('clamps and flags doses that fall outside a weighable range', () => {
    const hot = suggestedFreshYeast(1000)
    expect(hot.pct).toBe(YEAST_MIN_PCT)
    expect(hot.belowFloor).toBe(true)

    const cold = suggestedFreshYeast(2)
    expect(cold.pct).toBe(YEAST_MAX_PCT)
    expect(cold.aboveCeiling).toBe(true)
  })

  it('returns null for a non-positive equivalent', () => {
    expect(suggestedFreshYeast(0)).toBeNull()
  })
})

describe('yeastDoseLevel', () => {
  it('bands the actual dose against the suggestion', () => {
    expect(yeastDoseLevel(1, 1)).toBe('ok')
    expect(yeastDoseLevel(1.6, 1)).toBe('high')
    expect(yeastDoseLevel(0.5, 1)).toBe('low')
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
