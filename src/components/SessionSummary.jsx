import { useMemo } from 'react'
import { downloadAdif } from '../lib/adif'

function countBy(items, key) {
  return items.reduce((counts, item) => ({ ...counts, [item[key] || 'Unassigned']: (counts[item[key] || 'Unassigned'] || 0) + 1 }), {})
}

export default function SessionSummary({ session, onNewSession }) {
  const report = useMemo(() => ({
    total: session.contacts.length,
    uniqueCallsigns: new Set(session.contacts.map((contact) => contact.callsign)).size,
    p2pTotal: session.contacts.filter((contact) => contact.isP2p).length,
    bands: countBy(session.contacts, 'band'),
    operators: countBy(session.contacts, 'operator'),
  }), [session.contacts])

  return (
    <main className="summary-screen">
      <div className="summary-inner">
        <header className="summary-header">
          <div><div className="brand">LOGGR</div><div className="subtag">SESSION REPORT · {session.homePark} · {session.homeParkName}</div></div>
          <button className="btn-ghost" onClick={onNewSession}>New session</button>
        </header>

        <section className="summary-stats" aria-label="Session statistics">
          <div className="stat-block"><div className="stat-value">{report.total}</div><div className="stat-label">Total contacts</div></div>
          <div className="stat-block"><div className="stat-value">{report.uniqueCallsigns}</div><div className="stat-label">Unique callsigns</div></div>
          <div className="stat-block"><div className="stat-value">{report.p2pTotal}</div><div className="stat-label">P2P links</div></div>
          <div className="stat-block"><div className="stat-value">{Object.keys(report.bands).length}</div><div className="stat-label">Bands used</div></div>
        </section>

        <section className="report-breakdown">
          <div><h2>Contacts by operator</h2>{Object.entries(report.operators).map(([label, count]) => <div className="breakdown-row" key={label}><span>{label}</span><strong>{count}</strong></div>)}</div>
          <div><h2>Contacts by band</h2>{Object.entries(report.bands).map(([label, count]) => <div className="breakdown-row" key={label}><span>{label}</span><strong>{count}</strong></div>)}</div>
        </section>

        <div className="summary-actions"><p>Export a standards-compliant ADIF file for manual upload to the POTA portal.</p><button className="btn-accent" onClick={() => downloadAdif(session)}>Export ADIF</button></div>

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
