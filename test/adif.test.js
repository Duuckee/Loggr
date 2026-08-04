import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAdif } from '../src/lib/adif.js'

test('exports required ADIF and POTA fields', () => {
  const output = buildAdif({
    homePark: 'AU-0001', operators: ['VK3XYZ'],
    contacts: [{ callsign: 'VK3ABC', timestamp: '2026-08-04T01:02:00.000Z', band: '20m', frequency: '14.200', mode: 'SSB', rstSent: '59', rstReceived: '57', park: 'AU-0002', operator: 'VK3XYZ', notes: 'Clear signal' }],
  })
  for (const expected of ['<call:6>VK3ABC', '<qso_date:8>20260804', '<time_on:4>0102', '<band:3>20m', '<freq:9>14.200000', '<rst_sent:2>59', '<rst_rcvd:2>57', '<my_sig_info:7>AU-0001', '<sig_info:7>AU-0002', '<eor>']) {
    assert.match(output, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

