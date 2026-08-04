import { supabase, supabaseConfigured } from './supabase'

export async function syncSession(session) {
  if (!supabaseConfigured || !supabase || !navigator.onLine) {
    return { status: 'local', message: 'Saved on this device' }
  }

  let { data: authData } = await supabase.auth.getSession()
  if (!authData.session) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    authData = { session: data.session }
  }
  const ownerId = authData.session.user.id

  const sessionRow = {
    id: session.id,
    owner_id: ownerId,
    name: session.sessionName || null,
    home_park: session.homePark,
    home_park_name: session.homeParkName,
    home_lat: session.homeLat,
    home_lon: session.homeLon,
    operators: session.operators,
    experience_mode: session.experienceMode,
    operating_role: session.operatingRole,
    started_at: session.startTime,
    ended_at: session.endTime || null,
    status: session.status,
    updated_at: new Date().toISOString(),
  }
  const { error: sessionError } = await supabase.from('sessions').upsert(sessionRow)
  if (sessionError) throw sessionError

  if (session.contacts.length > 0) {
    const contactRows = session.contacts.map((contact) => ({
      id: contact.id,
      session_id: session.id,
      callsign: contact.callsign,
      band: contact.band,
      frequency: contact.frequency ? Number(contact.frequency) : null,
      mode: contact.mode,
      rst_sent: contact.rstSent,
      rst_received: contact.rstReceived,
      park: contact.park || null,
      latitude: contact.lat === '' ? null : Number(contact.lat),
      longitude: contact.lon === '' ? null : Number(contact.lon),
      is_p2p: contact.isP2p,
      operator_alias: contact.operator || null,
      notes: contact.notes || null,
      contacted_at: contact.timestamp,
    }))
    const { error: deleteError } = await supabase.from('contacts').delete().eq('session_id', session.id)
    if (deleteError) throw deleteError
    const { error: contactsError } = await supabase.from('contacts').upsert(contactRows)
    if (contactsError) throw contactsError
  } else {
    const { error: deleteError } = await supabase.from('contacts').delete().eq('session_id', session.id)
    if (deleteError) throw deleteError
  }

  return { status: 'synced', message: 'Synced securely' }
}
