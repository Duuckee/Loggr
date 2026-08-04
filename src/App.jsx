import { useCallback, useEffect, useState } from 'react'
import AuthLanding from './components/AuthLanding'
import SessionSetup from './components/SessionSetup'
import Dashboard from './components/Dashboard'
import AddContactModal from './components/AddContactModal'
import SessionSummary from './components/SessionSummary'
import Leaderboard from './components/Leaderboard'
import ProfilePage from './components/ProfilePage'
import { loadMyProfile, signOut } from './lib/auth'
import { archiveSession, claimLegacyStorage, clearActiveSession, loadActiveSession, loadSettings, saveActiveSession, saveSettings } from './lib/storage'
import { supabase, supabaseConfigured } from './lib/supabase'
import { syncSession } from './lib/sync'
import './App.css'

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function LoadingScreen() {
  return <div className="app-loading"><span className="wordmark-mark" aria-hidden="true">L</span><strong>Loading Loggr</strong><span>Restoring your account and local log…</span></div>
}

function App() {
  const [authReady, setAuthReady] = useState(!supabaseConfigured)
  const [authSession, setAuthSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [publicScreen, setPublicScreen] = useState('auth')
  const [loggingSession, setLoggingSession] = useState(null)
  const [screen, setScreen] = useState('setup')
  const [editingContact, setEditingContact] = useState(null)
  const [showAddContact, setShowAddContact] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [syncState, setSyncState] = useState({ status: 'local', message: 'Saved on this device' })
  const [settings, setSettings] = useState(() => loadSettings())
  const [accountError, setAccountError] = useState('')

  const activateAccount = useCallback(async (nextAuthSession) => {
    setAuthSession(nextAuthSession)
    setAccountError('')
    if (!nextAuthSession) {
      setProfile(null)
      setLoggingSession(null)
      setScreen('setup')
      setAuthReady(true)
      return
    }

    const ownerId = nextAuthSession.user.id
    const restored = claimLegacyStorage(ownerId) || loadActiveSession(ownerId)
    setLoggingSession(restored)
    setScreen(restored?.status === 'active' ? 'dashboard' : 'setup')
    try {
      setProfile(await loadMyProfile(ownerId))
    } catch (error) {
      setAccountError(`Your account exists, but its Loggr profile could not be loaded. Apply supabase/schema.sql. ${error.message}`)
    } finally {
      setAuthReady(true)
    }
  }, [])

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return undefined
    supabase.auth.getSession().then(({ data }) => activateAccount(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => activateAccount(nextSession), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [activateAccount])

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    if (!loggingSession || loggingSession.status !== 'active' || !authSession) return undefined
    saveActiveSession(loggingSession, authSession.user.id)
    setSyncState({ status: 'saving', message: 'Saving…' })
    const timer = setTimeout(async () => {
      try {
        setSyncState(await syncSession(loggingSession))
      } catch {
        setSyncState({ status: 'queued', message: 'Cloud sync queued; local copy is safe' })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [loggingSession, online, authSession])

  function navigate(target) {
    if (target === 'setup' && loggingSession?.status === 'active') setScreen('dashboard')
    else setScreen(target)
  }

  function startSession(setupData) {
    const defaultOperator = profile.callsign || profile.username
    const operators = setupData.operators.length > 0 ? setupData.operators : [defaultOperator]
    const next = {
      ...setupData,
      id: createId(),
      ownerId: authSession.user.id,
      activeOperator: operators[0],
      operators,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      contacts: [],
    }
    setLoggingSession(next)
    setScreen('dashboard')
  }

  function addContact(contact) {
    setLoggingSession((previous) => ({ ...previous, contacts: [...previous.contacts, contact] }))
    setShowAddContact(false)
  }

  function updateContact(contact) {
    setLoggingSession((previous) => ({
      ...previous,
      contacts: previous.contacts.map((item) => (item.id === contact.id ? contact : item)),
    }))
    setEditingContact(null)
  }

  function deleteContact(id) {
    setLoggingSession((previous) => ({
      ...previous,
      contacts: previous.contacts.filter((contact) => contact.id !== id),
    }))
  }

  function updateSession(patch) {
    setLoggingSession((previous) => ({ ...previous, ...patch }))
  }

  function endSession() {
    const ended = { ...loggingSession, endTime: new Date().toISOString(), status: 'ended' }
    setLoggingSession(ended)
    archiveSession(ended, authSession.user.id)
    clearActiveSession(authSession.user.id)
    syncSession(ended).catch(() => {})
    setScreen('summary')
  }

  function newSession() {
    clearActiveSession(authSession.user.id)
    setLoggingSession(null)
    setScreen('setup')
  }

  async function handleSignOut() {
    try {
      await signOut()
      setPublicScreen('auth')
    } catch (error) {
      setAccountError(error.message)
    }
  }

  if (!authReady) return <LoadingScreen />

  if (!authSession || !profile) {
    if (publicScreen === 'leaderboard') return <Leaderboard onBack={() => setPublicScreen('auth')} />
    return (
      <>
        <AuthLanding onAuthenticated={activateAccount} onViewLeaderboard={() => setPublicScreen('leaderboard')} />
        {accountError && <div className="fatal-account-error" role="alert">{accountError}</div>}
      </>
    )
  }

  if (screen === 'leaderboard') return <Leaderboard profile={profile} onNavigate={navigate} onSignOut={handleSignOut} />
  if (screen === 'profile') return <ProfilePage profile={profile} onProfileChange={setProfile} onNavigate={navigate} onSignOut={handleSignOut} />
  if (screen === 'setup' || !loggingSession) return <SessionSetup ownerId={authSession.user.id} profile={profile} onStart={startSession} onNavigate={navigate} onSignOut={handleSignOut} />
  if (screen === 'summary') return <SessionSummary session={loggingSession} profile={profile} onNewSession={newSession} onNavigate={navigate} onSignOut={handleSignOut} />

  return (
    <>
      <Dashboard
        session={loggingSession}
        profile={profile}
        online={online}
        syncState={syncState}
        duplicateCooldownMinutes={settings.duplicateCooldownMinutes}
        onDuplicateCooldownChange={(value) => setSettings({ ...settings, duplicateCooldownMinutes: value })}
        onAddContact={() => setShowAddContact(true)}
        onEditContact={setEditingContact}
        onDeleteContact={deleteContact}
        onUpdateSession={updateSession}
        onEndSession={endSession}
        onNavigate={navigate}
        onSignOut={handleSignOut}
      />
      {(showAddContact || editingContact) && (
        <AddContactModal
          contacts={loggingSession.contacts}
          initialContact={editingContact}
          experienceMode={loggingSession.experienceMode}
          operator={loggingSession.activeOperator}
          sessionId={loggingSession.id}
          duplicateCooldownMinutes={settings.duplicateCooldownMinutes}
          onClose={() => {
            setShowAddContact(false)
            setEditingContact(null)
          }}
          onSubmit={editingContact ? updateContact : addContact}
        />
      )}
    </>
  )
}

export default App
