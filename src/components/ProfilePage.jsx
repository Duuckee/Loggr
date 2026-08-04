import { useCallback, useEffect, useState } from 'react'
import AppNavigation from './AppNavigation'
import { changePassword, createGroup, joinGroup, leaveGroup, loadGroupMembers, loadMyGroup, loadMyProfile, removeGroupMember, updateMyProfile } from '../lib/auth'
import { initialsForProfile } from '../lib/identity'

function roleLabel(role) {
  return ({ user: 'User', local_admin: 'Local admin', leaderboard_admin: 'Leaderboard admin' })[role] || role
}

export default function ProfilePage({ profile, onProfileChange, onNavigate, onSignOut }) {
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [callsign, setCallsign] = useState(profile.callsign || '')
  const [isPublic, setIsPublic] = useState(profile.show_on_leaderboard)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [groupName, setGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isAdmin = profile.system_role === 'leaderboard_admin' || group?.membership_role === 'local_admin'

  const refreshGroup = useCallback(async () => {
    const nextGroup = await loadMyGroup()
    setGroup(nextGroup)
    if (nextGroup?.membership_role === 'local_admin' || profile.system_role === 'leaderboard_admin') {
      setMembers(await loadGroupMembers())
    } else {
      setMembers([])
    }
  }, [profile.system_role])

  useEffect(() => {
    refreshGroup().catch((requestError) => setError(requestError.message))
  }, [refreshGroup])

  async function runAction(action, successMessage) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(successMessage)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function saveProfile(event) {
    event.preventDefault()
    runAction(async () => {
      const next = await updateMyProfile({ display_name: displayName, callsign, show_on_leaderboard: isPublic })
      onProfileChange(next)
    }, 'Profile updated.')
  }

  function handleCreateGroup(event) {
    event.preventDefault()
    runAction(async () => {
      await createGroup(groupName)
      setGroupName('')
      await refreshGroup()
      onProfileChange(await loadMyProfile(profile.id))
    }, 'Group created. Share its join code with linked Scout users.')
  }

  function handleJoinGroup(event) {
    event.preventDefault()
    runAction(async () => {
      await joinGroup(joinCode)
      setJoinCode('')
      await refreshGroup()
      onProfileChange(await loadMyProfile(profile.id))
    }, 'Account linked to the group.')
  }

  return (
    <div className="account-page profile-page">
      <AppNavigation profile={profile} active="profile" onNavigate={onNavigate} onSignOut={onSignOut} />
      <main className="account-page-inner profile-inner">
        <header className="profile-hero">
          <div className="profile-avatar" aria-hidden="true">{initialsForProfile(profile)}</div>
          <div><span className="eyebrow">User profile</span><h1>{profile.display_name || profile.username}</h1><p>@{profile.username}</p></div>
          <div className="profile-role-stack"><span>{profile.account_type === 'scout_user' ? 'Linked Scout user' : 'Public user'}</span><span>{roleLabel(profile.system_role)}</span></div>
        </header>

        {(message || error) && <div className={`account-notice ${error ? 'error' : 'success'}`} role="status">{error || message}</div>}

        <div className="profile-grid">
          <section className="account-card">
            <div className="account-card-header"><span className="panel-kicker">Identity</span><h2>Public profile</h2><p>Control how you appear in Loggr and on the leaderboard.</p></div>
            <form onSubmit={saveProfile}>
              <div className="field"><label htmlFor="profile-username">Username</label><input id="profile-username" value={profile.username} disabled /></div>
              <div className="field"><label htmlFor="profile-name">Display name <span>Optional</span></label><input id="profile-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength="40" /></div>
              <div className="field"><label htmlFor="profile-call">Callsign <span>Optional</span></label><input id="profile-call" value={callsign} onChange={(event) => setCallsign(event.target.value)} autoCapitalize="characters" placeholder="VK3ABC" /></div>
              <label className="privacy-toggle"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /><span><strong>Show me on the leaderboard</strong><small>Your username, display name, group and QSO totals become public.</small></span></label>
              <button className="btn-primary" disabled={busy}>Save profile <span aria-hidden="true">→</span></button>
            </form>
          </section>

          <section className="account-card group-card">
            <div className="account-card-header"><span className="panel-kicker">Group</span><h2>{group ? group.group_name : 'Link your account'}</h2><p>{group ? 'Your QSOs count toward both your profile and your group.' : 'Join a group as a linked Scout user, or create one as its local admin.'}</p></div>
            {group ? (
              <div className="current-group">
                <div className="group-identity"><span>{group.group_name.slice(0, 2).toUpperCase()}</span><div><strong>{group.group_name}</strong><small>{group.membership_role === 'local_admin' ? 'Local administrator' : 'Linked Scout user'}</small></div></div>
                {group.join_code && <div className="join-code"><span>Scout join code</span><strong>{group.join_code}</strong><button type="button" onClick={() => navigator.clipboard?.writeText(group.join_code)}>Copy</button></div>}
                {group.membership_role !== 'local_admin' && <button className="btn-ghost leave-group" disabled={busy} onClick={() => runAction(async () => { await leaveGroup(); await refreshGroup(); onProfileChange(await loadMyProfile(profile.id)) }, 'You left the group.')}>Leave group</button>}
              </div>
            ) : (
              <div className="group-options">
                <form onSubmit={handleJoinGroup}><h3>Join with a code</h3><p>Use the code supplied by your group’s local admin.</p><div className="field"><label htmlFor="join-code">Group code</label><input id="join-code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} maxLength="8" placeholder="ABC123" required /></div><button className="btn-primary" disabled={busy}>Join as Scout user <span aria-hidden="true">→</span></button></form>
                <div className="group-divider"><span>or</span></div>
                <form onSubmit={handleCreateGroup}><h3>Create a group</h3><p>You become the local admin and receive a join code.</p><div className="field"><label htmlFor="group-name">Group name</label><input id="group-name" value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength="60" placeholder="Sandringham Scouts" required /></div><button className="btn-ghost group-create-button" disabled={busy}>Create group</button></form>
              </div>
            )}
          </section>

          <section className="account-card security-card">
            <div className="account-card-header"><span className="panel-kicker">Security</span><h2>Change password</h2><p>Use at least eight characters. Your password is handled only by Supabase Auth.</p></div>
            <form onSubmit={(event) => { event.preventDefault(); runAction(async () => { await changePassword(newPassword); setNewPassword('') }, 'Password changed.') }}>
              <div className="field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="••••••••" required /></div>
              <button className="btn-ghost" disabled={busy}>Update password</button>
            </form>
          </section>

          {isAdmin && group && (
            <section className="account-card members-card">
              <div className="account-card-header"><span className="panel-kicker">Local admin</span><h2>Group users</h2><p>Linked accounts and their logged QSO totals.</p></div>
              <div className="member-list">
                {members.map((member) => <div className="member-row" key={member.profile_id}><div className="member-avatar">{(member.display_name || member.username).slice(0, 2).toUpperCase()}</div><div><strong>{member.display_name || member.username}</strong><span>@{member.username} · {roleLabel(member.system_role)}</span></div><div className="member-qso"><strong>{Number(member.qso_count).toLocaleString()}</strong><span>QSOs</span></div>{member.profile_id !== profile.id && <button className="member-remove" disabled={busy} onClick={() => runAction(async () => { await removeGroupMember(member.profile_id); await refreshGroup() }, `${member.username} was unlinked.`)}>Remove</button>}</div>)}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
