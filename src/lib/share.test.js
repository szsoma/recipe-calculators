import { describe, it, expect } from 'vitest'
import { encodeRecipe, decodeRecipe, buildShareUrl, ShareError } from './share'

const recipe = {
  name: 'Sárga tészta 🍕',
  note: 'long note with ümlaut',
  params: { balls: 4, ballW: 260, finalHyd: 65, saltFine: '3' },
}

describe('share codec', () => {
  it('round-trips a recipe including non-ASCII text', () => {
    const decoded = decodeRecipe(encodeRecipe(recipe))
    expect(decoded.name).toBe(recipe.name)
    expect(decoded.note).toBe(recipe.note)
    expect(decoded.params.balls).toBe(4)
    expect(decoded.params.saltFine).toBe('3')
    expect(decoded.params.bigaPct).toBe(30)
  })

  it('produces a url-safe payload', () => {
    expect(encodeRecipe(recipe)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('builds a share url on the pizza route', () => {
    const url = buildShareUrl(recipe, 'https://example.com')
    expect(url.startsWith('https://example.com/pizza?r=')).toBe(true)
  })

  it('throws ShareError on junk input', () => {
    expect(() => decodeRecipe('!!!!')).toThrow(ShareError)
    expect(() => decodeRecipe('')).toThrow(ShareError)
    expect(() => decodeRecipe(encodeRecipe(recipe).slice(0, 5))).toThrow(ShareError)
  })

  it('throws ShareError on a payload from a newer schema version', () => {
    const payload = encodeRecipe(recipe)
    const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0),
    )))
    json.v = 999
    const bumped = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(json))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(() => decodeRecipe(bumped)).toThrow(ShareError)
  })
})
