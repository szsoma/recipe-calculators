import { DEFAULT_PIZZA_PARAMS } from '../lib/pizza'
import { DEFAULT_SOURDOUGH_PARAMS } from '../lib/sourdough'

export const SCHEMA_VERSION = 1

export const PARAM_KEYS = [
  'balls',
  'ballW',
  'bigaPct',
  'bigaTemp',
  'bigaTime',
  'finalHyd',
  'finalTemp',
  'finalTime',
  'useFreshYeast',
  'bigaHydFine',
  'bigaYeastFine',
  'saltFine',
]

const NUMERIC_KEYS = [
  'balls',
  'ballW',
  'bigaPct',
  'bigaTemp',
  'bigaTime',
  'finalHyd',
  'finalTemp',
  'finalTime',
]

const FINE_KEYS = ['bigaHydFine', 'bigaYeastFine', 'saltFine']

export function normalizeParams(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const out = {}
  for (const key of NUMERIC_KEYS) {
    const n = Number(src[key])
    out[key] = Number.isFinite(n) ? n : DEFAULT_PIZZA_PARAMS[key]
  }
  out.useFreshYeast =
    typeof src.useFreshYeast === 'boolean' ? src.useFreshYeast : DEFAULT_PIZZA_PARAMS.useFreshYeast
  for (const key of FINE_KEYS) {
    const v = src[key]
    if (v === '' || v === null || v === undefined) {
      out[key] = ''
    } else if (Number.isFinite(Number(v))) {
      out[key] = String(v)
    } else {
      out[key] = ''
    }
  }
  return out
}

export const SOURDOUGH_PARAM_KEYS = [
  'bakedWeight',
  'hydration',
  'salt',
  'sourdoughPct',
  'secondFlourPct',
]

const SOURDOUGH_NUMERIC_KEYS = [
  'bakedWeight',
  'hydration',
  'salt',
  'sourdoughPct',
  'secondFlourPct',
]

export function normalizeSourdoughParams(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const out = {}
  for (const key of SOURDOUGH_NUMERIC_KEYS) {
    const n = Number(src[key])
    out[key] = Number.isFinite(n) ? n : DEFAULT_SOURDOUGH_PARAMS[key]
  }
  return out
}

export function isValidRecipe(obj) {
  if (!obj || typeof obj !== 'object') return false
  if (typeof obj.name !== 'string' || obj.name.trim() === '') return false
  if (!obj.params || typeof obj.params !== 'object') return false
  return true
}
