import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PIZZA_PARAMS,
  prefermentDefaults,
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

const POOLISH_PARAMS = {
  ...DEFAULT_PIZZA_PARAMS,
  prefermentType: 'poolish',
  balls: 4,
  ballW: 270,
  bigaPct: 40,
  bigaTemp: 23,
  bigaTime: 16,
  finalHyd: 68,
  finalTemp: 6,
  finalTime: 24,
  roomTemp: 23,
  roomTime: 1,
  saltFine: '2.5',
  bigaYeastFine: '0.1',
  bigaHydFine: '',
  poolishMainYeastFine: '0.5',
  useFreshYeast: true,
}

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

describe('prefermentDefaults', () => {
  it('returns the full poolish patch from the spec', () => {
    expect(prefermentDefaults('poolish')).toEqual({
      balls: 4,
      ballW: 270,
      bigaPct: 40,
      bigaTemp: 23,
      bigaTime: 16,
      bigaYeastFine: '0.1',
      bigaHydFine: '',
      finalHyd: 68,
      finalTemp: 6,
      finalTime: 24,
      roomTemp: 23,
      roomTime: 1,
      poolishMainYeastFine: '0.5',
      saltFine: '2.5',
      useFreshYeast: true,
    })
  })

  it('returns the full biga patch from the spec', () => {
    expect(prefermentDefaults('biga')).toEqual({
      balls: 4,
      ballW: 260,
      bigaPct: 30,
      bigaTemp: 18,
      bigaTime: 12,
      bigaYeastFine: '',
      bigaHydFine: '',
      finalHyd: 65,
      finalTemp: 20,
      finalTime: 10,
      roomTemp: 23,
      roomTime: 1,
      poolishMainYeastFine: '0.5',
      saltFine: '',
      useFreshYeast: true,
    })
  })
})

describe('resolveParams poolish', () => {
  it('uses poolish defaults when no fine overrides are set', () => {
    const r = resolveParams({
      ...POOLISH_PARAMS,
      saltFine: '',
      bigaYeastFine: '',
      poolishMainYeastFine: '',
    })
    expect(r).toEqual({ salt: 2.7, bigaHyd: 42, bigaYeast: 0.1, poolishMainYeast: 0.5 })
  })

  it('prefers fine overrides in poolish mode', () => {
    const r = resolveParams({ ...POOLISH_PARAMS, poolishMainYeastFine: '0.7' })
    expect(r).toEqual({ salt: 2.5, bigaHyd: 42, bigaYeast: 0.1, poolishMainYeast: 0.7 })
  })
})

describe('computeDough poolish', () => {
  it('matches the verified poolish default batch', () => {
    const d = computeDough(POOLISH_PARAMS)
    expect(round(d.target)).toBe(1101.6)
    expect(round(d.F)).toBe(644.8)
    expect(round(d.Fb)).toBe(257.9)
    expect(round(d.Wb)).toBe(257.9)
    expect(round(d.Yb)).toBe(0.3)
    expect(round(d.Ff)).toBe(386.9)
    expect(round(d.Wf)).toBe(180.5)
    expect(round(d.Sf)).toBe(16.1)
    expect(round(d.mainYeastG)).toBe(1.9)
    expect(round(d.total)).toBe(1101.6)
    expect(round(d.bigaEq)).toBe(25.5)
    expect(round(d.roomEq)).toBe(1.6)
    expect(round(d.coldEq)).toBe(7.3)
    expect(round(d.finalEq)).toBe(8.9)
    expect(round(d.totalEq)).toBe(34.4)
  })

  it('sums the components back to the target dough weight', () => {
    const d = computeDough(POOLISH_PARAMS)
    expect(round(d.total)).toBe(round(d.target))
  })

  it('divides only the displayed poolish yeast by three for instant, keeping main yeast fresh', () => {
    const fresh = computeDough(POOLISH_PARAMS)
    const instant = computeDough({ ...POOLISH_PARAMS, useFreshYeast: false })
    expect(instant.mainYeastG).toBeCloseTo(fresh.mainYeastG, 10)
    expect(instant.yeastPct).toBeCloseTo(fresh.bigaYeast / 3, 10)
    expect(instant.yeastG).toBeCloseTo(fresh.Yb / 3, 10)
  })

  it('shows the divided yeast in both recipe tables for instant yeast', () => {
    const text = buildRecipeText({
      ...POOLISH_PARAMS,
      useFreshYeast: false,
      bakeDateTimeStr: '2026-09-14T18:00',
    })
    expect(text).toContain('Yeast (Instant): 0.1g')
    expect(text).toContain('Yeast (Instant): 0.6g')
  })

  it('reports no suggested yeast and an ok dose in poolish mode', () => {
    const d = computeDough(POOLISH_PARAMS)
    expect(d.suggestedYeast).toBeNull()
    expect(d.yeastDose).toBe('ok')
  })

  it('computes without NaN for poolish params missing room time and temp', () => {
    const legacy = { ...POOLISH_PARAMS }
    delete legacy.roomTime
    delete legacy.roomTemp
    const d = computeDough(legacy)
    expect(Number.isFinite(d.roomEq)).toBe(true)
    expect(Number.isFinite(d.coldEq)).toBe(true)
    expect(Number.isFinite(d.totalEq)).toBe(true)
    expect(Number.isNaN(d.total)).toBe(false)
  })

  it('computes without NaN for a biga-shaped legacy object missing the new keys', () => {
    const legacy = { ...DEFAULT_PIZZA_PARAMS }
    delete legacy.prefermentType
    delete legacy.roomTime
    delete legacy.roomTemp
    const d = computeDough(legacy)
    expect(Number.isNaN(d.total)).toBe(false)
    expect(Number.isNaN(d.roomEq)).toBe(false)
    expect(Number.isNaN(d.coldEq)).toBe(false)
  })
})

describe('computeSchedule poolish', () => {
  it('adds the room rest to the final mix offset and walks the poolish back by biga time', () => {
    const s = computeSchedule(POOLISH_PARAMS, '2026-09-14T18:00')
    const hours = (a, b) => (b.getTime() - a.getTime()) / 3600000
    expect(hours(s.finalMixTime, s.bakeTime)).toBe(25)
    expect(hours(s.poolishMixTime, s.finalMixTime)).toBe(16)
    expect(hours(s.poolishMixTime, s.bakeTime)).toBe(41)
  })
})

describe('buildRecipeText poolish', () => {
  it('includes the poolish and final dough tables and the schedule lines', () => {
    const text = buildRecipeText({ ...POOLISH_PARAMS, bakeDateTimeStr: '2026-09-14T18:00' })
    expect(text).toContain('🍕 Poolish Pizza Recipe')
    expect(text).toContain('── Poolish (40%) ──')
    expect(text).toContain('── Final Dough ──')
    expect(text).toContain('Mature poolish: 516.1g')
    expect(text).toContain('Flour: 386.9g')
    expect(text).toContain('Mix poolish:')
    expect(text).toContain('Final mix:')
    expect(text).toContain('Bake:')
  })
})
