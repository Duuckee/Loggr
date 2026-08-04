import { isValidCallsign, normaliseCallsign } from './validation'

const CACHE_KEY = 'loggr.callsign-cache.v1'
const MAX_CACHE_AGE_MS = 30 * 24 * 60 * 60 * 1000

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Lookup still succeeds when browser storage is unavailable.
  }
}

export function getCachedCallsign(callsign) {
  const key = normaliseCallsign(callsign)
  const item = readCache()[key]
  if (!item || Date.now() - item.cachedAt > MAX_CACHE_AGE_MS) return null
  return { ...item.data, cached: true }
}

export async function lookupCallsign(callsign) {
  const key = normaliseCallsign(callsign)
  if (!isValidCallsign(key)) throw new Error('Enter a valid callsign before lookup.')

  const cached = getCachedCallsign(key)
  if (cached) return cached
  if (!navigator.onLine) throw new Error('No cached result is available while offline.')

  const response = await fetch(`/api/callsign?callsign=${encodeURIComponent(key)}`, {
    headers: { Accept: 'application/json' },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Callsign lookup is unavailable.')

  const cache = readCache()
  cache[key] = { cachedAt: Date.now(), data: body }
  writeCache(cache)
  return { ...body, cached: false }
}

