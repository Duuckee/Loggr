import { useState } from 'react'
import ParkSearchInput from './ParkSearchInput'
import { PARK_COUNT } from '../data/parks'
import { loadArchivedSessions } from '../lib/storage'

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

  function scrollToSetup() {
    document.getElementById('start-session')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="wordmark" href="#top" aria-label="Loggr home">
          <span className="wordmark-mark" aria-hidden="true">L</span>
          <span>LOGGR</span>
        </a>
        <div className="landing-nav-links">
          <a href="#workflow">How it works</a>
        </div>
        <button className="btn-nav" onClick={scrollToSetup}>Start logging</button>
      </nav>

      <main>
        <section className="hero" id="top">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-pulse" /> Built for field operators</div>
            <h1>Log the contact.<br /><span>See the connection.</span></h1>
            <p className="hero-lede">A fast, offline-ready POTA logger that turns every contact into a live map of your activation—without getting between you and the radio.</p>
            <div className="hero-proof" aria-label="Product capabilities">
              <div><strong>{PARK_COUNT.toLocaleString()}</strong><span>Australian parks</span></div>
              <div><strong>Offline</strong><span>Field-ready saving</span></div>
              <div><strong>ADIF</strong><span>Standards export</span></div>
            </div>
            <a className="text-link" href="#workflow">See how Loggr works <span aria-hidden="true">↓</span></a>
          </div>

          <div className="setup-panel" id="start-session">
            <div className="setup-panel-header">
              <div><span>Ready when you are</span><h2>Start a new activation</h2></div>
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
              <label>Operator callsigns or aliases <span>Optional</span></label>
              <input value={operators} onChange={(event) => setOperators(event.target.value)} placeholder="VK3ABC, Scout 2" />
              <div className="hint">Separate multiple operators with commas. Use non-identifying aliases for youth operators.</div>
            </div>

            {error && <div className="error-text" role="alert">{error}</div>}
            <button className="btn-primary" onClick={handleStart}>Open logging dashboard <span aria-hidden="true">→</span></button>

            {recentSessions.length > 0 && <div className="recent-sessions"><div className="recent-title">Recent completed sessions</div>{recentSessions.map((item) => <div className="recent-row" key={item.id}><span>{item.sessionName || item.homePark}</span><span>{item.contacts.length} contacts · {new Date(item.endTime || item.startTime).toLocaleDateString()}</span></div>)}</div>}
          </div>
        </section>

        <section className="workflow-section" id="workflow">
          <div className="workflow-heading">
            <div className="eyebrow">Simple by design</div>
            <h2>From park to portal in three steps.</h2>
          </div>
          <ol className="workflow-grid">
            <li><span className="workflow-number">01</span><div><h3>Choose your park</h3><p>Select a park, operator and entry mode.</p></div></li>
            <li><span className="workflow-number">02</span><div><h3>Log each QSO</h3><p>Record each contact while Loggr checks the details.</p></div></li>
            <li><span className="workflow-number">03</span><div><h3>Review and export</h3><p>Finish with a summary and standards-ready ADIF.</p></div></li>
          </ol>
        </section>
      </main>

      <footer className="landing-footer"><a className="wordmark" href="#top"><span className="wordmark-mark" aria-hidden="true">L</span><span>LOGGR</span></a><p>Offline-ready field contact logging.</p></footer>
    </div>
  )
}
