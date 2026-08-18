// Identity helpers normalize usernames and create safe display initials.
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 24
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_BYTES = 72

export function normalizeUsername(value = '') {
  return value.trim().toLowerCase()
}

export function validateUsername(value) {
  const username = normalizeUsername(value)
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return `Use ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters.`
  }
  if (!/^[a-z0-9](?:[a-z0-9_.-]*[a-z0-9])?$/.test(username)) {
    return 'Use letters, numbers, dots, hyphens or underscores; start and end with a letter or number.'
  }
  return ''
}

export function passwordByteLength(value = '') {
  return new TextEncoder().encode(value).length
}

export function validatePassword(value = '') {
  if (value.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`
  if (passwordByteLength(value) > PASSWORD_MAX_BYTES) return `Keep the password under ${PASSWORD_MAX_BYTES} bytes.`
  return ''
}

export function usernameToAuthEmail(value) {
  const username = normalizeUsername(value)
  return `${username}@accounts.loggr.app`
}

export function initialsForProfile(profile) {
  const label = profile?.display_name || profile?.username || 'L'
  return label.trim().slice(0, 2).toUpperCase()
}
