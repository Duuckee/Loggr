// Validation tests cover callsigns, reports, frequencies, and duplicates.
import test from 'node:test'
import assert from 'node:assert/strict'
import { findDuplicate, isFrequencyInBand, isValidCallsign, isValidRst, validateContact } from '../src/lib/validation.js'

test('accepts representative amateur callsigns and rejects malformed input', () => {
  assert.equal(isValidCallsign('VK3ABC'), true)
  assert.equal(isValidCallsign('K1ABC/P'), true)
  assert.equal(isValidCallsign('not a call'), false)
  assert.equal(isValidCallsign('ABC'), false)
})

test('validates mode-specific RST reports', () => {
  assert.equal(isValidRst('59', 'SSB'), true)
  assert.equal(isValidRst('599', 'CW'), true)
  assert.equal(isValidRst('599', 'SSB'), false)
})

test('validates that frequency is inside the selected band', () => {
  assert.equal(isFrequencyInBand('14.200', '20m'), true)
  assert.equal(isFrequencyInBand('7.100', '20m'), false)
})

test('returns field-specific errors for invalid contact data', () => {
  const errors = validateContact({ callsign: '', band: '20m', frequency: '7.1', mode: 'SSB', rstSent: '599', rstReceived: '59', lat: 91, lon: 0 })
  assert.deepEqual(Object.keys(errors).sort(), ['callsign', 'frequency', 'lat', 'rstSent'])
})

test('detects same callsign, band and mode inside cooldown window', () => {
  const existing = [{ id: '1', callsign: 'VK3ABC', band: '20m', mode: 'SSB', timestamp: '2026-08-04T00:00:00.000Z' }]
  const candidate = { callsign: 'vk3abc', band: '20m', mode: 'SSB', timestamp: '2026-08-04T00:05:00.000Z' }
  assert.equal(findDuplicate(existing, candidate, 10)?.id, '1')
  assert.equal(findDuplicate(existing, candidate, 2), null)
})
