import { describe, expect, it } from 'vitest'

import { liquidationMovePct, liquidationPrice, positionSize, riskLevel, roiPct } from './risk'

describe('positionSize', () => {
  it('multiplies margin by leverage', () => {
    expect(positionSize(1000, 25)).toBe(25000)
  })
})

describe('liquidationMovePct', () => {
  it.each([
    [1, 100],
    [2, 50],
    [10, 10],
    [25, 4],
    [100, 1],
    [500, 0.2],
  ])('at %p× leverage a %p%% move wipes the margin', (leverage, expected) => {
    expect(liquidationMovePct(leverage)).toBeCloseTo(expected, 10)
  })

  it('refuses a leverage of zero rather than dividing by it', () => {
    expect(liquidationMovePct(0)).toBeNull()
  })
})

describe('liquidationPrice', () => {
  it('sits 10% below entry for a long at 10x', () => {
    expect(liquidationPrice(100, 10, 'long')).toBeCloseTo(90, 10)
  })

  it('sits 10% above entry for a short at 10x', () => {
    expect(liquidationPrice(100, 10, 'short')).toBeCloseTo(110, 10)
  })

  it('equals zero at 1x — an unleveraged long cannot be liquidated early', () => {
    expect(liquidationPrice(100, 1, 'long')).toBe(0)
  })

  it('doubles at 1x for a short — the mirror of the long case', () => {
    expect(liquidationPrice(100, 1, 'short')).toBe(200)
  })
})

describe('roiPct', () => {
  it('measures return against the margin, not the notional', () => {
    expect(roiPct(250, 1000)).toBe(25)
  })

  it('goes negative on a loss', () => {
    expect(roiPct(-400, 1000)).toBe(-40)
  })

  it('returns null with no margin at stake', () => {
    expect(roiPct(100, 0)).toBeNull()
  })
})

describe('riskLevel', () => {
  it.each([
    [1, 'calm'],
    [3, 'calm'],
    [4, 'elevated'],
    [10, 'elevated'],
    [11, 'high'],
    [50, 'high'],
    [51, 'extreme'],
    [500, 'extreme'],
  ])('bands %p× as %s', (leverage, expected) => {
    expect(riskLevel(leverage)).toBe(expected)
  })
})
