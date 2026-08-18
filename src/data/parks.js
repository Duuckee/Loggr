// Park helpers expose searchable records and common radio-field presets.
import { POTA_AU } from './pota-au.js'

// Real POTA park references, loaded from the Australia (AU) CSV export.
// Format per row: [reference, name, latitude, longitude, locationDesc]
const PARK_INDEX = new Map()
for (const [ref, name, lat, lon, locationDesc] of POTA_AU) {
  PARK_INDEX.set(ref.toUpperCase(), { reference: ref, name, lat, lon, locationDesc })
}

export function lookupPark(ref) {
  return PARK_INDEX.get(ref.trim().toUpperCase()) || null
}

// Lightweight search for autocomplete: matches on reference prefix or name
// substring, case-insensitive. Reference-prefix matches are ranked first.
export function searchParks(query, limit = 8) {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const prefixHits = []
  const nameHits = []
  for (const [ref, name, lat, lon, locationDesc] of POTA_AU) {
    if (ref.toLowerCase().startsWith(q)) {
      prefixHits.push({ reference: ref, name, lat, lon, locationDesc })
      if (prefixHits.length >= limit) break
    }
  }
  if (prefixHits.length < limit) {
    for (const [ref, name, lat, lon, locationDesc] of POTA_AU) {
      if (name.toLowerCase().includes(q) && !ref.toLowerCase().startsWith(q)) {
        nameHits.push({ reference: ref, name, lat, lon, locationDesc })
        if (prefixHits.length + nameHits.length >= limit) break
      }
    }
  }
  return [...prefixHits, ...nameHits]
}

export const PARK_COUNT = POTA_AU.length

// A short list of "their location" presets shown in the Add Contact form —
// these are general world locations for the contacted station, unrelated to
// the POTA park database above.
export const LOCATION_PRESETS = [
  { label: 'Tokyo, JP', lat: 35.68, lon: 139.69 },
  { label: 'Reykjavik, IS', lat: 64.15, lon: -21.94 },
  { label: 'Cape Town, ZA', lat: -33.92, lon: 18.42 },
  { label: 'Vancouver, CA', lat: 49.28, lon: -123.12 },
  { label: 'Auckland, NZ', lat: -36.85, lon: 174.76 },
  { label: 'Lisbon, PT', lat: 38.72, lon: -9.14 },
]

export const BANDS = ['80m', '40m', '20m', '17m', '15m', '10m', '6m', '2m']
export const MODES = ['SSB', 'CW', 'FT8', 'FM']
