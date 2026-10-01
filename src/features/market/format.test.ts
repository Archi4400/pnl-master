import { describe, expect, it } from 'vitest'

import { changeTone, formatChange, priceToField } from './format'

describe('priceToField', () => {
  it('writes a plain number the fields accept', () => {
    expect(priceToField(83800)).toBe('83800')
    expect(priceToField(0.00001234)).toBe('0.00001234')
  })
})

describe('formatChange', () => {
  it.each([
    [1.234, '+1.23%'],
    [-0.4, '−0.40%'],
    [0.001, '0.00%'],
  ])('formats %p as %p', (change, expected) => {
    expect(formatChange(change)).toBe(expected)
  })
})

describe('changeTone', () => {
  it('is green up, red down, neutral when flat or unknown', () => {
    expect(changeTone(2)).toBe('text-profit')
    expect(changeTone(-2)).toBe('text-loss')
    expect(changeTone(0)).toBe('text-content-muted')
    expect(changeTone(undefined)).toBe('text-content-muted')
  })
})
