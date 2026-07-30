import { useState } from 'react'
import { BANDS, MODES, LOCATION_PRESETS } from '../data/parks'
import ParkSearchInput from './ParkSearchInput'

export default function AddContactModal({ onClose, onSubmit }) {
  const [callsign, setCallsign] = useState('')
  const [parkRef, setParkRef] = useState('')
  const [selectedPark, setSelectedPark] = useState(null)
  const [band, setBand] = useState('20m')
  const [mode, setMode] = useState('SSB')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [isP2p, setIsP2p] = useState(false)
  const [error, setError] = useState('')

  function applyPreset(preset) {
    setLat(String(preset.lat))
    setLon(String(preset.lon))
  }

  function handleParkSelect(park) {
    setParkRef(park.reference)
    setSelectedPark(park)
    // A selected park is a real P2P contact — pre-fill their location from it
    setLat(String(park.lat))
    setLon(String(park.lon))
    setIsP2p(true)
  }

  function handleSubmit() {
    const latNum = Number(lat)
    const lonNum = Number(lon)
    if (!callsign.trim()) {
      setError('Enter a callsign')
      return
    }
    if (!lat || !lon || Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      setError('Pick a location preset, search a park, or enter lat/lon')
      return
    }
    onSubmit({
      callsign: callsign.trim().toUpperCase(),
      park: selectedPark ? selectedPark.reference : parkRef.trim().toUpperCase(),
      band,
      mode,
      lat: latNum,
      lon: lonNum,
      isP2p,
      timestamp: new Date().toISOString(),
    })
  }

  return (
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Log a contact</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="field">
          <label>Callsign</label>
          <input
            value={callsign}
            onChange={(e) => setCallsign(e.target.value)}
            placeholder="e.g. VK3ABC"
            autoFocus
          />
        </div>

        <div className="field">
          <label>Park reference (optional — search if park-to-park)</label>
          <ParkSearchInput
            value={parkRef}
            onChange={(v) => {
              setParkRef(v)
              setSelectedPark(null)
            }}
            onSelect={handleParkSelect}
            placeholder="Search parks — e.g. Yarra Bend"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Band</label>
            <select value={band} onChange={(e) => setBand(e.target.value)}>
              {BANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Their location</label>
          <div className="chip-row">
            {LOCATION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`chip ${lat === String(preset.lat) ? 'selected' : ''}`}
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="field-row">
            <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="lat" />
            <input value={lon} onChange={(e) => setLon(e.target.value)} placeholder="lon" />
          </div>
        </div>

        <label className="checkbox-row">
          <input type="checkbox" checked={isP2p} onChange={(e) => setIsP2p(e.target.checked)} />
          Park-to-park — draw a link on the map
        </label>

        {error && <div className="error-text">{error}</div>}

        <button className="btn-primary" onClick={handleSubmit}>
          Add to map
        </button>
      </div>
  )
}
