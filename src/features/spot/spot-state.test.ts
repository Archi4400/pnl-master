import { describe, expect, it } from 'vitest'

import { setSpotField, SPOT_INITIAL, spotFromInputs, spotToInputs } from './spot-state'

describe('setSpotField', () => {
  it('follows the typed side of the holding pair', () => {
    const next = setSpotField(SPOT_INITIAL, 'invested', '2000')
    expect(next.holdingSource).toBe('quote')
    expect(next.values.quantity).toBe('20')
  })

  it('moves the non-source side when the price changes', () => {
    const typedCost = setSpotField(SPOT_INITIAL, 'buyCost', '1000')
    const repriced = setSpotField(typedCost, 'buyPrice', '40')
    expect(repriced.values.buyCost).toBe('1000')
    expect(repriced.values.buyQuantity).toBe('25')
  })
})

describe('spot inputs', () => {
  it('round-trips through inputs', () => {
    const state = setSpotField(setSpotField(SPOT_INITIAL, 'invested', '3000'), 'buyCost', '250')
    expect(spotFromInputs(spotToInputs(state))).toEqual(state)
  })

  it('rebuilds the twins from inputs alone', () => {
    const state = spotFromInputs({
      holdingSource: 'quote',
      holding: '1000',
      averagePrice: '50',
      buySource: 'units',
      buy: '4',
      buyPrice: '25',
      salePrice: '60',
    })
    expect(state.values.quantity).toBe('20')
    expect(state.values.buyCost).toBe('100')
  })
})
