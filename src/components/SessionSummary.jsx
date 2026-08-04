import { useMemo } from 'react'
import AppNavigation from './AppNavigation'
import { downloadAdif } from '../lib/adif'

function countBy(items, key) {
  return items.reduce((counts, item) => ({ ...counts, [item[key] || 'Unassigned']: (counts[item[key] || 'Unassigned'] || 0) + 1 }), {})
}

export default function SessionSummary({ session, profile, onNewSession, onNavigate, onSignOut }) {
  const report = useMemo(() => ({
    total: session.contacts.length,
    uniqueCallsigns: new Set(session.contacts.map((contact) => contact.callsign)).size,
    p2pTotal: session.contacts.filter((contact) => contact.isP2p).length,
    bands: countBy(session.contacts, 'band'),
    operators: countBy(session.contacts, 'operator'),
  }), [session.contacts])

  return (
    <main className="summary-screen">
      <AppNavigation profile={profile} active="setup" onNavigate={onNavigate} onSignOut={onSignOut} compact />
      <div className="summary-inner">
        <header className="summary-header">
          <div><span className="panel-kicker">Session report</span><strong>Saved to @{profile.username}</strong></div>
          <button className="btn-ghost" onClick={onNewSession}>＋ New session</button>
        </header>

        <section className="summary-hero">
          <div><span className="eyebrow"><span className="mini-dot live" /> Session complete</span><h1>{session.sessionName || session.homePark}</h1><p>{session.homePark} · {session.homeParkName}</p></div>
          <div className="summary-date"><span>Finished</span><strong>{new Date(session.endTime || Date.now()).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</strong><small>{new Date(session.endTime || Date.now()).toISOString().slice(11, 16)} UTC</small></div>
        </section>

        <section className="summary-stats" aria-label="Session statistics">
          <div className="stat-block"><div className="stat-label">Total contacts</div><div className="stat-value">{report.total}</div><span>QSOs recorded</span></div>
          <div className="stat-block"><div className="stat-label">Unique callsigns</div><div className="stat-value">{report.uniqueCallsigns}</div><span>Distinct stations</span></div>
          <div className="stat-block"><div className="stat-label">P2P contacts</div><div className="stat-value">{report.p2pTotal}</div><span>Park links</span></div>
          <div className="stat-block"><div className="stat-label">Bands used</div><div className="stat-value">{Object.keys(report.bands).length}</div><span>Across the session</span></div>
        </section>

        <section className="report-breakdown">
          <div><div className="report-card-header"><span className="panel-kicker">Team</span><h2>Contacts by operator</h2></div>{Object.entries(report.operators).map(([label, count]) => <div className="breakdown-row" key={label}><span>{label}</span><strong>{count}</strong></div>)}</div>
          <div><div className="report-card-header"><span className="panel-kicker">Radio</span><h2>Contacts by band</h2></div>{Object.entries(report.bands).map(([label, count]) => <div className="breakdown-row" key={label}><span>{label}</span><strong>{count}</strong></div>)}</div>
        </section>

        <div className="summary-actions"><div><span className="panel-kicker">Ready to upload</span><h2>Take your log with you.</h2><p>Export a standards-compliant ADIF file for manual upload to the POTA portal.</p></div><button className="btn-accent" onClick={() => downloadAdif(session)}>Export ADIF <span aria-hidden="true">↓</span></button></div>

        <div className="table-heading"><div><span className="panel-kicker">Session records</span><h2>All contacts</h2></div><span>{report.total} QSO{report.total === 1 ? '' : 's'}</span></div>
        <div className="summary-table-wrap">
          <table className="summary-table">
            <thead><tr><th>UTC</th><th>Callsign</th><th>Band / MHz</th><th>Mode</th><th>RST</th><th>Operator</th><th>Park</th></tr></thead>
            <tbody>{session.contacts.map((contact) => <tr key={contact.id}><td>{new Date(contact.timestamp).toISOString().slice(11, 16)}Z</td><td>{contact.callsign}</td><td>{contact.band}{contact.frequency ? ` / ${contact.frequency}` : ''}</td><td>{contact.mode}</td><td>{contact.rstSent}/{contact.rstReceived}</td><td>{contact.operator}</td><td>{contact.park || '—'}</td></tr>)}</tbody>
          </table>
          {session.contacts.length === 0 && <div className="empty-log">This session has no contacts.</div>}
        </div>
      </div>
    </main>
  )
}
