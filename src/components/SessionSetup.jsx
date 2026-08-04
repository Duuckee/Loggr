import { useState } from 'react'
import AppNavigation from './AppNavigation'
import ParkSearchInput from './ParkSearchInput'
import { PARK_COUNT } from '../data/parks'
import { loadArchivedSessions } from '../lib/storage'

export default function SessionSetup({ ownerId, profile, onStart, onNavigate, onSignOut }) {
  const [parkRef, setParkRef] = useState('')
  const [selectedPark, setSelectedPark] = useState(null)
  const [operators, setOperators] = useState(profile.callsign || profile.username)
  const [sessionName, setSessionName] = useState('')
  const [experienceMode, setExperienceMode] = useState('guided')
  const [operatingRole, setOperatingRole] = useState('activator')
  const [error, setError] = useState('')
  const [recentSessions] = useState(() => loadArchivedSessions(ownerId).slice(0, 4))

  function handleSelect(park) {
    setParkRef(park.reference)
    setSelectedPark(park)
    setError('')
  }

  function handleStart(event) {
    event.preventDefault()
    if (!selectedPark || selectedPark.reference.toUpperCase() !== parkRef.trim().toUpperCase()) {
      setError('Search and select a valid POTA park from the list.')
      return
    }
    onStart({
      homePark: selectedPark.reference,
      homeParkName: selectedPark.name,
      homeLat: selectedPark.lat,
      homeLon: selectedPark.lon,
      operators: operators.split(',').map((item) => item.trim()).filter(Boolean),
      sessionName: sessionName.trim(),
      experienceMode,
      operatingRole,
    })
  }

  return (
    <div className="account-page setup-page">
      <AppNavigation profile={profile} active="setup" onNavigate={onNavigate} onSignOut={onSignOut} />
      <main className="setup-workspace">
        <section className="setup-intro">
          <div className="eyebrow"><span className="status-pulse" /> New logging session</div>
          <h1>Ready for your<br /><span>next activation?</span></h1>
          <p>Set your park and operator once. Loggr will keep every QSO tied to <strong>@{profile.username}</strong> and update your leaderboard total when it syncs.</p>
          <div className="setup-account-summary">
            <span>{(profile.display_name || profile.username).slice(0, 2).toUpperCase()}</span>
            <div><strong>{profile.display_name || profile.username}</strong><small>{profile.callsign || `@${profile.username}`} · {profile.account_type === 'scout_user' ? 'Linked Scout user' : 'Public user'}</small></div>
          </div>
          <div className="setup-facts">
            <div><strong>{PARK_COUNT.toLocaleString()}</strong><span>parks ready</span></div>
            <div><strong>{recentSessions.reduce((total, item) => total + item.contacts.length, 0)}</strong><span>recent QSOs</span></div>
            <div><strong>Offline</strong><span>autosave</span></div>
          </div>
        </section>

        <form className="setup-panel account-setup-panel" onSubmit={handleStart}>
          <div className="setup-panel-header">
            <div><span>Session details</span><h2>Open the logging dashboard</h2></div>
            <span className="setup-step">01 / 01</span>
          </div>

          <div className="choice-grid" aria-label="Logging experience">
            <button type="button" className={experienceMode === 'guided' ? 'choice selected' : 'choice'} onClick={() => setExperienceMode('guided')}>
              <span className="choice-check" aria-hidden="true">{experienceMode === 'guided' ? '✓' : ''}</span>
              <strong>Guided mode</strong><span>Step-by-step help for new operators</span>
            </button>
            <button type="button" className={experienceMode === 'normal' ? 'choice selected' : 'choice'} onClick={() => setExperienceMode('normal')}>
              <span className="choice-check" aria-hidden="true">{experienceMode === 'normal' ? '✓' : ''}</span>
              <strong>Normal mode</strong><span>One fast form for experienced operators</span>
            </button>
          </div>

          <div className="field">
            <label>Home park <span>Required</span></label>
            <ParkSearchInput
              value={parkRef}
              onChange={(value) => { setParkRef(value); setSelectedPark(null); setError('') }}
              onSelect={handleSelect}
              placeholder={`Search ${PARK_COUNT.toLocaleString()} Australian parks`}
            />
            {selectedPark && <div className="selected-park"><span className="mini-dot live" /> {selectedPark.reference} · {selectedPark.name}</div>}
          </div>

          <div className="field-row">
            <div className="field">
              <label>Operating role</label>
              <select value={operatingRole} onChange={(event) => setOperatingRole(event.target.value)}>
                <option value="activator">Activator</option>
                <option value="hunter">Hunter</option>
              </select>
            </div>
            <div className="field">
              <label>Session name <span>Optional</span></label>
              <input value={sessionName} onChange={(event) => setSessionName(event.target.value)} placeholder="Saturday activation" />
            </div>
          </div>

          <div className="field">
            <label>Operator callsigns or aliases <span>Comma separated</span></label>
            <input value={operators} onChange={(event) => setOperators(event.target.value)} placeholder="VK3ABC, Scout 2" />
            <div className="hint">The active operator is saved on each QSO; your signed-in account owns the full session.</div>
          </div>

          {error && <div className="error-text" role="alert">{error}</div>}
          <button className="btn-primary" type="submit">Open logging dashboard <span aria-hidden="true">→</span></button>

          {recentSessions.length > 0 && <div className="recent-sessions"><div className="recent-title">Your recent sessions</div>{recentSessions.map((item) => <div className="recent-row" key={item.id}><span>{item.sessionName || item.homePark}</span><span>{item.contacts.length} QSOs · {new Date(item.endTime || item.startTime).toLocaleDateString()}</span></div>)}</div>}
        </form>
      </main>
    </div>
  )
}
