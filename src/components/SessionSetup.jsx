import { useState } from 'react'
import ParkSearchInput from './ParkSearchInput'
import Globe from './Globe'
import { PARK_COUNT } from '../data/parks'

// Default view for the landing globe before a park is picked — centred
// roughly on Australia since that's the loaded POTA dataset.
const DEFAULT_LAT = -25.27
const DEFAULT_LON = 133.78

export default function SessionSetup({ onStart }) {
  const [parkRef, setParkRef] = useState('')
  const [selectedPark, setSelectedPark] = useState(null)
  const [operatorName, setOperatorName] = useState('')
  const [sessionName, setSessionName] = useState('')
  const [error, setError] = useState('')

  function handleSelect(park) {
    setParkRef(park.reference)
    setSelectedPark(park)
    setError('')
  }

  function handleStart() {
    if (!selectedPark || selectedPark.reference.toUpperCase() !== parkRef.trim().toUpperCase()) {
      setError('Search and select a park from the list')
      return
    }
    onStart({
      homePark: selectedPark.reference,
      homeParkName: selectedPark.name,
      homeLat: selectedPark.lat,
      homeLon: selectedPark.lon,
      operatorName,
      sessionName,
    })
  }

  return (
    <div className="landing-screen">
      <div className="landing-globe">
        <Globe homeLat={DEFAULT_LAT} homeLon={DEFAULT_LON} contacts={[]} />
      </div>

      <div className="landing-overlay">
        <div className="setup-card">
          <div className="brand">LOGGR</div>
          <div className="brand-sub">Session setup</div>

          <div className="field">
            <label>Home park reference</label>
            <ParkSearchInput
              value={parkRef}
              onChange={(v) => {
                setParkRef(v)
                setSelectedPark(null)
                setError('')
              }}
              onSelect={handleSelect}
              placeholder={`Search ${PARK_COUNT.toLocaleString()} parks — e.g. Wilsons Prom`}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Operator name</label>
              <input
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Alex Smith"
              />
            </div>
            <div className="field">
              <label>Session name</label>
              <input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Saturday activation"
              />
            </div>
          </div>

          {error && <div className="hint" style={{ color: 'var(--link)' }}>{error}</div>}

          <button className="btn-primary" onClick={handleStart} style={{ marginTop: '0.4rem' }}>
            Start session
          </button>
          <div className="hint">You can switch modes at any time during your session.</div>
        </div>
      </div>
    </div>
  )
}
