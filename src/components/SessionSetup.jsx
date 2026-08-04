import { useState } from 'react'
import ParkSearchInput from './ParkSearchInput'
import Globe from './Globe'
import { PARK_COUNT } from '../data/parks'
import { loadArchivedSessions } from '../lib/storage'

const DEFAULT_LAT = -25.27
const DEFAULT_LON = 133.78

export default function SessionSetup({ onStart }) {
  const [parkRef, setParkRef] = useState('')
  const [selectedPark, setSelectedPark] = useState(null)
  const [operators, setOperators] = useState('')
  const [sessionName, setSessionName] = useState('')
  const [experienceMode, setExperienceMode] = useState('guided')
  const [operatingRole, setOperatingRole] = useState('activator')
  const [error, setError] = useState('')
  const [recentSessions] = useState(() => loadArchivedSessions().slice(0, 3))

  function handleSelect(park) {
    setParkRef(park.reference)
    setSelectedPark(park)
    setError('')
  }

  function handleStart() {
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
    <div className="landing-screen">
      <div className="landing-globe"><Globe homeLat={DEFAULT_LAT} homeLon={DEFAULT_LON} contacts={[]} /></div>
      <main className="landing-overlay">
        <div className="setup-card">
          <div className="brand">LOGGR</div>
          <div className="brand-sub">Offline-ready field contact logging</div>

          <div className="choice-grid" aria-label="Logging experience">
            <button className={experienceMode === 'guided' ? 'choice selected' : 'choice'} onClick={() => setExperienceMode('guided')}>
              <strong>Guided</strong><span>Step-by-step for beginners</span>
            </button>
            <button className={experienceMode === 'normal' ? 'choice selected' : 'choice'} onClick={() => setExperienceMode('normal')}>
              <strong>Normal</strong><span>Fast form for operators</span>
            </button>
          </div>

          <div className="field">
            <label>Home park reference</label>
            <ParkSearchInput
              value={parkRef}
              onChange={(value) => { setParkRef(value); setSelectedPark(null); setError('') }}
              onSelect={handleSelect}
              placeholder={`Search ${PARK_COUNT.toLocaleString()} Australian parks`}
            />
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
              <label>Session name</label>
              <input value={sessionName} onChange={(event) => setSessionName(event.target.value)} placeholder="Saturday activation" />
            </div>
          </div>

          <div className="field">
            <label>Operator callsigns or aliases (comma separated)</label>
            <input value={operators} onChange={(event) => setOperators(event.target.value)} placeholder="VK3ABC, Scout 2" />
            <div className="hint">Use non-identifying aliases for youth operators.</div>
          </div>

          {error && <div className="error-text" role="alert">{error}</div>}
          <button className="btn-primary" onClick={handleStart}>Start session</button>
          <div className="hint">Sessions autosave on this device and continue without internet.</div>
          {recentSessions.length > 0 && <div className="recent-sessions"><div className="recent-title">Recent completed sessions</div>{recentSessions.map((item) => <div className="recent-row" key={item.id}><span>{item.sessionName || item.homePark}</span><span>{item.contacts.length} contacts · {new Date(item.endTime || item.startTime).toLocaleDateString()}</span></div>)}</div>}
        </div>
      </main>
    </div>
  )
}
