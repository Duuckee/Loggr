import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeUsername, passwordByteLength, usernameToAuthEmail, validatePassword, validateUsername } from '../src/lib/identity.js'

test('normalizes valid usernames into a stable account identifier', () => {
  assert.equal(normalizeUsername('  VK3_Loggr  '), 'vk3_loggr')
  assert.equal(validateUsername('vk3_loggr'), '')
  assert.equal(usernameToAuthEmail('VK3_Loggr'), 'vk3_loggr@accounts.loggr.app')
})

test('rejects usernames that are unsafe or ambiguous in URLs and rankings', () => {
  assert.match(validateUsername('ab'), /3–24/)
  assert.match(validateUsername('_operator'), /start and end/)
  assert.match(validateUsername('radio operator'), /letters, numbers/)
})

test('enforces the password length accepted by the account UI', () => {
  assert.match(validatePassword('short'), /at least 8/)
  assert.equal(validatePassword('field-radio-2026'), '')
  assert.equal(passwordByteLength('é'), 2)
  assert.match(validatePassword('x'.repeat(73)), /under 72 bytes/)
})
