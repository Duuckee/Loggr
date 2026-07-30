import { useState } from 'react'
import SessionSetup from './components/SessionSetup'
import Dashboard from './components/Dashboard'
import AddContactModal from './components/AddContactModal'
import SessionSummary from './components/SessionSummary'
import './App.css'

// Screen states per SRS 8.1 navigation flow:
// setup -> dashboard (+ add-contact popup overlay) -> summary
function App() {
  const [screen, setScreen] = useState('setup')
  const [session, setSession] = useState(null)
  const [showAddContact, setShowAddContact] = useState(false)

  function startSession(setupData) {
    setSession({
      ...setupData,
      startTime: new Date().toISOString(),
      contacts: [],
    })
    setScreen('dashboard')
  }

  function addContact(contact) {
    setSession((prev) => ({ ...prev, contacts: [...prev.contacts, contact] }))
    setShowAddContact(false)
  }

  function endSession() {
    setScreen('summary')
  }

  function newSession() {
    setSession(null)
    setScreen('setup')
  }

  if (screen === 'setup' || !session) {
    return <SessionSetup onStart={startSession} />
  }

  if (screen === 'summary') {
    return <SessionSummary session={session} onNewSession={newSession} />
  }

  return (
    <>
      <Dashboard
        session={session}
        onAddContact={() => setShowAddContact(true)}
        onEndSession={endSession}
      />
      {showAddContact && (
        <AddContactModal onClose={() => setShowAddContact(false)} onSubmit={addContact} />
      )}
    </>
  )
}

export default App
