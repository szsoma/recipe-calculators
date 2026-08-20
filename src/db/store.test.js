import { describe, it, expect } from 'vitest'
import { read, write, remove, isPersistent, NAMESPACE } from './store'

describe('store', () => {
  it('round-trips a value through the namespaced key', () => {
    write('recipes.pizza', [{ id: 'a' }])
    expect(read('recipes.pizza')).toEqual([{ id: 'a' }])
    expect(localStorage.getItem(NAMESPACE + 'recipes.pizza')).toBe('[{"id":"a"}]')
  })

  it('returns null for a missing key', () => {
    expect(read('nothing.here')).toBeNull()
  })

  it('returns null for corrupt JSON instead of throwing', () => {
    localStorage.setItem(NAMESPACE + 'broken', '{not json')
    expect(read('broken')).toBeNull()
  })

  it('removes a value', () => {
    write('temp', 1)
    remove('temp')
    expect(read('temp')).toBeNull()
  })

  it('reports persistence and falls back to memory when storage throws', () => {
    expect(isPersistent()).toBe(true)
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(write('big', 'x')).toBe(false)
    expect(isPersistent()).toBe(false)
    expect(read('big')).toBe('x')
  })

  it('survives localStorage being entirely absent', () => {
    delete globalThis.localStorage
    expect(write('k', 2)).toBe(false)
    expect(read('k')).toBe(2)
  })
})
