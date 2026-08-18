// Public landing screen handles sign-in, registration, and product orientation.
import { useState } from 'react'
import { PARK_COUNT } from '../data/parks'
import { signInWithUsername, signUpWithUsername } from '../lib/auth'
import { supabaseConfigured } from '../lib/supabase'

export default function AuthLanding({ onAuthenticated, onViewLeaderboard }) {
  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function chooseMode(nextMode) {
    setMode(nextMode)
    setError('')
    setPassword('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = mode === 'signup'
        ? await signUpWithUsername({ username, password, displayName })
        : await signInWithUsername({ username, password })
      onAuthenticated(result.session)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-landing">
      <nav className="auth-nav" aria-label="Public navigation">
        <a className="wordmark" href="#top" aria-label="Loggr home">
          <span className="wordmark-mark" aria-hidden="true">L</span><span>LOGGR</span>
        </a>
        <button className="btn-ghost" type="button" onClick={onViewLeaderboard}>View leaderboard</button>
      </nav>

      <main className="auth-hero" id="top">
        <section className="auth-hero-copy">
          <div className="eyebrow"><span className="status-pulse" /> Field logging, tuned in</div>
          <h1>Every contact.<br /><span>One clear signal.</span></h1>
          <p>A focused field logger with a live 3D contact map, team groups, and a leaderboard built around the QSOs you actually record.</p>
          <div className="signal-strip" aria-hidden="true">
            <span className="signal-frequency">144.800</span>
            <span className="signal-wave" />
            <span className="signal-unit">MHz · CQ</span>
          </div>
          <div className="auth-proof" aria-label="Loggr capabilities">
            <div><strong>{PARK_COUNT.toLocaleString()}</strong><span>Australian parks</span></div>
            <div><strong>Offline</strong><span>Local-first logging</span></div>
            <div><strong>Private</strong><span>Username accounts</span></div>
          </div>
          <button className="landing-leaderboard-link" type="button" onClick={onViewLeaderboard}>
            <span className="leaderboard-mini-rank">01</span>
            <span><strong>See the QSO leaderboard</strong><small>Compare public users and Scout groups</small></span>
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <section className="auth-card" aria-labelledby="account-title">
          <div className="auth-card-heading">
            <span className="panel-kicker">Operator access</span>
            <h2 id="account-title">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{mode === 'signin' ? 'Sign in to continue logging to your profile.' : 'No email required—choose a username and password.'}</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Account action">
            <button role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'active' : ''} onClick={() => chooseMode('signin')}>Sign in</button>
            <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => chooseMode('signup')}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="display-name">Display name <span>Optional</span></label>
                <input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength="40" autoComplete="nickname" placeholder="How you appear on the board" />
              </div>
            )}
            <div className="field">
              <label htmlFor="username">Username</label>
              <div className="username-input"><span aria-hidden="true">@</span><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoCapitalize="none" autoCorrect="off" autoComplete="username" placeholder="radio_operator" required /></div>
            </div>
            <div className="field">
              <label htmlFor="password">Password <span>{mode === 'signup' ? '8+ characters' : 'Required'}</span></label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="••••••••" required />
            </div>

            {!supabaseConfigured && <div className="auth-config-warning" role="alert">Add your Supabase URL and publishable key to <code>.env.local</code> before creating accounts.</div>}
            {error && <div className="error-text auth-error" role="alert">{error}</div>}
            <button className="btn-primary auth-submit" type="submit" disabled={busy || !supabaseConfigured}>
              <span>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in to Loggr' : 'Create my account'}</span><span aria-hidden="true">→</span>
            </button>
          </form>
          <p className="auth-privacy">Use a callsign or non-identifying alias for youth operators. Loggr never asks for a real name, age or email.</p>
        </section>
      </main>
    </div>
  )
}
