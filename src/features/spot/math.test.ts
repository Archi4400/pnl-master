import { describe, expect, it } from 'vitest'

import { averageAfterPurchase, quantityFor, saleOutcome } from './math'

describe('quantityFor', () => {
  it('divides the spend by the price', () => {
    expect(quantityFor({ amount: 500, price: 50 })).toBe(10)
  })

  it('buys nothing when nothing is spent, whatever the price', () => {
    expect(quantityFor({ amount: 0, price: 0 })).toBe(0)
  })

  it('refuses to spend money at a price of zero', () => {
    expect(quantityFor({ amount: 100, price: 0 })).toBeNull()
  })

  it('rejects negative input', () => {
    expect(quantityFor({ amount: -1, price: 10 })).toBeNull()
  })
})

describe('averageAfterPurchase', () => {
  it('weights the average by quantity, not by number of buys', () => {
    // 10 @ 100 = 1000, plus 500 buys 10 @ 50 → 1500 / 20 = 75.
    const result = averageAfterPurchase({ quantity: 10, averagePrice: 100 }, { amount: 500, price: 50 })
    expect(result).toMatchObject({ boughtQuantity: 10, quantity: 20, cost: 1500, averagePrice: 75 })
    expect(result?.averageShiftPct).toBeCloseTo(-25, 10)
  })

  it('raises the average when buying above it', () => {
    const result = averageAfterPurchase({ quantity: 1, averagePrice: 100 }, { amount: 200, price: 200 })
    expect(result?.averagePrice).toBeCloseTo(150, 10)
    expect(result?.averageShiftPct).toBeCloseTo(50, 10)
  })

  it('leaves the holding unchanged with an empty purchase', () => {
    const result = averageAfterPurchase({ quantity: 2, averagePrice: 30 }, { amount: 0, price: 0 })
    expect(result).toMatchObject({ quantity: 2, cost: 60, averagePrice: 30, averageShiftPct: 0 })
  })

  it('starts a position from nothing, with no shift to report', () => {
    const result = averageAfterPurchase({ quantity: 0, averagePrice: 0 }, { amount: 100, price: 25 })
    expect(result).toMatchObject({ quantity: 4, averagePrice: 25, averageShiftPct: null })
  })

  it('has no average when nothing is held or bought', () => {
    expect(averageAfterPurchase({ quantity: 0, averagePrice: 0 }, { amount: 0, price: 0 })).toBeNull()
  })
})

describe('saleOutcome', () => {
  it('reports profit against the cost basis', () => {
    expect(saleOutcome({ quantity: 20, cost: 1500 }, 90)).toEqual({ value: 1800, pnl: 300, roiPct: 20 })
  })

  it('reports a loss below the average', () => {
    expect(saleOutcome({ quantity: 20, cost: 1500 }, 60)).toEqual({ value: 1200, pnl: -300, roiPct: -20 })
  })

  it('breaks even exactly at the average price', () => {
    expect(saleOutcome({ quantity: 20, cost: 1500 }, 75)?.pnl).toBe(0)
  })
})
