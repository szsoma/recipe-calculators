import { SCHEMA_VERSION, isValidRecipe, normalizeParams } from '../db/schema'

export const SHARE_PARAM = 'r'

export class ShareError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ShareError'
  }
}

function toBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function encodeRecipe({ name, note = '', params }) {
  const payload = { v: SCHEMA_VERSION, n: name, o: note, p: normalizeParams(params) }
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
}

export function decodeRecipe(payload) {
  if (typeof payload !== 'string' || payload === '') {
    throw new ShareError('Empty recipe link')
  }

  let parsed
  try {
    parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)))
  } catch {
    throw new ShareError('This recipe link is not readable')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ShareError('This recipe link is not readable')
  }
  if (Number(parsed.v) > SCHEMA_VERSION) {
    throw new ShareError('This link was made with a newer version of the app')
  }

  const recipe = { name: parsed.n, note: typeof parsed.o === 'string' ? parsed.o : '', params: parsed.p }
  if (!isValidRecipe(recipe)) {
    throw new ShareError('This recipe link is missing information')
  }

  return { ...recipe, params: normalizeParams(recipe.params) }
}

export function buildShareUrl(recipe, origin) {
  return `${origin}/pizza?${SHARE_PARAM}=${encodeRecipe(recipe)}`
}
