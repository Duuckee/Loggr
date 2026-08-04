const QRZ_LOGIN_URL = 'https://xmldata.qrz.com/xml/current/'
const HAMQTH_URL = 'https://www.hamqth.com/xml.php'

function xmlValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? match[1].trim() : ''
}

function resultFromXml(xml, provider) {
  const callsign = xmlValue(xml, provider === 'QRZ' ? 'call' : 'callsign')
  if (!callsign) return null
  return {
    callsign,
    name: [xmlValue(xml, 'fname'), xmlValue(xml, 'name')].filter(Boolean).join(' ').trim(),
    location: [xmlValue(xml, 'addr2'), xmlValue(xml, 'country')].filter(Boolean).join(', '),
    grid: xmlValue(xml, 'grid'),
    latitude: Number(xmlValue(xml, 'lat')) || null,
    longitude: Number(xmlValue(xml, 'lon')) || null,
    provider,
  }
}

async function lookupQrz(callsign) {
  if (!process.env.QRZ_USERNAME || !process.env.QRZ_PASSWORD) return null
  const login = await fetch(`${QRZ_LOGIN_URL}?username=${encodeURIComponent(process.env.QRZ_USERNAME)};password=${encodeURIComponent(process.env.QRZ_PASSWORD)};agent=Loggr`)
  const loginXml = await login.text()
  const key = xmlValue(loginXml, 'Key')
  if (!key) return null
  const response = await fetch(`${QRZ_LOGIN_URL}?s=${encodeURIComponent(key)};callsign=${encodeURIComponent(callsign)}`)
  return resultFromXml(await response.text(), 'QRZ')
}

async function lookupHamQth(callsign) {
  if (!process.env.HAMQTH_USERNAME || !process.env.HAMQTH_PASSWORD) return null
  const login = await fetch(`${HAMQTH_URL}?u=${encodeURIComponent(process.env.HAMQTH_USERNAME)}&p=${encodeURIComponent(process.env.HAMQTH_PASSWORD)}`)
  const loginXml = await login.text()
  const sessionId = xmlValue(loginXml, 'session_id')
  if (!sessionId) return null
  const response = await fetch(`${HAMQTH_URL}?id=${encodeURIComponent(sessionId)}&callsign=${encodeURIComponent(callsign)}&prg=Loggr`)
  return resultFromXml(await response.text(), 'HamQTH')
}

export default async function handler(request, response) {
  const callsign = String(request.query.callsign || '').trim().toUpperCase()
  if (!/^(?=.{3,12}$)(?:[A-Z0-9]{1,3})?[0-9][A-Z0-9]{1,4}(?:\/[A-Z0-9]{1,4})?$/.test(callsign)) {
    return response.status(400).json({ error: 'Invalid callsign format.' })
  }

  try {
    const result = await lookupQrz(callsign) || await lookupHamQth(callsign)
    if (!result) {
      return response.status(503).json({ error: 'Configure QRZ or HamQTH credentials to enable live lookup.' })
    }
    response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
    return response.status(200).json(result)
  } catch {
    return response.status(502).json({ error: 'The callsign provider could not be reached.' })
  }
}

