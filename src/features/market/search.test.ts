import { describe, expect, it } from 'vitest'

import { orderAssets } from './search'

const assets = ['ETHFI', 'SOL', 'ETH', 'BTC', 'WETH', 'SOLV', 'PEPE', 'AAVE', 'SONIC']
const popular = ['BTC', 'ETH', 'SOL']

describe('orderAssets without a query', () => {
  it('lists popular coins first, then the rest alphabetically', () => {
    expect(orderAssets(assets, '', popular)).toEqual([
      'BTC',
      'ETH',
      'SOL',
      'AAVE',
      'ETHFI',
      'PEPE',
      'SOLV',
      'SONIC',
      'WETH',
    ])
  })
})

describe('orderAssets with a query', () => {
  it('puts the exact ticker first, then prefixes, then other matches', () => {
    expect(orderAssets(assets, 'eth', popular)).toEqual(['ETH', 'ETHFI', 'WETH'])
  })

  it('lets popular coins win among equal matches', () => {
    expect(orderAssets(assets, 'so', popular)).toEqual(['SOL', 'SOLV', 'SONIC'])
  })

  it('ignores case and surrounding spaces', () => {
    expect(orderAssets(assets, '  pepe ', popular)).toEqual(['PEPE'])
  })

  it('returns nothing for an unknown ticker', () => {
    expect(orderAssets(assets, 'XYZ', popular)).toEqual([])
  })
})
