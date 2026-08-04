import { useEffect, useMemo, useState } from 'react'
import Globe from './Globe'

function formatUtc(date) {
  return date.toISOString().slice(11, 19)
}

export default function Dashboard({
  session,
  online,
  syncState,
  duplicateCooldownMinutes,
  onDuplicateCooldownChange,
  onAddContact,
  onEditContact,
  onDeleteContact,
  onUpdateSession,
  onEndSession,
}) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const stats = useMemo(() => {
    const contacts = session.contacts
    return {
      total: contacts.length,
      p2pTotal: contacts.filter((contact) => contact.isP2p).length,
      bandsUsed: new Set(contacts.map((contact) => contact.band)).size,
    }
  }, [session.contacts])

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="topbar-brand"><span className="brand">LOGGR</span><span className="subtag">FIELD CONTACT MAP</span></div>
        <div className="session-tag">{session.homePark} · {session.homeParkName}</div>
        <div className="session-tag"><span className={online ? 'live-dot' : 'offline-dot'}>●</span> {online ? 'ONLINE' : 'OFFLINE'} {formatUtc(now)}Z</div>
        <button className="btn-ghost" onClick={onEndSession}>End session</button>
        <button className="btn-accent" onClick={onAddContact}>+ Add contact</button>
      </header>

      <div className="session-controls">
        <label>
          Operator
          <select value={session.activeOperator} onChange={(event) => onUpdateSession({ activeOperator: event.target.value })}>
            {session.operators.map((operator) => <option key={operator}>{operator}</option>)}
          </select>
        </label>
        <label>
          Entry mode
          <select value={session.experienceMode} onChange={(event) => onUpdateSession({ experienceMode: event.target.value })}>
            <option value="guided">Guided</option>
            <option value="normal">Normal</option>
          </select>
        </label>
        <label>
          Role
          <select value={session.operatingRole} onChange={(event) => onUpdateSession({ operatingRole: event.target.value })}>
            <option value="activator">Activator</option>
            <option value="hunter">Hunter</option>
          </select>
        </label>
        <label>
          Duplicate window
          <select value={duplicateCooldownMinutes} onChange={(event) => onDuplicateCooldownChange(Number(event.target.value))}>
            <option value="0">Whole session</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </label>
        <span className={`save-state ${syncState.status}`}>{syncState.message}</span>
      </div>

      <main className="dashboard-body">
        <section className="globe-pane" aria-label="Contact map">
          <Globe homeLat={session.homeLat} homeLon={session.homeLon} contacts={session.contacts} />
          <div className="globe-hint">Drag to rotate · Scroll to zoom</div>
        </section>

        <aside className="sidebar">
          <div className="legend">
            <div className="legend-item"><span className="legend-dot contact" /> Contact</div>
            <div className="legend-item"><span className="legend-dot p2p" /> P2P contact</div>
            <div className="legend-item"><span className="legend-line" /> P2P link</div>
            <div className="legend-item"><span className="legend-dot home" /> Your park</div>
          </div>

          <div className="stats-grid">
            <div className="stat-block"><div className="stat-value">{stats.total}</div><div className="stat-label">Contacts</div></div>
            <div className="stat-block"><div className="stat-value">{stats.p2pTotal}</div><div className="stat-label">P2P links</div></div>
            <div className="stat-block"><div className="stat-value">{stats.bandsUsed}</div><div className="stat-label">Bands</div></div>
          </div>

          {session.experienceMode === 'guided' && (
            <div className="guided-tip" role="status">
              <strong>Next step:</strong> listen for a callsign, then choose <em>Add contact</em>. Loggr will guide each field.
            </div>
          )}

          <div className="log-header">Contact log</div>
          <div className="contact-log">
            {session.contacts.length === 0 && <div className="empty-log">No contacts yet. Choose “Add contact” to begin.</div>}
            {[...session.contacts].reverse().map((contact) => (
              <article className="contact-row" key={contact.id}>
                <div className="contact-row-top">
                  <span className="contact-call">{contact.callsign}</span>
                  <span className="contact-time">{new Date(contact.timestamp).toISOString().slice(11, 16)}Z</span>
                </div>
                <div className="contact-tags">
                  <span className="tag">{contact.band}</span><span className="tag">{contact.mode}</span>
                  {contact.park && <span className="tag">{contact.park}</span>}
                  {contact.isP2p && <span className="tag p2p">P2P</span>}
                </div>
                <div className="contact-meta">{contact.rstSent}/{contact.rstReceived} · {contact.operator || 'Unassigned'}</div>
                <div className="row-actions">
                  <button onClick={() => onEditContact(contact)}>Edit</button>
                  <button className="danger" onClick={() => { if (window.confirm(`Delete ${contact.callsign}?`)) onDeleteContact(contact.id) }}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </main>
    </div>
  )
}
