import { useEffect, useMemo, useState } from 'react'
import Globe from './Globe'

function formatUtc(date) {
  return date.toISOString().slice(11, 19)
}

function formatDuration(start, end) {
  const elapsed = Math.max(0, Math.floor((end.getTime() - new Date(start).getTime()) / 1000))
  const hours = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
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
      unique: new Set(contacts.map((contact) => contact.callsign)).size,
    }
  }, [session.contacts])

  return (
    <div className="dashboard">
      <header className="app-header">
        <div className="app-header-brand">
          <span className="wordmark-mark" aria-hidden="true">L</span>
          <span>LOGGR</span>
        </div>
        <div className="session-identity">
          <span className="session-overline"><span className="status-pulse" /> Live session · {formatDuration(session.startTime, now)}</span>
          <h1>{session.sessionName || session.homePark}</h1>
          <p>{session.homePark} · {session.homeParkName}</p>
        </div>
        <div className="header-actions">
          <div className={`connection-pill ${online ? 'online' : 'offline'}`}>
            <span className="mini-dot" />
            <span>{online ? 'Online' : 'Offline'}<small>{formatUtc(now)}Z</small></span>
          </div>
          <button className="btn-ghost" onClick={onEndSession}>End session</button>
          <button className="btn-accent" onClick={onAddContact}><span aria-hidden="true">＋</span> Log contact</button>
        </div>
      </header>

      <main className="dashboard-body">
        <section className="globe-pane" aria-label="Contact map">
          <div className="map-panel-header">
            <div><span className="panel-kicker">Live contact map</span><h2>Activation reach</h2></div>
            <div className="map-tools"><span>{stats.total} plotted</span><span className="globe-hint">Drag to rotate · Scroll to zoom</span></div>
          </div>
          <div className="globe-canvas"><Globe homeLat={session.homeLat} homeLon={session.homeLon} contacts={session.contacts} /></div>
          <div className="map-footer">
            <div className="legend" aria-label="Map legend">
              <div className="legend-item"><span className="legend-dot home" /> Your park</div>
              <div className="legend-item"><span className="legend-dot contact" /> Contact</div>
              <div className="legend-item"><span className="legend-dot p2p" /> P2P contact</div>
              <div className="legend-item"><span className="legend-line" /> P2P link</div>
            </div>
            <div className="map-stats">
              <div><strong>{stats.total}</strong><span>Contacts</span></div>
              <div><strong>{stats.unique}</strong><span>Unique calls</span></div>
              <div><strong>{stats.p2pTotal}</strong><span>P2P</span></div>
              <div><strong>{stats.bandsUsed}</strong><span>Bands</span></div>
            </div>
          </div>
        </section>

        <aside className="sidebar">
          <div className="sidebar-header">
            <div><span className="panel-kicker">Session workspace</span><h2>Contact log</h2></div>
            <span className={`save-state ${syncState.status}`}><span className="mini-dot" /> {syncState.message}</span>
          </div>

          <div className="session-controls">
            <label>
              <span>Operator</span>
              <select value={session.activeOperator} onChange={(event) => onUpdateSession({ activeOperator: event.target.value })}>
                {session.operators.map((operator) => <option key={operator}>{operator}</option>)}
              </select>
            </label>
            <label>
              <span>Entry mode</span>
              <select value={session.experienceMode} onChange={(event) => onUpdateSession({ experienceMode: event.target.value })}>
                <option value="guided">Guided</option>
                <option value="normal">Normal</option>
              </select>
            </label>
            <label>
              <span>Role</span>
              <select value={session.operatingRole} onChange={(event) => onUpdateSession({ operatingRole: event.target.value })}>
                <option value="activator">Activator</option>
                <option value="hunter">Hunter</option>
              </select>
            </label>
            <label>
              <span>Duplicates</span>
              <select value={duplicateCooldownMinutes} onChange={(event) => onDuplicateCooldownChange(Number(event.target.value))}>
                <option value="0">Whole session</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </label>
          </div>

          {session.experienceMode === 'guided' && (
            <div className="guided-tip" role="status">
              <span className="tip-icon" aria-hidden="true">→</span><div><strong>Ready for your next QSO?</strong><span>Listen for a callsign, then choose <em>Log contact</em>. Each field will be explained as you go.</span></div>
            </div>
          )}

          <div className="log-header"><span>Recent contacts</span><span>{stats.total} total</span></div>
          <div className="contact-log">
            {session.contacts.length === 0 && <div className="empty-log"><div className="empty-log-mark" aria-hidden="true">CQ</div><strong>Your log is ready</strong><span>Your contacts will appear here and on the globe as you add them.</span><button className="btn-primary" onClick={onAddContact}>Log first contact <span aria-hidden="true">→</span></button></div>}
            {[...session.contacts].reverse().map((contact) => (
              <article className="contact-row" key={contact.id}>
                <div className="contact-row-top">
                  <div><span className={`contact-type-dot ${contact.isP2p ? 'p2p' : ''}`} /><span className="contact-call">{contact.callsign}</span></div>
                  <span className="contact-time">{new Date(contact.timestamp).toISOString().slice(11, 16)} UTC</span>
                </div>
                <div className="contact-tags">
                  <span className="tag">{contact.band}</span><span className="tag">{contact.mode}</span>
                  {contact.park && <span className="tag">{contact.park}</span>}
                  {contact.isP2p && <span className="tag p2p">P2P</span>}
                </div>
                <div className="contact-meta"><span>RST {contact.rstSent}/{contact.rstReceived}</span><span>{contact.operator || 'Unassigned'}</span></div>
                <div className="row-actions">
                  <button onClick={() => onEditContact(contact)}>Edit contact</button>
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
