import { useMemo, useRef, useState } from 'react'
import { BANDS, MODES, LOCATION_PRESETS } from '../data/parks'
import ParkSearchInput from './ParkSearchInput'
import { lookupCallsign } from '../lib/callsign'
import { frequencyAfterSubmit } from '../lib/logging'
import { findDuplicate, normaliseCallsign, validateContact } from '../lib/validation'

const DEFAULT_FREQUENCIES = { '80m': '3.600', '40m': '7.100', '20m': '14.200', '17m': '18.130', '15m': '21.250', '10m': '28.400', '6m': '52.525', '2m': '146.500' }

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function ContactEntryForm({
  contacts,
  experienceMode,
  frequencyMode,
  operator,
  sessionId,
  duplicateCooldownMinutes,
  onFrequencyModeChange,
  onSubmit,
}) {
  const callsignRef = useRef(null)
  const [contactId, setContactId] = useState(createId)
  const [callsign, setCallsign] = useState('')
  const [parkRef, setParkRef] = useState('')
  const [selectedPark, setSelectedPark] = useState(null)
  const [band, setBand] = useState('20m')
  const [frequency, setFrequency] = useState(DEFAULT_FREQUENCIES['20m'])
  const [mode, setMode] = useState('SSB')
  const [rstSent, setRstSent] = useState('59')
  const [rstReceived, setRstReceived] = useState('59')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [isP2p, setIsP2p] = useState(false)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [duplicate, setDuplicate] = useState(null)
  const [lookupState, setLookupState] = useState({ status: 'idle', message: '' })
  const [savedMessage, setSavedMessage] = useState('')

  const candidate = useMemo(() => ({
    id: contactId,
    sessionId,
    callsign: normaliseCallsign(callsign),
    park: selectedPark?.reference || parkRef.trim().toUpperCase(),
    band,
    frequency,
    mode,
    rstSent,
    rstReceived,
    lat: lat === '' ? '' : Number(lat),
    lon: lon === '' ? '' : Number(lon),
    isP2p,
    notes: notes.trim(),
    operator,
    lookup: lookupState.data || null,
    timestamp: new Date().toISOString(),
  }), [contactId, sessionId, callsign, selectedPark, parkRef, band, frequency, mode, rstSent, rstReceived, lat, lon, isP2p, notes, operator, lookupState.data])

  function changeBand(nextBand) {
    setBand(nextBand)
    setFrequency(DEFAULT_FREQUENCIES[nextBand])
    setErrors((current) => ({ ...current, band: undefined, frequency: undefined }))
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    const defaultRst = nextMode === 'SSB' || nextMode === 'FM' ? '59' : '599'
    setRstSent(defaultRst)
    setRstReceived(defaultRst)
  }

  function chooseFrequencyMode(nextMode) {
    if (nextMode === 'stay' && !frequency) setFrequency(DEFAULT_FREQUENCIES[band])
    onFrequencyModeChange(nextMode)
  }

  function applyPreset(preset) {
    setLat(String(preset.lat))
    setLon(String(preset.lon))
  }

  function handleParkSelect(park) {
    setParkRef(park.reference)
    setSelectedPark(park)
    setLat(String(park.lat))
    setLon(String(park.lon))
    setIsP2p(true)
  }

  async function handleLookup() {
    setLookupState({ status: 'loading', message: 'Looking up callsign…' })
    try {
      const result = await lookupCallsign(callsign)
      if (result.latitude !== null && result.longitude !== null) {
        setLat(String(result.latitude))
        setLon(String(result.longitude))
      }
      setLookupState({
        status: 'success',
        message: `${result.provider}${result.cached ? ' cache' : ''}: ${result.name || result.callsign}${result.location ? ` · ${result.location}` : ''}`,
        data: result,
      })
    } catch (error) {
      setLookupState({ status: 'error', message: error.message })
    }
  }

  function resetAfterSubmit(savedCallsign) {
    setContactId(createId())
    setCallsign('')
    setParkRef('')
    setSelectedPark(null)
    setLat('')
    setLon('')
    setIsP2p(false)
    setNotes('')
    setDuplicate(null)
    setErrors({})
    setLookupState({ status: 'idle', message: '' })
    setSavedMessage(`${savedCallsign} added to the log`)
    setFrequency(frequencyAfterSubmit(frequencyMode, frequency))
    window.setTimeout(() => setSavedMessage(''), 2400)
    window.requestAnimationFrame(() => callsignRef.current?.focus())
  }

  function handleSubmit(event, allowDuplicate = false) {
    event?.preventDefault()
    const nextCandidate = { ...candidate, timestamp: new Date().toISOString() }
    const nextErrors = validateContact(nextCandidate)
    if (nextCandidate.isP2p && !nextCandidate.park) nextErrors.park = 'Select a valid park before marking this contact park-to-park.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    const matching = findDuplicate(contacts, nextCandidate, duplicateCooldownMinutes)
    if (matching && !allowDuplicate) {
      setDuplicate(matching)
      return
    }
    onSubmit(nextCandidate)
    resetAfterSubmit(nextCandidate.callsign)
  }

  return (
    <section className="contact-composer" aria-labelledby="contact-entry-title">
      <header className="composer-header">
        <div>
          <span className="panel-kicker">Quick entry</span>
          <h2 id="contact-entry-title">Log a contact</h2>
        </div>
        <div className="frequency-mode-control">
          <div className="frequency-mode-switch" aria-label="Frequency logging behavior">
            <button type="button" className={frequencyMode === 'hunt' ? 'active' : ''} aria-pressed={frequencyMode === 'hunt'} onClick={() => chooseFrequencyMode('hunt')}>Hunt</button>
            <button type="button" className={frequencyMode === 'stay' ? 'active' : ''} aria-pressed={frequencyMode === 'stay'} onClick={() => chooseFrequencyMode('stay')}>Stay</button>
          </div>
          <span>{frequencyMode === 'stay' ? 'Frequency stays after each QSO' : 'Frequency clears after each QSO'}</span>
        </div>
      </header>

      {experienceMode === 'guided' && <p className="composer-guidance">Enter the callsign and signal details. Open additional details only when you need location, P2P, or notes.</p>}

      <form onSubmit={handleSubmit}>
        <div className="quick-entry-grid">
          <div className="field callsign-field">
            <label htmlFor="contact-callsign">Callsign</label>
            <div className="input-action"><input ref={callsignRef} id="contact-callsign" value={callsign} onChange={(event) => { setCallsign(event.target.value.toUpperCase()); setDuplicate(null); setSavedMessage('') }} placeholder="VK3ABC" autoComplete="off" /><button type="button" className="btn-ghost" onClick={handleLookup} disabled={lookupState.status === 'loading' || !callsign}>Lookup</button></div>
            {errors.callsign && <div className="field-error">{errors.callsign}</div>}
          </div>
          <div className="field">
            <label htmlFor="contact-band">Band</label>
            <select id="contact-band" value={band} onChange={(event) => changeBand(event.target.value)}>{BANDS.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <div className="field frequency-field">
            <label htmlFor="contact-frequency">Frequency <span>MHz</span></label>
            <input id="contact-frequency" inputMode="decimal" value={frequency} onChange={(event) => { setFrequency(event.target.value); setErrors((current) => ({ ...current, frequency: undefined })) }} placeholder={frequencyMode === 'hunt' ? 'Optional' : DEFAULT_FREQUENCIES[band]} />
            {errors.frequency && <div className="field-error">{errors.frequency}</div>}
          </div>
          <div className="field">
            <label htmlFor="contact-mode">Mode</label>
            <select id="contact-mode" value={mode} onChange={(event) => changeMode(event.target.value)}>{MODES.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <button className="btn-primary composer-submit" type="submit">Add QSO <span aria-hidden="true">↵</span></button>
        </div>

        {lookupState.message && <div className={`lookup-message composer-message ${lookupState.status}`}>{lookupState.message}</div>}
        {savedMessage && <div className="composer-saved" role="status"><span className="mini-dot live" /> {savedMessage}</div>}

        <details className="entry-details">
          <summary><span>Additional details</span><small>RST · park · location · notes</small></summary>
          <div className="entry-details-grid">
            <div className="signal-detail-fields">
              <div className="field-row">
                <div className="field"><label htmlFor="rst-sent">RST sent</label><input id="rst-sent" inputMode="numeric" value={rstSent} onChange={(event) => setRstSent(event.target.value)} />{errors.rstSent && <div className="field-error">{errors.rstSent}</div>}</div>
                <div className="field"><label htmlFor="rst-received">RST received</label><input id="rst-received" inputMode="numeric" value={rstReceived} onChange={(event) => setRstReceived(event.target.value)} />{errors.rstReceived && <div className="field-error">{errors.rstReceived}</div>}</div>
              </div>
              <div className="field"><label>Active operator</label><input value={operator} disabled /></div>
              <label className="checkbox-row"><input type="checkbox" checked={isP2p} onChange={(event) => setIsP2p(event.target.checked)} />Park-to-park — draw a map link</label>
            </div>
            <div>
              <div className="field"><label>Park reference <span>Optional</span></label><ParkSearchInput value={parkRef} onChange={(value) => { setParkRef(value); setSelectedPark(null) }} onSelect={handleParkSelect} placeholder="Search parks" />{errors.park && <div className="field-error">{errors.park}</div>}</div>
              <div className="field"><label>Their location <span>Optional</span></label><div className="chip-row">{LOCATION_PRESETS.map((preset) => <button key={preset.label} type="button" className={`chip ${lat === String(preset.lat) ? 'selected' : ''}`} onClick={() => applyPreset(preset)}>{preset.label}</button>)}</div><div className="field-row"><input value={lat} onChange={(event) => setLat(event.target.value)} placeholder="Latitude" inputMode="decimal" /><input value={lon} onChange={(event) => setLon(event.target.value)} placeholder="Longitude" inputMode="decimal" /></div>{(errors.lat || errors.lon) && <div className="field-error">{errors.lat || errors.lon}</div>}</div>
              <div className="field"><label htmlFor="contact-notes">Notes <span>Optional</span></label><textarea id="contact-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength="240" placeholder="Equipment or conditions" /></div>
            </div>
          </div>
        </details>

        {duplicate && <div className="warning-box composer-duplicate" role="alert"><strong>Possible duplicate</strong><span>{duplicate.callsign} was logged on {duplicate.band} {duplicate.mode} at {new Date(duplicate.timestamp).toISOString().slice(11, 16)}Z.</span><div><button type="button" className="btn-ghost" onClick={() => setDuplicate(null)}>Cancel</button><button type="button" className="btn-danger" onClick={() => handleSubmit(null, true)}>Save anyway</button></div></div>}
      </form>
    </section>
  )
}
