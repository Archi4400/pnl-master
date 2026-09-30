import { describe, expect, it } from 'vitest'

import { signedTone } from './tone'

describe('signedTone', () => {
  it('is green for gains and red for losses', () => {
    expect(signedTone(5)).toBe('text-profit')
    expect(signedTone(-5)).toBe('text-loss')
  })

  it('has no colour for zero, flat moves or no value', () => {
    expect(signedTone(0)).toBeUndefined()
    expect(signedTone(0.001, { flat: 0.005 })).toBeUndefined()
    expect(signedTone(null)).toBeUndefined()
  })

  it('uses the slab palette on the inverted surface', () => {
    expect(signedTone(5, { surface: 'invert' })).toBe('text-profit-invert')
  })

  it('flips when lower is better', () => {
    expect(signedTone(-5, { lowerIsBetter: true })).toBe('text-profit')
  })
})
