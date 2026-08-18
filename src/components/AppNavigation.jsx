// Shared account navigation keeps authenticated screens consistent.
import { initialsForProfile } from '../lib/identity'

export default function AppNavigation({ profile, active, onNavigate, onSignOut, compact = false }) {
  return (
    <header className={`account-nav ${compact ? 'compact' : ''}`}>
      <button className="wordmark wordmark-button" type="button" onClick={() => onNavigate('setup')} aria-label="Loggr home">
        <span className="wordmark-mark" aria-hidden="true">L</span>
        <span>LOGGR</span>
      </button>
      <nav className="account-nav-links" aria-label="Account navigation">
        <button className={active === 'setup' ? 'active' : ''} onClick={() => onNavigate('setup')}>Log</button>
        <button className={active === 'leaderboard' ? 'active' : ''} onClick={() => onNavigate('leaderboard')}>Leaderboard</button>
        <button className={active === 'profile' ? 'active' : ''} onClick={() => onNavigate('profile')}>Profile</button>
      </nav>
      <div className="account-nav-user">
        <button className="user-chip" type="button" onClick={() => onNavigate('profile')} aria-label="Open profile">
          <span className="user-avatar" aria-hidden="true">{initialsForProfile(profile)}</span>
          <span><strong>{profile?.display_name || profile?.username}</strong><small>@{profile?.username}</small></span>
        </button>
        <button className="nav-signout" type="button" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  )
}
