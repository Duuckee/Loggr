const ACTIVE_SESSION_KEY = 'loggr.active-session.v2'
const ARCHIVED_SESSIONS_KEY = 'loggr.archived-sessions.v2'
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

export function loadActiveSession() {
  return readJson(ACTIVE_SESSION_KEY, null)
}

export function saveActiveSession(session) {
  if (!session) return clearActiveSession()
  return writeJson(ACTIVE_SESSION_KEY, session)
}

export function clearActiveSession() {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY)
    return true
  } catch {
    return false
  }
}

export function archiveSession(session) {
  const archived = readJson(ARCHIVED_SESSIONS_KEY, [])
  const next = [session, ...archived.filter((item) => item.id !== session.id)].slice(0, 25)
  return writeJson(ARCHIVED_SESSIONS_KEY, next)
}

export function loadArchivedSessions() {
  return readJson(ARCHIVED_SESSIONS_KEY, [])
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...readJson(SETTINGS_KEY, {}) }
}

export function saveSettings(settings) {
  return writeJson(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...settings })
}

