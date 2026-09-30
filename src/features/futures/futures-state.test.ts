import { describe, expect, it } from 'vitest'

import {
  FUTURES_INITIAL,
  futuresFromInputs,
  futuresToInputs,
  normalizeFuturesLeverage,
  setFuturesDirection,
  setFuturesField,
} from './futures-state'

describe('setFuturesField', () => {
  it('re-derives the PnL when a price changes', () => {
    const next = setFuturesField(FUTURES_INITIAL, 'closePrice', '120')
    expect(next.values.pnl).toBe('200')
  })

  it('solves the close price when the PnL is typed', () => {
    const next = setFuturesField(FUTURES_INITIAL, 'pnl', '-50')
    expect(next.values.closePrice).toBe('95')
  })

  it('keeps the margin units when leverage changes', () => {
    const next = setFuturesField(FUTURES_INITIAL, 'leverage', '25')
    expect(next.values.amountUnits).toBe('10')
    expect(next.values.pnl).toBe('2500')
  })

  it('makes the last-typed margin side the source', () => {
    const typedUnits = setFuturesField(FUTURES_INITIAL, 'amountUnits', '0.5')
    expect(typedUnits.amountSource).toBe('units')
    expect(typedUnits.values.amount).toBe('50')

    // A price change now moves the USDT side, not the units.
    const repriced = setFuturesField(typedUnits, 'openPrice', '200')
    expect(repriced.values.amountUnits).toBe('0.5')
    expect(repriced.values.amount).toBe('100')
  })

  it('clamps leverage below 1 as it is typed', () => {
    expect(setFuturesField(FUTURES_INITIAL, 'leverage', '0').values.leverage).toBe('1')
  })
})

describe('setFuturesDirection', () => {
  it('flips the sign of the same move', () => {
    const next = setFuturesDirection(FUTURES_INITIAL, 'short')
    expect(next.values.pnl).toBe('-100')
  })
})

describe('normalizeFuturesLeverage', () => {
  it('refills an emptied leverage', () => {
    const emptied = setFuturesField(FUTURES_INITIAL, 'leverage', '')
    expect(normalizeFuturesLeverage(emptied).values.leverage).toBe('1')
  })

  it('leaves a filled leverage alone', () => {
    expect(normalizeFuturesLeverage(FUTURES_INITIAL)).toBe(FUTURES_INITIAL)
  })
})

describe('futures inputs', () => {
  it('round-trips through inputs', () => {
    const state = setFuturesField(
      setFuturesField(FUTURES_INITIAL, 'amountUnits', '0.25'),
      'leverage',
      '10',
    )
    expect(futuresFromInputs(futuresToInputs(state))).toEqual(state)
  })

  it('rebuilds the derived fields from inputs alone', () => {
    const state = futuresFromInputs({
      direction: 'short',
      amountSource: 'quote',
      amount: '500',
      openPrice: '50000',
      closePrice: '45000',
      leverage: '10',
    })
    expect(state.values.amountUnits).toBe('0.01')
    expect(state.values.pnl).toBe('500')
  })
})
