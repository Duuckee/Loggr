// Authentication helpers wrap Supabase accounts, profiles, groups, and rankings.
import { supabase, supabaseConfigured } from './supabase'
import { normalizeUsername, usernameToAuthEmail, validatePassword, validateUsername } from './identity'

const PROFILE_CACHE_PREFIX = 'loggr.profile.v1'

function profileCacheKey(userId) {
  return `${PROFILE_CACHE_PREFIX}:${userId}`
}

function readCachedProfile(userId) {
  try {
    const value = localStorage.getItem(profileCacheKey(userId))
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function cacheProfile(profile) {
  try {
    localStorage.setItem(profileCacheKey(profile.id), JSON.stringify(profile))
  } catch {
    // A current in-memory profile still works when browser storage is unavailable.
  }
  return profile
}

function requireSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Accounts need Supabase. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.')
  }
}

function cleanDisplayName(value = '') {
  return value.trim().slice(0, 40)
}

function authMessage(error, mode) {
  const message = error?.message || 'Account request failed.'
  if (/invalid login credentials/i.test(message)) return 'Incorrect username or password.'
  if (/user already registered|already been registered/i.test(message)) return 'That username is already taken.'
  if (/email rate limit|rate limit/i.test(message)) return 'Too many attempts. Wait a moment and try again.'
  if (mode === 'signup' && /database error/i.test(message)) return 'That username may already be taken, or the account database has not been set up.'
  return message
}

export async function signUpWithUsername({ username, password, displayName }) {
  requireSupabase()
  const usernameError = validateUsername(username)
  const passwordError = validatePassword(password)
  if (usernameError) throw new Error(usernameError)
  if (passwordError) throw new Error(passwordError)

  const normalized = normalizeUsername(username)
  const { data, error } = await supabase.auth.signUp({
    email: usernameToAuthEmail(normalized),
    password,
    options: {
      data: {
        username: normalized,
        display_name: cleanDisplayName(displayName) || normalized,
      },
    },
  })
  if (error) throw new Error(authMessage(error, 'signup'))
  if (!data.session) {
    throw new Error('Username-only accounts require “Confirm email” to be disabled in Supabase Auth settings.')
  }
  return data
}

export async function signInWithUsername({ username, password }) {
  requireSupabase()
  const usernameError = validateUsername(username)
  if (usernameError) throw new Error(usernameError)
  if (!password) throw new Error('Enter your password.')

  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToAuthEmail(username),
    password,
  })
  if (error) throw new Error(authMessage(error, 'signin'))
  return data
}

export async function signOut() {
  requireSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function loadMyProfile(userId) {
  requireSupabase()
  const cached = readCachedProfile(userId)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, callsign, account_type, system_role, show_on_leaderboard, created_at')
    .eq('id', userId)
    .single()
  if (error && cached) return cached
  if (error) throw error
  return cacheProfile(data)
}

export async function updateMyProfile(patch) {
  requireSupabase()
  const { data: authData } = await supabase.auth.getSession()
  const userId = authData.session?.user.id
  if (!userId) throw new Error('Sign in before updating your profile.')
  const safePatch = {}
  if ('display_name' in patch) safePatch.display_name = cleanDisplayName(patch.display_name)
  if ('callsign' in patch) safePatch.callsign = patch.callsign.trim().toUpperCase().slice(0, 20) || null
  if ('show_on_leaderboard' in patch) safePatch.show_on_leaderboard = Boolean(patch.show_on_leaderboard)
  const { data, error } = await supabase.from('profiles').update(safePatch).eq('id', userId).select().single()
  if (error) throw error
  return cacheProfile(data)
}

export async function changePassword(password) {
  requireSupabase()
  const passwordError = validatePassword(password)
  if (passwordError) throw new Error(passwordError)
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function fetchLeaderboard(period = 'all') {
  requireSupabase()
  const { data, error } = await supabase.rpc('get_leaderboard', { period_filter: period })
  if (error) throw error
  return data || []
}

export async function loadMyGroup() {
  requireSupabase()
  const { data, error } = await supabase.rpc('get_my_group')
  if (error) throw error
  return data?.[0] || null
}

export async function createGroup(name) {
  requireSupabase()
  const cleanName = name.trim()
  if (cleanName.length < 3 || cleanName.length > 60) throw new Error('Use a group name between 3 and 60 characters.')
  const { data, error } = await supabase.rpc('create_loggr_group', { group_name: cleanName })
  if (error) throw error
  return data?.[0] || null
}

export async function joinGroup(code) {
  requireSupabase()
  const { data, error } = await supabase.rpc('join_loggr_group', { supplied_code: code.trim().toUpperCase() })
  if (error) throw error
  return data?.[0] || null
}

export async function leaveGroup() {
  requireSupabase()
  const { error } = await supabase.rpc('leave_loggr_group')
  if (error) throw error
}

export async function loadGroupMembers() {
  requireSupabase()
  const { data, error } = await supabase.rpc('get_group_members')
  if (error) throw error
  return data || []
}

export async function removeGroupMember(profileId) {
  requireSupabase()
  const { error } = await supabase.rpc('remove_group_member', { member_profile_id: profileId })
  if (error) throw error
}
