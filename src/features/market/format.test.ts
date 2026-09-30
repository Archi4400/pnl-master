import { describe, expect, it } from 'vitest'

import { changeTone, formatChange, formatPrice, priceToField } from './format'

describe('formatPrice', () => {
  it.each([
    [83800.123, '83,800.12'],
    [3.45678, '3.4568'],
    [0.1234567, '0.1235'],
    [0.00001234567, '0.00001235'],
  ])('formats %p as %p', (price, expected) => {
    expect(formatPrice(price, 'en')).toBe(expected)
  })
})

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
