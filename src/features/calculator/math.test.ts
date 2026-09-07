import { describe, expect, it } from 'vitest'

import {
  clampLeverage,
  computeClosePrice,
  computePnl,
  formatNumber,
  parseNumber,
} from './math'

describe('computePnl', () => {
  it('returns the gain of a profitable long', () => {
    expect(computePnl({ amount: 1000, openPrice: 100, closePrice: 110, leverage: 1 })).toBe(100)
  })

  it('scales linearly with leverage', () => {
    expect(computePnl({ amount: 1000, openPrice: 100, closePrice: 110, leverage: 10 })).toBe(1000)
  })

  it('returns a negative number when the price falls', () => {
    expect(computePnl({ amount: 1000, openPrice: 100, closePrice: 90, leverage: 1 })).toBe(-100)
  })

  it('is zero when the price does not move', () => {
    expect(computePnl({ amount: 1000, openPrice: 100, closePrice: 100, leverage: 20 })).toBe(0)
  })

  it('refuses an open price of zero rather than dividing by it', () => {
    expect(computePnl({ amount: 1000, openPrice: 0, closePrice: 110, leverage: 1 })).toBeNull()
  })
})

describe('computeClosePrice', () => {
  it('inverts computePnl', () => {
    const position = { amount: 1000, openPrice: 100, leverage: 5 }
    const pnl = computePnl({ ...position, closePrice: 137 })
    expect(pnl).not.toBeNull()
    expect(computeClosePrice(position, pnl as number)).toBeCloseTo(137, 10)
  })

  it('solves for a loss', () => {
    expect(computeClosePrice({ amount: 1000, openPrice: 100, leverage: 1 }, -250)).toBe(75)
  })

  it('returns null when nothing is at stake', () => {
    expect(computeClosePrice({ amount: 0, openPrice: 100, leverage: 10 }, 50)).toBeNull()
  })
})

describe('clampLeverage', () => {
  it.each([
    [-20, 1],
    [0, 1],
    [1, 1],
    [125, 125],
    [500, 500],
    [900, 500],
    [Number.NaN, 1],
  ])('clamps %p to %p', (input, expected) => {
    expect(clampLeverage(input)).toBe(expected)
  })
})

describe('parseNumber', () => {
  it('accepts a comma as the decimal separator', () => {
    expect(parseNumber('12,5')).toBe(12.5)
  })

  it('treats partial input as no value yet', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('-')).toBeNull()
    expect(parseNumber('.')).toBeNull()
  })

  it('rejects text', () => {
    expect(parseNumber('abc')).toBeNull()
  })
})

describe('formatNumber', () => {
  it('trims trailing zeros', () => {
    expect(formatNumber(110.5, 2)).toBe('110.5')
    expect(formatNumber(110, 2)).toBe('110')
  })

  it('rounds to the requested precision', () => {
    expect(formatNumber(1 / 3, 2)).toBe('0.33')
  })
})
