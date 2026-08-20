import { beforeEach } from 'vitest'

function createFakeStorage() {
  const map = new Map()
  return {
    get length() {
      return map.size
    },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(String(k), String(v))
    },
    removeItem: (k) => {
      map.delete(k)
    },
    clear: () => {
      map.clear()
    },
  }
}

beforeEach(() => {
  globalThis.localStorage = createFakeStorage()
})
