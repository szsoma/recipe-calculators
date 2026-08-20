export const NAMESPACE = 'rc.v1.'

const memory = new Map()
let persistent = true

export function clearMemory() {
  memory.clear()
}

function backend() {
  try {
    const s = globalThis.localStorage
    if (!s) return null
    return s
  } catch {
    return null
  }
}

export function isPersistent() {
  return persistent
}

export function read(key) {
  const full = NAMESPACE + key
  const s = backend()
  let raw = null
  if (s) {
    try {
      raw = s.getItem(full)
    } catch {
      raw = null
    }
  }
  if (raw === null) {
    return memory.has(full) ? memory.get(full) : null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function write(key, value) {
  const full = NAMESPACE + key
  memory.set(full, value)
  const s = backend()
  if (!s) {
    persistent = false
    return false
  }
  try {
    s.setItem(full, JSON.stringify(value))
    return true
  } catch {
    persistent = false
    return false
  }
}

export function remove(key) {
  const full = NAMESPACE + key
  memory.delete(full)
  const s = backend()
  if (!s) return
  try {
    s.removeItem(full)
  } catch {
    /* nothing to do */
  }
}
