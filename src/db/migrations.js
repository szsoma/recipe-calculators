import { SCHEMA_VERSION, isValidRecipe, normalizeParams } from './schema'

// Upgrade steps keyed by the version they upgrade FROM.
// When SCHEMA_VERSION becomes 2, add: 1: (r) => ({ ...r, params: { ...r.params, newField: default } })
const STEPS = {}

export function migrateRecipe(record) {
  if (!isValidRecipe(record)) return null

  const declared = record.schemaVersion === undefined ? 1 : Number(record.schemaVersion)
  if (!Number.isFinite(declared)) return null
  let version = declared
  if (version > SCHEMA_VERSION) return null

  let out = record
  while (version < SCHEMA_VERSION) {
    const step = STEPS[version]
    if (!step) return null
    out = step(out)
    version += 1
  }

  return {
    id: String(out.id),
    name: String(out.name).trim(),
    note: typeof out.note === 'string' ? out.note : '',
    createdAt: typeof out.createdAt === 'string' ? out.createdAt : new Date().toISOString(),
    updatedAt: typeof out.updatedAt === 'string' ? out.updatedAt : new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    params: normalizeParams(out.params),
  }
}
