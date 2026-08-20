import { describe, it, expect } from 'vitest'
import { migrateRecipe } from './migrations'
import { SCHEMA_VERSION, PARAM_KEYS } from './schema'
import { DEFAULT_PIZZA_PARAMS } from '../lib/pizza'

const valid = {
  id: 'r1',
  name: 'Saturday',
  note: '',
  createdAt: '2026-08-20T10:00:00.000Z',
  updatedAt: '2026-08-20T10:00:00.000Z',
  schemaVersion: SCHEMA_VERSION,
  params: { balls: 4, ballW: 260, bigaPct: 30 },
}

describe('migrateRecipe', () => {
  it('passes a current-version record through with normalised params', () => {
    const r = migrateRecipe(valid)
    expect(r.id).toBe('r1')
    expect(r.schemaVersion).toBe(SCHEMA_VERSION)
    expect(r.params.finalHyd).toBe(65)
    expect(r.params.saltFine).toBe('')
  })

  it('rejects a record from a newer schema version', () => {
    expect(migrateRecipe({ ...valid, schemaVersion: SCHEMA_VERSION + 1 })).toBeNull()
  })

  it('rejects a structurally invalid record', () => {
    expect(migrateRecipe({ ...valid, name: '   ' })).toBeNull()
    expect(migrateRecipe(null)).toBeNull()
    expect(migrateRecipe({ ...valid, params: undefined })).toBeNull()
  })

  it('treats a missing schemaVersion as version 1', () => {
    const { schemaVersion, ...noVersion } = valid
    expect(migrateRecipe(noVersion).schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('fills in missing metadata', () => {
    const { note, ...noNote } = valid
    expect(migrateRecipe(noNote).note).toBe('')
  })

  it('rejects a newer schema version supplied as a string', () => {
    expect(migrateRecipe({ ...valid, schemaVersion: String(SCHEMA_VERSION + 1) })).toBeNull()
  })

  it('coerces wrong-typed numeric params', () => {
    const r = migrateRecipe({ ...valid, params: { ...valid.params, ballW: '260', balls: '3' } })
    expect(r.params.ballW).toBe(260)
    expect(r.params.balls).toBe(3)
  })

  it('normalises every one of the twelve param keys', () => {
    const r = migrateRecipe({ ...valid, params: {} })
    expect(Object.keys(r.params).sort()).toEqual([...PARAM_KEYS].sort())
    expect(PARAM_KEYS).toHaveLength(12)
    for (const key of PARAM_KEYS) {
      expect(r.params[key]).toBe(DEFAULT_PIZZA_PARAMS[key] ?? '')
    }
  })
})
