// Entry-mode helpers keep Hunt and Stay reset behavior explicit and testable.
import { getFrequencyPolicy } from '../domain/frequencyPolicies.js'

export function frequencyAfterSubmit(frequencyMode, currentFrequency) {
  // Both subclasses expose the same method but provide different behavior.
  return getFrequencyPolicy(frequencyMode).nextFrequency(currentFrequency)
}
