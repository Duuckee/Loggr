// Domain models protect contact and session state behind small class APIs.

export class Contact {
  #record

  constructor(data = {}) {
    // Normalize values once when a contact object is created.
    this.#record = {
      ...data,
      callsign: String(data.callsign ?? '').trim().toUpperCase(),
      isP2p: Boolean(data.isP2p),
      notes: String(data.notes ?? '').trim(),
      timestamp: data.timestamp || new Date().toISOString(),
    }
  }

  get id() {
    return this.#record.id
  }

  get callsign() {
    return this.#record.callsign
  }

  // Return a copy so callers cannot mutate the private record directly.
  toRecord() {
    return {
      ...this.#record,
      lookup: this.#record.lookup ? { ...this.#record.lookup } : null,
    }
  }
}

export class LoggingSession {
  #record

  constructor(data = {}) {
    if (!data || typeof data !== 'object') throw new TypeError('A session record is required.')
    this.#record = {
      ...data,
      contacts: Array.isArray(data.contacts) ? data.contacts.map((contact) => new Contact(contact).toRecord()) : [],
      operators: Array.isArray(data.operators) ? [...data.operators] : [],
    }
  }

  get id() {
    return this.#record.id
  }

  get contactCount() {
    return this.#record.contacts.length
  }

  addContact(contact) {
    const nextContact = contact instanceof Contact ? contact.toRecord() : new Contact(contact).toRecord()
    return this.#withContacts([...this.#record.contacts, nextContact])
  }

  updateContact(contact) {
    const nextContact = contact instanceof Contact ? contact.toRecord() : new Contact(contact).toRecord()
    return this.#withContacts(this.#record.contacts.map((item) => item.id === nextContact.id ? nextContact : item))
  }

  removeContact(contactId) {
    return this.#withContacts(this.#record.contacts.filter((contact) => contact.id !== contactId))
  }

  withChanges(changes) {
    return new LoggingSession({ ...this.#record, ...changes }).toRecord()
  }

  complete(endTime = new Date().toISOString()) {
    return this.withChanges({ endTime, status: 'ended' })
  }

  toRecord() {
    return {
      ...this.#record,
      operators: [...this.#record.operators],
      contacts: this.#record.contacts.map((contact) => ({ ...contact })),
    }
  }

  #withContacts(contacts) {
    return new LoggingSession({ ...this.#record, contacts }).toRecord()
  }
}
