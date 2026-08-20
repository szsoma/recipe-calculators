import { read, write } from './store'
import { migrateRecipe } from './migrations'
import { SCHEMA_VERSION, isValidRecipe, normalizeParams } from './schema'

export const STORAGE_KEY = 'recipes.pizza'

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

function readAll() {
  const raw = read(STORAGE_KEY)
  if (!Array.isArray(raw)) return []
  const migrated = raw.map(migrateRecipe)
  return migrated.filter(Boolean)
}

function writeAll(recipes) {
  write(STORAGE_KEY, recipes)
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

  const all = readAll()
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
  writeAll(next)
  return record
}

export function remove(id) {
  writeAll(readAll().filter((r) => r.id !== id))
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
