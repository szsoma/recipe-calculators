import { describe, it, expect } from 'vitest'
import { list, get, save, remove, duplicate, importRecipe, skippedCount, STORAGE_KEY, saveSourdough } from './recipes'
import { read, write } from './store'
import { SCHEMA_VERSION, normalizeParams } from './schema'

const params = { balls: 6, ballW: 280, finalHyd: 70 }

describe('recipes', () => {
  it('starts empty', () => {
    expect(list()).toEqual([])
  })

  it('saves and reads back a recipe', () => {
    const saved = save({ name: 'Saturday', note: 'caputo blue', params })
    expect(saved.id).toBeTruthy()
    expect(saved.schemaVersion).toBe(SCHEMA_VERSION)
    expect(saved.params.balls).toBe(6)
    expect(saved.params.bigaPct).toBe(30)

    expect(get(saved.id)).toEqual(saved)
    expect(list()).toHaveLength(1)
  })

  it('updates in place and keeps createdAt', () => {
    const first = save({ name: 'Saturday', note: '', params })
    const second = save({ id: first.id, name: 'Sunday', note: 'x', params: { balls: 2 } })
    expect(list()).toHaveLength(1)
    expect(second.createdAt).toBe(first.createdAt)
    expect(get(first.id).name).toBe('Sunday')
    expect(get(first.id).params.balls).toBe(2)
  })

  it('rejects an empty name', () => {
    expect(() => save({ name: '   ', params })).toThrow()
  })

  it('removes a recipe', () => {
    const r = save({ name: 'Gone', params })
    remove(r.id)
    expect(get(r.id)).toBeNull()
    expect(list()).toEqual([])
  })

  it('duplicates with a new id and a copy suffix', () => {
    const r = save({ name: 'Base', note: 'n', params })
    const copy = duplicate(r.id)
    expect(copy.id).not.toBe(r.id)
    expect(copy.name).toBe('Base (copy)')
    expect(copy.note).toBe('n')
    expect(copy.params).toEqual(r.params)
    expect(list()).toHaveLength(2)
  })

  it('returns null when duplicating a missing id', () => {
    expect(duplicate('nope')).toBeNull()
  })

  it('sorts newest updated first', () => {
    const a = save({ name: 'A', params })
    const b = save({ name: 'B', params })
    save({ id: a.id, name: 'A', params })
    expect(list().map((r) => r.name)).toEqual(['A', 'B'])
    expect(b.name).toBe('B')
  })

  it('skips corrupt records instead of failing the whole list, and counts them', () => {
    const good = save({ name: 'Good', params })
    write(STORAGE_KEY, [{ garbage: true }, good, null])
    expect(list().map((r) => r.name)).toEqual(['Good'])
    expect(skippedCount()).toBe(2)
  })

  it('imports a valid external recipe as a new record', () => {
    const imported = importRecipe({ name: 'Shared', note: 'from a link', params })
    expect(imported.id).toBeTruthy()
    expect(list()).toHaveLength(1)
  })

  it('refuses to import junk', () => {
    expect(importRecipe({ nope: 1 })).toBeNull()
    expect(importRecipe(null)).toBeNull()
  })

  it('saves with a stale id generates a fresh id instead of resurrecting the record', () => {
    const first = save({ name: 'Recipe', params })
    const staleId = first.id
    remove(staleId)
    expect(get(staleId)).toBeNull()
    const resurrected = save({ id: staleId, name: 'Resurrected', params })
    expect(resurrected.id).not.toBe(staleId)
    expect(get(staleId)).toBeNull()
    expect(get(resurrected.id)).not.toBeNull()
    expect(list()).toHaveLength(1)
  })

  it('skippedCount reflects only list() calls, not get() or save()', () => {
    const good = save({ name: 'Good', params })
    write(STORAGE_KEY, [{ garbage: true }, good, null])
    list()
    expect(skippedCount()).toBe(2)
    get('any-id')
    expect(skippedCount()).toBe(2)
    save({ name: 'Another', params })
    expect(skippedCount()).toBe(2)
  })

  describe('unreadable entries are preserved, never rewritten', () => {
    const future = {
      id: 'future-1',
      name: 'From a newer build',
      note: '',
      createdAt: '2026-08-20T10:00:00.000Z',
      updatedAt: '2026-08-20T10:00:00.000Z',
      schemaVersion: SCHEMA_VERSION + 1,
      params: { balls: 4, brandNewField: 'x' },
    }
    const corrupt = { garbage: true }

    function seed() {
      const good = save({ name: 'Good', params })
      write(STORAGE_KEY, [future, good, corrupt])
      return good
    }

    function rawEntries() {
      return read(STORAGE_KEY)
    }

    it('survive an unrelated save()', () => {
      seed()
      save({ name: 'Another', params })
      const raw = rawEntries()
      expect(raw).toContainEqual(future)
      expect(raw).toContainEqual(corrupt)
      expect(list().map((r) => r.name).sort()).toEqual(['Another', 'Good'])
      expect(skippedCount()).toBe(2)
    })

    it('survive an overwrite of an existing record', () => {
      const good = seed()
      save({ id: good.id, name: 'Good', params: { ...params, balls: 9 } })
      const raw = rawEntries()
      expect(raw).toContainEqual(future)
      expect(raw).toContainEqual(corrupt)
      expect(get(good.id).params.balls).toBe(9)
    })

    it('survive a remove()', () => {
      const good = seed()
      remove(good.id)
      const raw = rawEntries()
      expect(raw).toContainEqual(future)
      expect(raw).toContainEqual(corrupt)
      expect(list()).toEqual([])
    })

    it('survive a duplicate()', () => {
      const good = seed()
      expect(duplicate(good.id)).not.toBeNull()
      const raw = rawEntries()
      expect(raw).toContainEqual(future)
      expect(raw).toContainEqual(corrupt)
      expect(list()).toHaveLength(2)
    })

    it('survive a whole save/remove round trip', () => {
      seed()
      const extra1 = save({ name: 'Extra', params })
      remove(extra1.id)
      const raw = rawEntries()
      expect(raw).toContainEqual(future)
      expect(raw).toContainEqual(corrupt)
    })
  })

  describe('sourdough param normalization', () => {
    it('defaults breads to 1 for legacy recipes saved without it', () => {
      const saved = saveSourdough({ name: 'Legacy', params: { bakedWeight: 800, hydration: 65 } })
      expect(saved.params.breads).toBe(1)
    })

    it('preserves an explicit bread count', () => {
      const saved = saveSourdough({ name: 'Two loaves', params: { bakedWeight: 800, breads: 2 } })
      expect(saved.params.breads).toBe(2)
    })
  })

  describe('pizza schema param normalization', () => {
    it('fills prefermentType to biga and room defaults when absent', () => {
      const out = normalizeParams({ balls: 4, ballW: 260 })
      expect(out.prefermentType).toBe('biga')
      expect(out.roomTime).toBe(1)
      expect(out.roomTemp).toBe(23)
    })

    it('accepts prefermentType poolish and preserves it', () => {
      expect(normalizeParams({ prefermentType: 'poolish' }).prefermentType).toBe('poolish')
    })

    it('coerces any other or bad string for prefermentType to biga', () => {
      expect(normalizeParams({ prefermentType: 'sourdough' }).prefermentType).toBe('biga')
      expect(normalizeParams({ prefermentType: '' }).prefermentType).toBe('biga')
      expect(normalizeParams({ prefermentType: 'BIGA' }).prefermentType).toBe('biga')
    })

    it('treats poolishMainYeastFine like the other fine keys', () => {
      expect(normalizeParams({ poolishMainYeastFine: undefined }).poolishMainYeastFine).toBe('')
      expect(normalizeParams({ poolishMainYeastFine: null }).poolishMainYeastFine).toBe('')
      expect(normalizeParams({ poolishMainYeastFine: '' }).poolishMainYeastFine).toBe('')
      expect(normalizeParams({ poolishMainYeastFine: 0.5 }).poolishMainYeastFine).toBe('0.5')
      expect(normalizeParams({ poolishMainYeastFine: '0.4' }).poolishMainYeastFine).toBe('0.4')
      expect(normalizeParams({ poolishMainYeastFine: 'lots' }).poolishMainYeastFine).toBe('')
    })

    it('normalizes roomTime and roomTemp as numbers', () => {
      const out = normalizeParams({ roomTime: '1', roomTemp: '23' })
      expect(out.roomTime).toBe(1)
      expect(out.roomTemp).toBe(23)
    })
  })
})
