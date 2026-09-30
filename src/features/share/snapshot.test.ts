import { describe, expect, it } from 'vitest'

import { decodeSnapshot, encodeSnapshot, readMode, type Snapshot } from './snapshot'

const futures: Snapshot = {
  mode: 'futures',
  asset: 'BTC',
  futures: {
    direction: 'short',
    amountSource: 'units',
    amount: '0.02',
    openPrice: '64000',
    closePrice: '60000',
    leverage: '10',
  },
}

const spot: Snapshot = {
  mode: 'spot',
  asset: null,
  spot: {
    holdingSource: 'quote',
    holding: '1000',
    averagePrice: '100',
    buySource: 'units',
    buy: '10',
    buyPrice: '50',
    salePrice: '90',
  },
}

describe('encodeSnapshot / decodeSnapshot', () => {
  it.each([futures, spot])('round-trips a $mode snapshot', (snapshot) => {
    expect(decodeSnapshot(encodeSnapshot(snapshot))).toEqual(snapshot)
  })

  it('writes a short readable query', () => {
    expect(encodeSnapshot(futures).toString()).toBe(
      'asset=BTC&side=short&qty=0.02&open=64000&close=60000&lev=10',
    )
  })

  it('survives being embedded in a full URL', () => {
    const url = new URL(`https://example.com/?${encodeSnapshot(spot)}`)
    expect(decodeSnapshot(url.searchParams)).toEqual(spot)
  })
})

describe('decodeSnapshot', () => {
  it('ignores a link without inputs, like the old ?mode=spot', () => {
    expect(decodeSnapshot(new URLSearchParams('mode=spot'))).toBeNull()
  })

  it('rejects a link with a missing input', () => {
    const params = encodeSnapshot(futures)
    params.delete('open')
    expect(decodeSnapshot(params)).toBeNull()
  })

  it('rejects numbers the fields would not accept', () => {
    const params = encodeSnapshot(futures)
    params.set('lev', '1e9')
    expect(decodeSnapshot(params)).toBeNull()
    params.set('lev', '-5')
    expect(decodeSnapshot(params)).toBeNull()
  })

  it('drops an asset that is not a ticker but keeps the calculation', () => {
    const params = encodeSnapshot(futures)
    params.set('asset', '<script>')
    expect(decodeSnapshot(params)).toMatchObject({ mode: 'futures', asset: null })
  })
})

describe('readMode', () => {
  it('defaults to futures', () => {
    expect(readMode(new URLSearchParams(''))).toBe('futures')
    expect(readMode(new URLSearchParams('mode=nonsense'))).toBe('futures')
    expect(readMode(new URLSearchParams('mode=spot'))).toBe('spot')
  })
})
