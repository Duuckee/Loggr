import { useEffect, useState } from 'react'
import SessionSetup from './components/SessionSetup'
import Dashboard from './components/Dashboard'
import AddContactModal from './components/AddContactModal'
import SessionSummary from './components/SessionSummary'
import { archiveSession, clearActiveSession, loadActiveSession, loadSettings, saveActiveSession, saveSettings } from './lib/storage'
import { syncSession } from './lib/sync'
import './App.css'

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function App() {
  const [session, setSession] = useState(() => loadActiveSession())
  const [screen, setScreen] = useState(() => (loadActiveSession() ? 'dashboard' : 'setup'))
  const [editingContact, setEditingContact] = useState(null)
  const [showAddContact, setShowAddContact] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [syncState, setSyncState] = useState({ status: 'local', message: 'Saved on this device' })
  const [settings, setSettings] = useState(() => loadSettings())

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
    if (!session || session.status !== 'active') return
    saveActiveSession(session)
    setSyncState({ status: 'saving', message: 'Saving…' })
    const timer = setTimeout(async () => {
      try {
        setSyncState(await syncSession(session))
      } catch {
        setSyncState({ status: 'queued', message: 'Cloud sync queued; local copy is safe' })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [session, online])

  function startSession(setupData) {
    const operators = setupData.operators.length > 0 ? setupData.operators : ['Operator 1']
    const next = {
      ...setupData,
      id: createId(),
      activeOperator: operators[0],
      operators,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      contacts: [],
    }
    setSession(next)
    setScreen('dashboard')
  }

  function addContact(contact) {
    setSession((previous) => ({ ...previous, contacts: [...previous.contacts, contact] }))
    setShowAddContact(false)
  }

  function updateContact(contact) {
    setSession((previous) => ({
      ...previous,
      contacts: previous.contacts.map((item) => (item.id === contact.id ? contact : item)),
    }))
    setEditingContact(null)
  }

  function deleteContact(id) {
    setSession((previous) => ({
      ...previous,
      contacts: previous.contacts.filter((contact) => contact.id !== id),
    }))
  }

  function updateSession(patch) {
    setSession((previous) => ({ ...previous, ...patch }))
  }

  function endSession() {
    const ended = { ...session, endTime: new Date().toISOString(), status: 'ended' }
    setSession(ended)
    archiveSession(ended)
    clearActiveSession()
    syncSession(ended).catch(() => {})
    setScreen('summary')
  }

  function newSession() {
    clearActiveSession()
    setSession(null)
    setScreen('setup')
  }

  if (screen === 'setup' || !session) return <SessionSetup onStart={startSession} />
  if (screen === 'summary') return <SessionSummary session={session} onNewSession={newSession} />

  return (
    <>
      <Dashboard
        session={session}
        online={online}
        syncState={syncState}
        duplicateCooldownMinutes={settings.duplicateCooldownMinutes}
        onDuplicateCooldownChange={(value) => setSettings({ ...settings, duplicateCooldownMinutes: value })}
        onAddContact={() => setShowAddContact(true)}
        onEditContact={setEditingContact}
        onDeleteContact={deleteContact}
        onUpdateSession={updateSession}
        onEndSession={endSession}
      />
      {(showAddContact || editingContact) && (
        <AddContactModal
          contacts={session.contacts}
          initialContact={editingContact}
          experienceMode={session.experienceMode}
          operator={session.activeOperator}
          sessionId={session.id}
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
