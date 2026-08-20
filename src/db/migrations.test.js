import { describe, it, expect } from 'vitest'
import { migrateRecipe } from './migrations'
import { SCHEMA_VERSION } from './schema'

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
})
