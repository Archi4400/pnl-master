import { describe, expect, it } from 'vitest'

import {
  clampLeverage,
  computeClosePrice,
  computePnl,
  formatNumber,
  parseNumber,
  sanitizeNumberInput,
  stepNumber,
} from './math'

describe('computePnl', () => {
  it('returns the gain of a profitable long', () => {
    expect(
      computePnl({
        amount: 1000,
        openPrice: 100,
        closePrice: 110,
        leverage: 1,
        direction: 'long' as const,
      }),
    ).toBe(100)
  })

  it('scales linearly with leverage', () => {
    expect(
      computePnl({
        amount: 1000,
        openPrice: 100,
        closePrice: 110,
        leverage: 10,
        direction: 'long' as const,
      }),
    ).toBe(1000)
  })

  it('returns a negative number when the price falls', () => {
    expect(
      computePnl({
        amount: 1000,
        openPrice: 100,
        closePrice: 90,
        leverage: 1,
        direction: 'long' as const,
      }),
    ).toBe(-100)
  })

  it('is zero when the price does not move', () => {
    expect(
      computePnl({
        amount: 1000,
        openPrice: 100,
        closePrice: 100,
        leverage: 20,
        direction: 'long' as const,
      }),
    ).toBe(0)
  })

  it('refuses an open price of zero rather than dividing by it', () => {
    expect(
      computePnl({
        amount: 1000,
        openPrice: 0,
        closePrice: 110,
        leverage: 1,
        direction: 'long' as const,
      }),
    ).toBeNull()
  })
})

describe('computePnl — short', () => {
  it('earns when the price falls', () => {
    expect(
      computePnl({ amount: 1000, openPrice: 100, closePrice: 90, leverage: 1, direction: 'short' }),
    ).toBe(100)
  })

  it('loses when the price rises', () => {
    expect(
      computePnl({
        amount: 1000,
        openPrice: 100,
        closePrice: 110,
        leverage: 1,
        direction: 'short',
      }),
    ).toBe(-100)
  })

  it('is the exact mirror of a long on the same move', () => {
    const base = { amount: 1000, openPrice: 100, closePrice: 137, leverage: 5 } as const
    const long = computePnl({ ...base, direction: 'long' })
    const short = computePnl({ ...base, direction: 'short' })
    expect(long).not.toBeNull()
    expect(short).toBe(-(long as number))
  })
})

describe('computeClosePrice', () => {
  it('inverts computePnl', () => {
    const position = { amount: 1000, openPrice: 100, leverage: 5, direction: 'long' as const }
    const pnl = computePnl({ ...position, closePrice: 137 })
    expect(pnl).not.toBeNull()
    expect(computeClosePrice(position, pnl as number)).toBeCloseTo(137, 10)
  })

  it('solves for a loss', () => {
    expect(
      computeClosePrice({ amount: 1000, openPrice: 100, leverage: 1, direction: 'long' }, -250),
    ).toBe(75)
  })

  it('solves upwards for a short loss', () => {
    // A short losing 250 on 1000 at 1x needs the price 25% above entry.
    expect(
      computeClosePrice({ amount: 1000, openPrice: 100, leverage: 1, direction: 'short' }, -250),
    ).toBe(125)
  })

  it('inverts computePnl for a short', () => {
    const position = { amount: 1000, openPrice: 100, leverage: 5, direction: 'short' as const }
    const pnl = computePnl({ ...position, closePrice: 82 })
    expect(pnl).not.toBeNull()
    expect(computeClosePrice(position, pnl as number)).toBeCloseTo(82, 10)
  })

  it('returns null when nothing is at stake', () => {
    expect(
      computeClosePrice({ amount: 0, openPrice: 100, leverage: 10, direction: 'long' }, 50),
    ).toBeNull()
  })
})

describe('clampLeverage', () => {
  it.each([
    [-20, 1],
    [0, 1],
    [1, 1],
    [125, 125],
    [200, 200],
    [900, 900],
    [Number.NaN, 1],
  ])('clamps %p to %p, with no upper limit', (input, expected) => {
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

describe('sanitizeNumberInput', () => {
  it.each(['', '0', '12', '12.', '12.5', '12,5', '.5'])('lets %j through', (raw) => {
    expect(sanitizeNumberInput(raw)).toBe(raw)
  })

  it.each(['abc', '12a', '1e5', '1.2.3', '1,2.3', '+5', '-5'])('rejects %j', (raw) => {
    expect(sanitizeNumberInput(raw)).toBeNull()
  })

  it('drops whitespace from pasted numbers', () => {
    expect(sanitizeNumberInput(' 1 000.5 ')).toBe('1000.5')
  })

  it('allows a leading minus only when asked to', () => {
    expect(sanitizeNumberInput('-', { allowNegative: true })).toBe('-')
    expect(sanitizeNumberInput('-12.5', { allowNegative: true })).toBe('-12.5')
    expect(sanitizeNumberInput('1-2', { allowNegative: true })).toBeNull()
    expect(sanitizeNumberInput('--1', { allowNegative: true })).toBeNull()
  })
})

describe('stepNumber', () => {
  it.each([
    ['100', 1, '101'],
    ['100', -1, '99'],
    ['12.5', 1, '12.6'],
    ['12,5', -1, '12.4'],
    ['0.020', 1, '0.021'],
    ['12.', 1, '13'],
  ] as const)('steps %j by its last typed digit (%i) to %j', (raw, direction, expected) => {
    expect(stepNumber(raw, direction)).toBe(expected)
  })

  it('does not accumulate float error', () => {
    expect(stepNumber('0.2', 1)).toBe('0.3')
    expect(stepNumber('1.10', 1)).toBe('1.11')
  })

  it('uses an explicit step when given', () => {
    expect(stepNumber('10', 1, { step: 1 })).toBe('11')
    expect(stepNumber('10.5', 1, { step: 1 })).toBe('11.5')
  })

  it('scales the step with the multiplier', () => {
    expect(stepNumber('100', 1, { multiplier: 10 })).toBe('110')
    expect(stepNumber('1.5', -1, { multiplier: 10 })).toBe('0.5')
  })

  it('starts from zero when the field is empty or partial', () => {
    expect(stepNumber('', 1)).toBe('1')
    expect(stepNumber('-', 1, { allowNegative: true })).toBe('1')
  })

  it('stops at zero unless negatives are allowed', () => {
    expect(stepNumber('0', -1)).toBe('0')
    expect(stepNumber('0.5', -1, { multiplier: 10 })).toBe('0.0')
    expect(stepNumber('0', -1, { allowNegative: true })).toBe('-1')
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
