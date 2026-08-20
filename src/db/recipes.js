import { read, write } from './store'
import { migrateRecipe } from './migrations'
import { SCHEMA_VERSION, isValidRecipe, normalizeParams, normalizeSourdoughParams } from './schema'

export const STORAGE_KEY = 'recipes.pizza'
export const STORAGE_KEY_SOURDOUGH = 'recipes.sourdough'

function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `r-${Math.random().toString(36).slice(2)}-${performance.now().toString(36)}`
}

function now() {
  return new Date().toISOString()
}

let skipped = 0

export function skippedCount() {
  return skipped
}

function partition() {
  const raw = read(STORAGE_KEY)
  if (!Array.isArray(raw)) return { records: [], preserved: [] }
  const records = []
  const preserved = []
  for (const entry of raw) {
    const migrated = migrateRecipe(entry)
    if (migrated) records.push(migrated)
    else if (entry && typeof entry === 'object') preserved.push(entry)
  }
  return { records, preserved }
}

function readAll() {
  return partition().records
}

// Unreadable entries (corrupt rows, or records written by a newer build) are kept
// byte-for-byte at the end of the array so an older build can never destroy them.
function writeAll(recipes, preserved) {
  write(STORAGE_KEY, [...recipes, ...preserved])
}

export function list() {
  const raw = read(STORAGE_KEY)
  if (!Array.isArray(raw)) {
    skipped = 0
    return []
  }
  const migrated = raw.map(migrateRecipe)
  skipped = migrated.filter((r) => r === null).length
  const records = migrated.filter(Boolean)
  return records.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
}

export function get(id) {
  return readAll().find((r) => r.id === id) ?? null
}

export function save({ id, name, note = '', params }) {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (trimmed === '') throw new Error('Recipe name is required')

  const { records: all, preserved } = partition()
  const existing = id ? all.find((r) => r.id === id) : null
  const timestamp = now()

  const record = {
    id: existing ? existing.id : newId(),
    name: trimmed,
    note: typeof note === 'string' ? note : '',
    createdAt: existing ? existing.createdAt : timestamp,
    updatedAt: timestamp,
    schemaVersion: SCHEMA_VERSION,
    params: normalizeParams(params),
  }

  const next = existing ? all.map((r) => (r.id === record.id ? record : r)) : [...all, record]
  writeAll(next, preserved)
  return record
}

export function remove(id) {
  const { records, preserved } = partition()
  writeAll(
    records.filter((r) => r.id !== id),
    preserved,
  )
}

export function duplicate(id) {
  const source = get(id)
  if (!source) return null
  return save({ name: `${source.name} (copy)`, note: source.note, params: source.params })
}

export function importRecipe(obj) {
  if (!isValidRecipe(obj)) return null
  return save({ name: obj.name, note: obj.note ?? '', params: obj.params })
}

export function listSourdough() {
  const raw = read(STORAGE_KEY_SOURDOUGH)
  if (!Array.isArray(raw)) return []
  return raw
    .filter((r) => isValidRecipe(r))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
}

export function getSourdough(id) {
  const raw = read(STORAGE_KEY_SOURDOUGH)
  if (!Array.isArray(raw)) return null
  return raw.find((r) => r.id === id) ?? null
}

export function saveSourdough({ id, name, note = '', params }) {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (trimmed === '') throw new Error('Recipe name is required')

  const raw = read(STORAGE_KEY_SOURDOUGH)
  const all = Array.isArray(raw) ? raw.filter((r) => isValidRecipe(r)) : []
  const existing = id ? all.find((r) => r.id === id) : null
  const timestamp = new Date().toISOString()

  const record = {
    id: existing ? existing.id : (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `r-${Math.random().toString(36).slice(2)}-${performance.now().toString(36)}`),
    name: trimmed,
    note: typeof note === 'string' ? note : '',
    createdAt: existing ? existing.createdAt : timestamp,
    updatedAt: timestamp,
    schemaVersion: SCHEMA_VERSION,
    params: normalizeSourdoughParams(params),
  }

  const next = existing ? all.map((r) => (r.id === record.id ? record : r)) : [...all, record]
  write(STORAGE_KEY_SOURDOUGH, next)
  return record
}

export function removeSourdough(id) {
  const raw = read(STORAGE_KEY_SOURDOUGH)
  const all = Array.isArray(raw) ? raw.filter((r) => isValidRecipe(r)) : []
  write(
    STORAGE_KEY_SOURDOUGH,
    all.filter((r) => r.id !== id),
  )
}
