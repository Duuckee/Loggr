function field(name, value) {
  const str = String(value ?? '')
  return `<${name}:${str.length}>${str}`
}

function contactToAdif(contact, session) {
  const ts = new Date(contact.timestamp)
  const date = ts.toISOString().slice(0, 10).replace(/-/g, '')
  const time = ts.toISOString().slice(11, 16).replace(':', '')
  const parts = [
    field('call', contact.callsign),
    field('qso_date', date),
    field('time_on', time),
    field('band', contact.band),
    field('mode', contact.mode === 'SSB' || contact.mode === 'FM' ? 'PHONE' : contact.mode),
    field('submode', contact.mode),
    field('rst_sent', contact.rstSent || (contact.mode === 'SSB' || contact.mode === 'FM' ? '59' : '599')),
    field('rst_rcvd', contact.rstReceived || (contact.mode === 'SSB' || contact.mode === 'FM' ? '59' : '599')),
  ]
  if (contact.frequency) parts.push(field('freq', Number(contact.frequency).toFixed(6)))
  if (contact.park) {
    parts.push(field('sig', 'POTA'))
    parts.push(field('sig_info', contact.park))
  }
  parts.push(field('my_sig', 'POTA'))
  parts.push(field('my_sig_info', session.homePark || ''))
  if (isValidCallsign(contact.operator)) parts.push(field('operator', contact.operator))
  else if (contact.operator) parts.push(field('app_loggr_operator', contact.operator))
  if (isValidCallsign(session.operators?.[0])) parts.push(field('station_callsign', session.operators[0]))
  if (contact.notes) parts.push(field('comment', contact.notes))
  parts.push('<eor>')
  return parts.join(' ')
}

export function buildAdif(session) {
  const header = [
    'Loggr session export',
    field('adif_ver', '3.1.4'),
    field('programid', 'Loggr'),
    field('programversion', '1.0.0'),
    '<eoh>',
  ].join('\n')
  const records = session.contacts.map((contact) => contactToAdif(contact, session)).join('\n')
  return `${header}\n${records}\n`
}

export function downloadAdif(session) {
  const content = buildAdif(session)
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date(session.startTime).toISOString().slice(0, 10)
  a.href = url
  a.download = `loggr-${session.homePark || 'session'}-${stamp}.adi`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
import { isValidCallsign } from './validation.js'
