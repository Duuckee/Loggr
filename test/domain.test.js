// Domain tests demonstrate constructors, encapsulation, inheritance, and polymorphism.
import test from 'node:test'
import assert from 'node:assert/strict'
import { Contact, LoggingSession } from '../src/domain/models.js'
import { FrequencyPolicy, HuntFrequencyPolicy, StayFrequencyPolicy, getFrequencyPolicy } from '../src/domain/frequencyPolicies.js'

test('Contact constructor normalizes data and protects its private record', () => {
  const contact = new Contact({ id: 'contact-1', callsign: ' vk3abc ', notes: ' Field test ', isP2p: 1 })
  const exposedRecord = contact.toRecord()
  exposedRecord.callsign = 'CHANGED'

  assert.equal(contact.callsign, 'VK3ABC')
  assert.equal(contact.toRecord().callsign, 'VK3ABC')
  assert.equal(contact.toRecord().notes, 'Field test')
  assert.equal(contact.toRecord().isP2p, true)
})

test('LoggingSession methods update copies without mutating the source object', () => {
  const original = { id: 'session-1', operators: ['VK3LOG'], contacts: [] }
  const session = new LoggingSession(original)
  const withContact = session.addContact({ id: 'contact-1', callsign: 'VK3ABC' })
  const updated = new LoggingSession(withContact).updateContact({ id: 'contact-1', callsign: 'VK3XYZ' })
  const completed = new LoggingSession(updated).complete('2026-08-18T04:00:00.000Z')

  assert.equal(session.contactCount, 0)
  assert.equal(withContact.contacts[0].callsign, 'VK3ABC')
  assert.equal(updated.contacts[0].callsign, 'VK3XYZ')
  assert.equal(completed.status, 'ended')
  assert.equal(new LoggingSession(updated).removeContact('contact-1').contacts.length, 0)
})

test('Hunt and Stay inherit one interface and respond polymorphically', () => {
  const policies = [new HuntFrequencyPolicy(), new StayFrequencyPolicy()]

  assert.ok(policies.every((policy) => policy instanceof FrequencyPolicy))
  assert.deepEqual(policies.map((policy) => policy.nextFrequency('14.200')), ['', '14.200'])
  assert.equal(getFrequencyPolicy('unknown').mode, 'hunt')
})
