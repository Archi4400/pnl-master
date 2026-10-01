import { describe, expect, it } from 'vitest'

import {
  formatAmount,
  formatNumber,
  formatPrice,
  formatSigned,
  NO_VALUE,
  parseNumber,
  sanitizeNumberInput,
  stepNumber,
} from './number'

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

describe('formatAmount', () => {
  it('groups digits for the locale', () => {
    expect(formatAmount(1500.5, 'en')).toBe('1,500.5')
    expect(formatAmount(1500.5, 'uk')).toBe('1\u00a0500,5')
  })

  it('uses a true minus sign', () => {
    expect(formatAmount(-12.5, 'en')).toBe('−12.5')
  })

  it('shows a dash for a non-number', () => {
    expect(formatAmount(Number.NaN, 'en')).toBe(NO_VALUE)
  })
})

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

describe('formatSigned', () => {
  it.each([
    [300, '+300'],
    [-12.5, '−12.5'],
    [1234.567, '+1,234.57'],
    [0, '0'],
    [0.001, '0'],
  ])('formats %p as %p', (value, expected) => {
    expect(formatSigned(value, 'en')).toBe(expected)
  })
})
