// Existing contacts are edited in this full-detail modal form.
import { useEffect, useMemo, useState } from 'react'
import { BANDS, MODES, LOCATION_PRESETS } from '../data/parks'
import ParkSearchInput from './ParkSearchInput'
import { lookupCallsign } from '../lib/callsign'
import { findDuplicate, normaliseCallsign, validateContact } from '../lib/validation'

const DEFAULT_FREQUENCIES = { '80m': '3.600', '40m': '7.100', '20m': '14.200', '17m': '18.130', '15m': '21.250', '10m': '28.400', '6m': '52.525', '2m': '146.500' }

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function AddContactModal({ contacts, initialContact, experienceMode, operator, sessionId, duplicateCooldownMinutes, onClose, onSubmit }) {
  const [callsign, setCallsign] = useState(initialContact?.callsign || '')
  const [parkRef, setParkRef] = useState(initialContact?.park || '')
  const [selectedPark, setSelectedPark] = useState(null)
  const [band, setBand] = useState(initialContact?.band || '20m')
  const [frequency, setFrequency] = useState(initialContact?.frequency || DEFAULT_FREQUENCIES['20m'])
  const [mode, setMode] = useState(initialContact?.mode || 'SSB')
  const [rstSent, setRstSent] = useState(initialContact?.rstSent || '59')
  const [rstReceived, setRstReceived] = useState(initialContact?.rstReceived || '59')
  const [lat, setLat] = useState(initialContact?.lat ?? '')
  const [lon, setLon] = useState(initialContact?.lon ?? '')
  const [isP2p, setIsP2p] = useState(initialContact?.isP2p || false)
  const [notes, setNotes] = useState(initialContact?.notes || '')
  const [errors, setErrors] = useState({})
  const [duplicate, setDuplicate] = useState(null)
  const [lookupState, setLookupState] = useState({ status: 'idle', message: '' })
  const [step, setStep] = useState(0)
  const [contactId] = useState(() => initialContact?.id || createId())
  const guided = experienceMode === 'guided' && !initialContact

  useEffect(() => {
    function onKeyDown(event) { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const candidate = useMemo(() => ({
    id: contactId, sessionId, callsign: normaliseCallsign(callsign), park: selectedPark?.reference || parkRef.trim().toUpperCase(), band, frequency, mode,
    rstSent, rstReceived, lat: lat === '' ? '' : Number(lat), lon: lon === '' ? '' : Number(lon), isP2p, notes: notes.trim(), operator,
    lookup: lookupState.data || initialContact?.lookup || null, timestamp: initialContact?.timestamp || new Date().toISOString(),
  }), [initialContact, contactId, sessionId, callsign, selectedPark, parkRef, band, frequency, mode, rstSent, rstReceived, lat, lon, isP2p, notes, operator, lookupState.data])

  function changeBand(nextBand) { setBand(nextBand); setFrequency(DEFAULT_FREQUENCIES[nextBand]) }
  function changeMode(nextMode) {
    setMode(nextMode)
    const defaultRst = nextMode === 'SSB' || nextMode === 'FM' ? '59' : '599'
    setRstSent(defaultRst); setRstReceived(defaultRst)
  }
  function applyPreset(preset) { setLat(String(preset.lat)); setLon(String(preset.lon)) }
  function handleParkSelect(park) {
    setParkRef(park.reference); setSelectedPark(park); setLat(String(park.lat)); setLon(String(park.lon)); setIsP2p(true)
  }

  async function handleLookup() {
    setLookupState({ status: 'loading', message: 'Looking up callsign…' })
    try {
      const result = await lookupCallsign(callsign)
      if (result.latitude !== null && result.longitude !== null) { setLat(String(result.latitude)); setLon(String(result.longitude)) }
      setLookupState({ status: 'success', message: `${result.provider}${result.cached ? ' cache' : ''}: ${result.name || result.callsign}${result.location ? ` · ${result.location}` : ''}`, data: result })
    } catch (error) {
      setLookupState({ status: 'error', message: error.message })
    }
  }

  function validateStep() {
    const nextErrors = validateContact(candidate)
    if (guided && step === 0 && nextErrors.callsign) { setErrors({ callsign: nextErrors.callsign }); return false }
    if (guided && step === 1) {
      const signalErrors = Object.fromEntries(Object.entries(nextErrors).filter(([key]) => ['band', 'frequency', 'rstSent', 'rstReceived'].includes(key)))
      if (Object.keys(signalErrors).length) { setErrors(signalErrors); return false }
    }
    setErrors({}); return true
  }

  function handleSubmit(allowDuplicate = false) {
    const nextErrors = validateContact(candidate)
    if (candidate.isP2p && !candidate.park) nextErrors.park = 'Select a valid park before marking this contact park-to-park.'
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return }
    const matching = findDuplicate(contacts, candidate, duplicateCooldownMinutes, initialContact?.id)
    if (matching && !allowDuplicate) { setDuplicate(matching); return }
    onSubmit(candidate)
  }

  const callsignFields = <>
    <div className="guided-copy">{guided && <><span className="step-badge">1 of 3</span><h3>Who did you contact?</h3><p>Type the station’s callsign exactly as you heard it.</p></>}</div>
    <div className="field"><label>Callsign</label><div className="input-action"><input value={callsign} onChange={(event) => { setCallsign(event.target.value.toUpperCase()); setDuplicate(null) }} placeholder="e.g. VK3ABC" autoFocus /><button type="button" className="btn-ghost" onClick={handleLookup} disabled={lookupState.status === 'loading'}>Lookup</button></div>{errors.callsign && <div className="field-error">{errors.callsign}</div>}{lookupState.message && <div className={`lookup-message ${lookupState.status}`}>{lookupState.message}</div>}</div>
  </>

  const signalFields = <>
    <div className="guided-copy">{guided && <><span className="step-badge">2 of 3</span><h3>Record the signal</h3><p>Select the band and mode, then enter the sent and received reports.</p></>}</div>
    <div className="field-row"><div className="field"><label>Band</label><select value={band} onChange={(event) => changeBand(event.target.value)}>{BANDS.map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label>Frequency (MHz)</label><input inputMode="decimal" value={frequency} onChange={(event) => setFrequency(event.target.value)} />{errors.frequency && <div className="field-error">{errors.frequency}</div>}</div></div>
    <div className="field-row"><div className="field"><label>Mode</label><select value={mode} onChange={(event) => changeMode(event.target.value)}>{MODES.map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label>Operator</label><input value={operator} disabled /></div></div>
    <div className="field-row"><div className="field"><label>RST sent</label><input inputMode="numeric" value={rstSent} onChange={(event) => setRstSent(event.target.value)} />{errors.rstSent && <div className="field-error">{errors.rstSent}</div>}</div><div className="field"><label>RST received</label><input inputMode="numeric" value={rstReceived} onChange={(event) => setRstReceived(event.target.value)} />{errors.rstReceived && <div className="field-error">{errors.rstReceived}</div>}</div></div>
  </>

  const locationFields = <>
    <div className="guided-copy">{guided && <><span className="step-badge">3 of 3</span><h3>Add location details</h3><p>This step is optional unless the contact is park-to-park.</p></>}</div>
    <div className="field"><label>Park reference (optional)</label><ParkSearchInput value={parkRef} onChange={(value) => { setParkRef(value); setSelectedPark(null) }} onSelect={handleParkSelect} placeholder="Search parks — e.g. Yarra Bend" />{errors.park && <div className="field-error">{errors.park}</div>}</div>
    <div className="field"><label>Their location (optional)</label><div className="chip-row">{LOCATION_PRESETS.map((preset) => <button key={preset.label} type="button" className={`chip ${lat === String(preset.lat) ? 'selected' : ''}`} onClick={() => applyPreset(preset)}>{preset.label}</button>)}</div><div className="field-row"><input value={lat} onChange={(event) => setLat(event.target.value)} placeholder="latitude" inputMode="decimal" /><input value={lon} onChange={(event) => setLon(event.target.value)} placeholder="longitude" inputMode="decimal" /></div>{(errors.lat || errors.lon) && <div className="field-error">{errors.lat || errors.lon}</div>}</div>
    <label className="checkbox-row"><input type="checkbox" checked={isP2p} onChange={(event) => setIsP2p(event.target.checked)} />Park-to-park — draw a link on the map</label>
    <div className="field"><label>Notes (optional)</label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength="240" placeholder="Equipment, conditions, or contact notes" /></div>
  </>

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className={`modal contact-modal ${guided ? 'guided-modal' : ''}`} role="dialog" aria-modal="true" aria-labelledby="contact-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header"><div><span className="panel-kicker">{initialContact ? 'Update QSO' : 'New QSO'}</span><div id="contact-title" className="modal-title">{initialContact ? 'Edit contact' : guided ? 'Guided contact entry' : 'Log a contact'}</div></div><button className="modal-close" onClick={onClose} aria-label="Close">×</button></div>
        {guided && <div className="modal-progress" aria-label={`Step ${step + 1} of 3`}><span className={step >= 0 ? 'active' : ''}>Callsign</span><span className={step >= 1 ? 'active' : ''}>Signal</span><span className={step >= 2 ? 'active' : ''}>Location</span></div>}
        {(!guided || step === 0) && callsignFields}
        {(!guided || step === 1) && signalFields}
        {(!guided || step === 2) && locationFields}

        {duplicate && <div className="warning-box" role="alert"><strong>Possible duplicate</strong><span>{duplicate.callsign} was already logged on {duplicate.band} {duplicate.mode} at {new Date(duplicate.timestamp).toISOString().slice(11, 16)}Z.</span><button className="btn-danger" onClick={() => handleSubmit(true)}>Save anyway</button></div>}

        {guided ? <div className="modal-actions">{step > 0 && <button className="btn-ghost" onClick={() => { setErrors({}); setStep(step - 1) }}>Back</button>}{step < 2 ? <button className="btn-primary" onClick={() => { if (validateStep()) setStep(step + 1) }}>Next</button> : <button className="btn-primary" onClick={() => handleSubmit(false)}>Save contact</button>}</div> : <button className="btn-primary" onClick={() => handleSubmit(false)}>{initialContact ? 'Save changes' : 'Add to log'}</button>}
      </section>
    </div>
  )
}
