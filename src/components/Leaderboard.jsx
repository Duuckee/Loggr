// Public and authenticated leaderboard views share the same ranked results.
import { useEffect, useState } from 'react'
import AppNavigation from './AppNavigation'
import { fetchLeaderboard } from '../lib/auth'
import { supabaseConfigured } from '../lib/supabase'

const PERIODS = [
  ['all', 'All time'],
  ['month', 'This month'],
  ['week', 'This week'],
]

function RankMedal({ rank }) {
  return <span className={`rank-medal rank-${rank}`} aria-label={`Rank ${rank}`}>{String(rank).padStart(2, '0')}</span>
}

export default function Leaderboard({ profile, onNavigate, onSignOut, onBack }) {
  const [period, setPeriod] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetchLeaderboard(period)
      .then((data) => { if (active) setRows(data) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [period])

  const topThree = rows.slice(0, 3)

  return (
    <div className="account-page leaderboard-page">
      {profile ? (
        <AppNavigation profile={profile} active="leaderboard" onNavigate={onNavigate} onSignOut={onSignOut} />
      ) : (
        <header className="public-page-nav"><button className="wordmark wordmark-button" onClick={onBack}><span className="wordmark-mark" aria-hidden="true">L</span><span>LOGGR</span></button><button className="btn-accent" onClick={onBack}>Sign in</button></header>
      )}

      <main className="account-page-inner">
        <header className="page-title-row">
          <div><span className="eyebrow">Community standings</span><h1>QSO leaderboard</h1><p>Ranked by contacts synced to Loggr. Only users who choose to be public appear here.</p></div>
          <div className="period-switcher" aria-label="Leaderboard period">
            {PERIODS.map(([value, label]) => <button key={value} className={period === value ? 'active' : ''} onClick={() => setPeriod(value)}>{label}</button>)}
          </div>
        </header>

        {!supabaseConfigured && <div className="account-notice">Configure Supabase to load live leaderboard results.</div>}
        {error && <div className="account-notice error" role="alert">Could not load the leaderboard: {error}</div>}
        {loading && <div className="leaderboard-loading">Loading standings…</div>}

        {!loading && !error && rows.length === 0 && <div className="leaderboard-empty"><span>00</span><h2>No ranked QSOs yet</h2><p>Finish and sync a session to claim the first place.</p></div>}

        {!loading && rows.length > 0 && (
          <>
            <section className="podium-grid" aria-label="Top operators">
              {topThree.map((row) => (
                <article className={`podium-card place-${row.rank}`} key={row.profile_id}>
                  <RankMedal rank={row.rank} />
                  <div className="podium-avatar" aria-hidden="true">{(row.display_name || row.username).slice(0, 2).toUpperCase()}</div>
                  <div><h2>{row.display_name || row.username}</h2><span>@{row.username}</span></div>
                  <strong>{Number(row.qso_count).toLocaleString()}</strong><small>QSOs logged</small>
                  {row.group_name && <div className="group-badge">{row.group_name}</div>}
                </article>
              ))}
            </section>

            <section className="ranking-panel">
              <div className="ranking-panel-header"><div><span className="panel-kicker">Full standings</span><h2>Operators</h2></div><span>{rows.length} ranked</span></div>
              <div className="ranking-table-wrap">
                <table className="ranking-table">
                  <thead><tr><th>Rank</th><th>Operator</th><th>Group</th><th>Sessions</th><th>QSOs</th></tr></thead>
                  <tbody>{rows.map((row) => (
                    <tr key={row.profile_id} className={profile?.id === row.profile_id ? 'is-current-user' : ''}>
                      <td><RankMedal rank={row.rank} /></td>
                      <td><strong>{row.display_name || row.username}</strong><span>@{row.username}{profile?.id === row.profile_id ? ' · You' : ''}</span></td>
                      <td>{row.group_name || 'Independent'}</td>
                      <td>{Number(row.session_count).toLocaleString()}</td>
                      <td><strong className="qso-total">{Number(row.qso_count).toLocaleString()}</strong></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
