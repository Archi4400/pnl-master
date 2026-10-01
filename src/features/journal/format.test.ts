import { describe, expect, it } from 'vitest'

import { formatMoney, formatQty, formatUnitPrice, quoteDecimals } from './format'

describe('formatQty', () => {
  it.each([
    [10039.29398378, '10,039.29'],
    [22.7143636, '22.7144'],
    [0.0361819, '0.0361819'],
    [0.00000092, '0.00000092'],
  ])('formats %p as %p', (value, expected) => {
    expect(formatQty(value, 'en')).toBe(expected)
  })
})

describe('money and prices', () => {
  it('keeps fiat-like quotes to cents and crypto quotes to satoshis', () => {
    expect(quoteDecimals('USDT')).toBe(2)
    expect(quoteDecimals('BTC')).toBe(8)
    expect(formatMoney(1234.5678, 'USDT', 'en')).toBe('1,234.57')
    expect(formatMoney(0.00012345, 'BTC', 'en')).toBe('0.00012345')
  })

  it('shows a cheap coin price with significant digits', () => {
    expect(formatUnitPrice(0.09775, 'en')).toBe('0.09775')
  })
})
