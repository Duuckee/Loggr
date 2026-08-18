// API tests exercise callsign-provider parsing and fallback behavior.
import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/callsign.js'

function mockResponse() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this },
    json(value) { this.body = value; return this },
    setHeader(name, value) { this.headers[name] = value },
  }
}

test('callsign API rejects invalid input before contacting a provider', async () => {
  const response = mockResponse()
  await handler({ query: { callsign: 'ABC' } }, response)
  assert.equal(response.statusCode, 400)
  assert.match(response.body.error, /Invalid callsign/)
})

test('callsign API reports missing provider configuration safely', async () => {
  const response = mockResponse()
  await handler({ query: { callsign: 'VK3ABC' } }, response)
  assert.equal(response.statusCode, 503)
  assert.match(response.body.error, /Configure QRZ or HamQTH/)
})
