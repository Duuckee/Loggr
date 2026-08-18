// Entry-mode helpers keep Hunt and Stay reset behavior explicit and testable.
export function frequencyAfterSubmit(frequencyMode, currentFrequency) {
  return frequencyMode === 'stay' ? currentFrequency : ''
}
