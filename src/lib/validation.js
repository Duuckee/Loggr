// Shared validation protects contact entry across inline and editing forms.
import { lookupPark } from '../data/parks.js'

export const BAND_FREQUENCY_RANGES = {
  '80m': [3.5, 4],
  '40m': [7, 7.3],
  '20m': [14, 14.35],
  '17m': [18.068, 18.168],
  '15m': [21, 21.45],
  '10m': [28, 29.7],
  '6m': [50, 54],
  '2m': [144, 148],
}

const CALLSIGN_PATTERN = /^(?=.{3,12}$)(?:[A-Z0-9]{1,3})?[0-9][A-Z0-9]{1,4}(?:\/[A-Z0-9]{1,4})?$/

export function normaliseCallsign(value) {
  return String(value ?? '').trim().toUpperCase()
}

export function isValidCallsign(value) {
  return CALLSIGN_PATTERN.test(normaliseCallsign(value))
}

export function isValidRst(value, mode) {
  const rst = String(value ?? '').trim()
  if (mode === 'SSB' || mode === 'FM') return /^[1-5][1-9]$/.test(rst)
  return /^[1-5][1-9][1-9]$/.test(rst)
}

export function isFrequencyInBand(value, band) {
  if (value === '' || value === null || value === undefined) return true
  const frequency = Number(value)
  const range = BAND_FREQUENCY_RANGES[band]
  return Number.isFinite(frequency) && Boolean(range) && frequency >= range[0] && frequency <= range[1]
}

export function validateContact(contact) {
  const errors = {}
  if (!isValidCallsign(contact.callsign)) {
    errors.callsign = 'Use a valid amateur callsign, for example VK3ABC or VK3ABC/P.'
  }
  if (!BAND_FREQUENCY_RANGES[contact.band]) errors.band = 'Select a supported band.'
  if (!isFrequencyInBand(contact.frequency, contact.band)) {
    errors.frequency = `Frequency must be inside the ${contact.band} amateur band.`
  }
  if (!isValidRst(contact.rstSent, contact.mode)) {
    errors.rstSent = contact.mode === 'SSB' || contact.mode === 'FM' ? 'Use a two-digit report such as 59.' : 'Use a three-digit report such as 599.'
  }
  if (!isValidRst(contact.rstReceived, contact.mode)) {
    errors.rstReceived = contact.mode === 'SSB' || contact.mode === 'FM' ? 'Use a two-digit report such as 59.' : 'Use a three-digit report such as 599.'
  }
  if (contact.lat !== '' && (Number(contact.lat) < -90 || Number(contact.lat) > 90)) {
    errors.lat = 'Latitude must be between -90 and 90.'
  }
  if (contact.lon !== '' && (Number(contact.lon) < -180 || Number(contact.lon) > 180)) {
    errors.lon = 'Longitude must be between -180 and 180.'
  }
  if (contact.park && !lookupPark(contact.park)) {
    errors.park = 'Select an existing POTA park from the search results.'
  }
  return errors
}

export function errorsForGuidedStep(contact, step) {
  // Only block Continue for fields the operator can currently see and fix.
  const stepFields = {
    0: ['callsign'],
    1: ['band', 'frequency', 'rstSent', 'rstReceived'],
    2: ['park', 'lat', 'lon'],
  }
  const visibleFields = stepFields[step] || []
  return Object.fromEntries(Object.entries(validateContact(contact)).filter(([field]) => visibleFields.includes(field)))
}

export function findDuplicate(contacts, candidate, cooldownMinutes, ignoredId = null) {
  const callsign = normaliseCallsign(candidate.callsign)
  const timestamp = new Date(candidate.timestamp).getTime()
  const windowMs = Math.max(0, Number(cooldownMinutes) || 0) * 60 * 1000

  return contacts.find((contact) => {
    if (contact.id === ignoredId || normaliseCallsign(contact.callsign) !== callsign) return false
    if (contact.band !== candidate.band || contact.mode !== candidate.mode) return false
    if (windowMs === 0) return true
    return Math.abs(timestamp - new Date(contact.timestamp).getTime()) <= windowMs
  }) || null
}
