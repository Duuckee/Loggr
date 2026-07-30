import { useEffect, useMemo, useState } from 'react'
import Globe from './Globe'

function formatUtc(date) {
  return date.toISOString().slice(11, 19).replace(/:/g, ':') + 'Z'
}

export default function Dashboard({ session, onAddContact, onEndSession }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const stats = useMemo(() => {
    const contacts = session.contacts
    const p2pTotal = contacts.filter((c) => c.isP2p).length
    const bandsUsed = new Set(contacts.map((c) => c.band)).size
    return { total: contacts.length, p2pTotal, bandsUsed }
  }, [session.contacts])

  return (
    <div className="dashboard">
      <div className="topbar">
        <div>
          <span className="brand" style={{ fontSize: '1rem' }}>
            LOGGR
          </span>
          <span className="subtag">FIELD CONTACT MAP</span>
        </div>
        <div className="session-tag">
          {session.homePark} — {session.homeParkName}
        </div>
        <div className="session-tag">
          <span className="live-dot">●</span> LIVE {formatUtc(now)}
        </div>
        <button className="btn-ghost" onClick={onEndSession}>
          End session
        </button>
        <button className="btn-accent" onClick={onAddContact}>
          + Add contact
        </button>
      </div>

      <div className="dashboard-body">
        <div className="globe-pane">
          <Globe
            homeLat={session.homeLat}
            homeLon={session.homeLon}
            contacts={session.contacts}
          />
          <div className="globe-hint">Drag to rotate · Scroll to zoom</div>
        </div>

        <div className="sidebar">
          <div className="legend">
            <div className="legend-item">
              <span className="legend-dot" /> Contact
            </div>
            <div className="legend-item">
              <span className="legend-line" /> Park-to-park link
            </div>
            <div className="legend-item">
              <span className="legend-ring" /> Home park
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-block">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Contacts</div>
            </div>
            <div className="stat-block">
              <div className="stat-value">{stats.p2pTotal}</div>
              <div className="stat-label">P2P links</div>
            </div>
            <div className="stat-block">
              <div className="stat-value">{stats.bandsUsed}</div>
              <div className="stat-label">Bands</div>
            </div>
          </div>

          <div className="log-header">Contact log</div>
          <div className="contact-log">
            {session.contacts.length === 0 && (
              <div className="empty-log">No contacts logged yet. Tap "Add contact" to start.</div>
            )}
            {[...session.contacts].reverse().map((c, i) => (
              <div className="contact-row" key={i}>
                <div className="contact-row-top">
                  <span className="contact-call">{c.callsign}</span>
                  <span className="contact-time">
                    {new Date(c.timestamp).toISOString().slice(11, 16)}Z
                  </span>
                </div>
                <div className="contact-tags">
                  <span className="tag">{c.band}</span>
                  <span className="tag">{c.mode}</span>
                  {c.park && <span className="tag">{c.park}</span>}
                  {c.isP2p && <span className="tag p2p">P2P</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
