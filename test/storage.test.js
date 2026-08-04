import test from 'node:test'
import assert from 'node:assert/strict'
import { archiveSession, clearActiveSession, loadActiveSession, loadArchivedSessions, loadSettings, saveActiveSession, saveSettings } from '../src/lib/storage.js'

function installStorage() {
  const values = new Map()
  global.localStorage = {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

test('active sessions survive storage round trips and can be cleared', () => {
  installStorage()
  const session = { id: 'session-1', contacts: [{ id: 'contact-1' }] }
  assert.equal(saveActiveSession(session), true)
  assert.deepEqual(loadActiveSession(), session)
  clearActiveSession()
  assert.equal(loadActiveSession(), null)
})

test('archives sessions and persists duplicate settings', () => {
  installStorage()
  archiveSession({ id: 'one', contacts: [] })
  archiveSession({ id: 'two', contacts: [] })
  assert.deepEqual(loadArchivedSessions().map((item) => item.id), ['two', 'one'])
  saveSettings({ duplicateCooldownMinutes: 30 })
  assert.equal(loadSettings().duplicateCooldownMinutes, 30)
})

