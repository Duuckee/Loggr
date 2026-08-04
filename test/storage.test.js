import test from 'node:test'
import assert from 'node:assert/strict'
import { archiveSession, claimLegacyStorage, clearActiveSession, loadActiveSession, loadArchivedSessions, loadSettings, saveActiveSession, saveSettings } from '../src/lib/storage.js'

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

test('keeps active sessions and archives separate for each account', () => {
  installStorage()
  saveActiveSession({ id: 'a', ownerId: 'user-a' }, 'user-a')
  saveActiveSession({ id: 'b', ownerId: 'user-b' }, 'user-b')
  archiveSession({ id: 'archive-a', ownerId: 'user-a', contacts: [] }, 'user-a')
  assert.equal(loadActiveSession('user-a').id, 'a')
  assert.equal(loadActiveSession('user-b').id, 'b')
  assert.equal(loadArchivedSessions('user-a')[0].id, 'archive-a')
  assert.deepEqual(loadArchivedSessions('user-b'), [])
})

test('claims legacy device data into the first signed-in account', () => {
  installStorage()
  global.localStorage.setItem('loggr.active-session.v2', JSON.stringify({ id: 'legacy-session', contacts: [] }))
  global.localStorage.setItem('loggr.archived-sessions.v2', JSON.stringify([{ id: 'legacy-archive', contacts: [] }]))
  const claimed = claimLegacyStorage('new-owner')
  assert.equal(claimed.ownerId, 'new-owner')
  assert.notEqual(claimed.id, 'legacy-session')
  assert.notEqual(loadArchivedSessions('new-owner')[0].id, 'legacy-archive')
  assert.equal(loadArchivedSessions('new-owner')[0].ownerId, 'new-owner')
  assert.equal(global.localStorage.getItem('loggr.active-session.v2'), null)
})
