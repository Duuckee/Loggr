function field(name, value) {
  const str = String(value ?? '')
  return `<${name}:${str.length}>${str}`
}

function contactToAdif(contact) {
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
  ]
  if (contact.park) parts.push(field('sig_info', contact.park))
  parts.push('<eor>')
  return parts.join(' ')
}

export function buildAdif(session) {
  const header = [
    'Loggr session export',
    field('adif_ver', '3.1.4'),
    field('programid', 'Loggr'),
    '<eoh>',
  ].join('\n')
  const records = session.contacts.map(contactToAdif).join('\n')
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
