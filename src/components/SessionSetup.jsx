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
          <a href="#features">Features</a>
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
            <div className="hero-actions">
              <button className="btn-hero" onClick={scrollToSetup}>Start a session <span aria-hidden="true">→</span></button>
              <a className="text-link" href="#workflow">See how it works</a>
            </div>
            <div className="hero-proof" aria-label="Product capabilities">
              <div><strong>{PARK_COUNT.toLocaleString()}</strong><span>Australian parks</span></div>
              <div><strong>Offline</strong><span>Field-ready saving</span></div>
              <div><strong>ADIF</strong><span>Standards export</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Interactive contact globe preview">
            <div className="hero-globe"><Globe homeLat={DEFAULT_LAT} homeLon={DEFAULT_LON} contacts={[]} /></div>
            <div className="visual-label visual-label-top"><span className="mini-dot live" /> Ready to log</div>
            <div className="visual-label visual-label-bottom">Drag to explore <span aria-hidden="true">↗</span></div>
            <div className="globe-orbit" aria-hidden="true" />
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="section-heading">
            <div className="eyebrow">Everything in one place</div>
            <h2>Less admin. More radio.</h2>
            <p>Designed around the way an activation actually happens—from the first CQ to the final upload.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-card-wide">
              <div className="feature-kicker">01 · Map</div>
              <h3>Your activation, made visible</h3>
              <p>Watch contacts appear on a detailed globe. Park-to-park contacts are linked automatically, so the story of the session is clear at a glance.</p>
              <div className="feature-demo map-demo" aria-hidden="true"><span className="map-node home" /><span className="map-path" /><span className="map-node remote" /></div>
            </article>
            <article className="feature-card">
              <div className="feature-kicker">02 · Log</div>
              <h3>Fast when it matters</h3>
              <p>Use guided entry while learning, or switch to the compact form when every second counts.</p>
              <div className="feature-demo field-demo" aria-hidden="true"><span>VK3ABC</span><span>20m</span><span>SSB</span></div>
            </article>
            <article className="feature-card">
              <div className="feature-kicker">03 · Save</div>
              <h3>Signal optional</h3>
              <p>Contacts save locally as you work. Keep logging through patchy coverage and sync when the connection returns.</p>
              <div className="feature-demo save-demo"><span className="mini-dot live" /> Saved on this device</div>
            </article>
          </div>
        </section>

        <section className="landing-section workflow-section" id="workflow">
          <div className="section-heading compact">
            <div className="eyebrow">Simple by design</div>
            <h2>From park to portal in three steps.</h2>
          </div>
          <ol className="workflow-grid">
            <li><span className="workflow-number">01</span><div><h3>Choose your park</h3><p>Search the Australian park list, set the operator, and choose guided or normal entry.</p></div></li>
            <li><span className="workflow-number">02</span><div><h3>Log each QSO</h3><p>Record callsign, band, mode and signal report while Loggr checks the important details.</p></div></li>
            <li><span className="workflow-number">03</span><div><h3>Review and export</h3><p>Finish with a clear session summary and a standards-compliant ADIF file.</p></div></li>
          </ol>
        </section>

        <section className="start-section" id="start-session">
          <div className="start-intro">
            <div className="eyebrow">Start a new activation</div>
            <h2>Set up your session.</h2>
            <p>Choose your operating style and park. You can change the operator, role and entry mode at any point during the session.</p>
            <ul className="start-checklist">
              <li><span>✓</span> Autosaves on this device</li>
              <li><span>✓</span> Works without internet</li>
              <li><span>✓</span> No account required</li>
            </ul>
          </div>

          <div className="setup-panel">
            <div className="setup-panel-header">
              <div><span>New session</span><h3>Activation details</h3></div>
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
      </main>

      <footer className="landing-footer"><a className="wordmark" href="#top"><span className="wordmark-mark" aria-hidden="true">L</span><span>LOGGR</span></a><p>Offline-ready field contact logging.</p></footer>
    </div>
  )
}
