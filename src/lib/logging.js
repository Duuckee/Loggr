export function frequencyAfterSubmit(frequencyMode, currentFrequency) {
  return frequencyMode === 'stay' ? currentFrequency : ''
}
