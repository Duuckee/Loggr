// Local storage keeps active sessions safe offline and scoped to their owner.
const LEGACY_ACTIVE_SESSION_KEY = 'loggr.active-session.v2'
const LEGACY_ARCHIVED_SESSIONS_KEY = 'loggr.archived-sessions.v2'
const ACTIVE_SESSION_KEY = 'loggr.active-session.v3'
const ARCHIVED_SESSIONS_KEY = 'loggr.archived-sessions.v3'
const SETTINGS_KEY = 'loggr.settings.v2'

export const DEFAULT_SETTINGS = {
  duplicateCooldownMinutes: 10,
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function accountKey(base, ownerId) {
  return `${base}:${ownerId || 'device'}`
}

function migrationId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function claimSession(session, ownerId) {
  const sessionId = migrationId()
  return {
    ...session,
    id: sessionId,
    ownerId,
    contacts: (session.contacts || []).map((contact) => ({ ...contact, id: migrationId(), sessionId })),
  }
}

export function loadActiveSession(ownerId) {
  return readJson(accountKey(ACTIVE_SESSION_KEY, ownerId), null)
}

export function saveActiveSession(session, ownerId = session?.ownerId) {
  if (!session) return clearActiveSession(ownerId)
  return writeJson(accountKey(ACTIVE_SESSION_KEY, ownerId), session)
}

export function clearActiveSession(ownerId) {
  try {
    localStorage.removeItem(accountKey(ACTIVE_SESSION_KEY, ownerId))
    return true
  } catch {
    return false
  }
}

export function archiveSession(session, ownerId = session?.ownerId) {
  const key = accountKey(ARCHIVED_SESSIONS_KEY, ownerId)
  const archived = readJson(key, [])
  const next = [session, ...archived.filter((item) => item.id !== session.id)].slice(0, 25)
  return writeJson(key, next)
}

export function loadArchivedSessions(ownerId) {
  return readJson(accountKey(ARCHIVED_SESSIONS_KEY, ownerId), [])
}

export function claimLegacyStorage(ownerId) {
  if (!ownerId) return null
  const activeKey = accountKey(ACTIVE_SESSION_KEY, ownerId)
  let active = readJson(activeKey, null)
  const legacyActive = readJson(LEGACY_ACTIVE_SESSION_KEY, null)
  const legacyArchived = readJson(LEGACY_ARCHIVED_SESSIONS_KEY, [])

  if (!active && legacyActive) {
    active = claimSession(legacyActive, ownerId)
    writeJson(activeKey, active)
  }
  if (legacyArchived.length > 0 && loadArchivedSessions(ownerId).length === 0) {
    writeJson(accountKey(ARCHIVED_SESSIONS_KEY, ownerId), legacyArchived.map((item) => claimSession(item, ownerId)))
  }
  try {
    localStorage.removeItem(LEGACY_ACTIVE_SESSION_KEY)
    localStorage.removeItem(LEGACY_ARCHIVED_SESSIONS_KEY)
  } catch {
    // The claimed account copy is already safe even if old keys cannot be removed.
  }
  return active
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...readJson(SETTINGS_KEY, {}) }
}

export function saveSettings(settings) {
  return writeJson(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...settings })
}
