// Frequency policies use inheritance so the logger can change reset behavior polymorphically.

export class FrequencyPolicy {
  #mode

  constructor(mode) {
    this.#mode = mode
  }

  get mode() {
    return this.#mode
  }

  nextFrequency(currentFrequency) {
    return currentFrequency
  }
}

export class HuntFrequencyPolicy extends FrequencyPolicy {
  constructor() {
    super('hunt')
  }

  // Hunters move between stations, so the next frequency starts empty.
  nextFrequency() {
    return ''
  }
}

export class StayFrequencyPolicy extends FrequencyPolicy {
  constructor() {
    super('stay')
  }

  // Staying on one frequency carries it into the next contact.
  nextFrequency(currentFrequency) {
    return currentFrequency
  }
}

const FREQUENCY_POLICIES = new Map([
  ['hunt', new HuntFrequencyPolicy()],
  ['stay', new StayFrequencyPolicy()],
])

export function getFrequencyPolicy(mode) {
  return FREQUENCY_POLICIES.get(mode) || FREQUENCY_POLICIES.get('hunt')
}
