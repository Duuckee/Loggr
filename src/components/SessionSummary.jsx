import { useMemo } from 'react'
import { downloadAdif } from '../lib/adif'

export default function SessionSummary({ session, onNewSession }) {
  const stats = useMemo(() => {
    const contacts = session.contacts
    const uniqueCallsigns = new Set(contacts.map((c) => c.callsign)).size
    const p2pTotal = contacts.filter((c) => c.isP2p).length
    const bandsUsed = new Set(contacts.map((c) => c.band)).size
    return { total: contacts.length, uniqueCallsigns, p2pTotal, bandsUsed }
  }, [session.contacts])

  return (
    <div className="summary-screen">
      <div className="summary-inner">
        <div className="summary-header">
          <div>
            <div className="brand" style={{ fontSize: '1.1rem' }}>
              LOGGR
            </div>
            <div className="subtag">SESSION SUMMARY — {session.homePark} · {session.homeParkName}</div>
          </div>
          <button className="btn-ghost" onClick={onNewSession}>
            New session
          </button>
        </div>

        <div className="summary-stats">
          <div className="stat-block">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total contacts</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">{stats.uniqueCallsigns}</div>
            <div className="stat-label">Unique callsigns</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">{stats.p2pTotal}</div>
            <div className="stat-label">P2P links</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">{stats.bandsUsed}</div>
            <div className="stat-label">Bands used</div>
          </div>
        </div>

        <div className="summary-actions">
          <button className="btn-accent" onClick={() => downloadAdif(session)}>
            Export ADIF
          </button>
        </div>

        <div className="summary-table-wrap">
          <table className="summary-table">
            <thead>
              <tr>
                <th>Callsign</th>
                <th>Band</th>
                <th>Mode</th>
                <th>Park</th>
                <th>P2P</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {session.contacts.map((c, i) => (
                <tr key={i}>
                  <td>{c.callsign}</td>
                  <td>{c.band}</td>
                  <td>{c.mode}</td>
                  <td>{c.park || '—'}</td>
                  <td>{c.isP2p ? 'Yes' : '—'}</td>
                  <td>{new Date(c.timestamp).toISOString().slice(11, 16)}Z</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
