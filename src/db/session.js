import { read, write } from './store'

export function loadSession(key, defaults) {
  const stored = read(`session.${key}`)
  if (!stored || typeof stored !== 'object') return defaults
  return { ...defaults, ...stored }
}

export function saveSession(key, state) {
  write(`session.${key}`, state)
}
