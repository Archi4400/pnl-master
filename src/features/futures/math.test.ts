import { describe, expect, it } from 'vitest'

import {
  clampLeverage,
  computeClosePrice,
  computePnl,
  isPnlReachable,
  pnlAtZeroPrice,
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

  it('refuses a loss that would need a negative price', () => {
    // 12.5 at 1x: the price hitting 0 loses 12.5, so a 50 loss has no exit.
    const position = { amount: 12.5, openPrice: 100, leverage: 1, direction: 'long' as const }
    expect(computeClosePrice(position, -50)).toBeNull()
    expect(computeClosePrice(position, -12.5)).toBe(0)
  })

  it('refuses a short profit beyond the price reaching zero', () => {
    const position = { amount: 100, openPrice: 50, leverage: 2, direction: 'short' as const }
    expect(computeClosePrice(position, 250)).toBeNull()
    expect(computeClosePrice(position, 200)).toBe(0)
  })
})

describe('pnlAtZeroPrice / isPnlReachable', () => {
  it('caps a long loss at the notional', () => {
    const long = { amount: 100, leverage: 10, direction: 'long' as const }
    expect(pnlAtZeroPrice(long)).toBe(-1000)
    expect(isPnlReachable(long, -1000)).toBe(true)
    expect(isPnlReachable(long, -1001)).toBe(false)
    expect(isPnlReachable(long, 99999)).toBe(true)
  })

  it('caps a short profit at the notional', () => {
    const short = { amount: 100, leverage: 10, direction: 'short' as const }
    expect(pnlAtZeroPrice(short)).toBe(1000)
    expect(isPnlReachable(short, 1001)).toBe(false)
    expect(isPnlReachable(short, -99999)).toBe(true)
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
