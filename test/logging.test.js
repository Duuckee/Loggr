import test from 'node:test'
import assert from 'node:assert/strict'
import { frequencyAfterSubmit } from '../src/lib/logging.js'

test('Stay mode retains the current frequency after a QSO', () => {
  assert.equal(frequencyAfterSubmit('stay', '14.200'), '14.200')
})

test('Hunt mode clears the frequency after a QSO', () => {
  assert.equal(frequencyAfterSubmit('hunt', '14.200'), '')
})
