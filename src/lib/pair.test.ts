import { describe, expect, it } from 'vitest'

import { syncPair } from './pair'

const keys = { quote: 'usdt', units: 'btc', price: 'price' } as const

describe('syncPair', () => {
  it('converts quote into units through the price', () => {
    const next = syncPair({ usdt: '1000', btc: '', price: '50000' }, keys, 'quote')
    expect(next.btc).toBe('0.02')
  })

  it('converts units into quote through the price', () => {
    const next = syncPair({ usdt: '', btc: '0.5', price: '60000' }, keys, 'units')
    expect(next.usdt).toBe('30000')
  })

  it('never rewrites the source side', () => {
    const values = { usdt: '100,5', btc: '', price: '10' }
    expect(syncPair(values, keys, 'quote').usdt).toBe('100,5')
  })

  it('clears the twin when the source is cleared', () => {
    const next = syncPair({ usdt: '', btc: '0.02', price: '50000' }, keys, 'quote')
    expect(next.btc).toBe('')
  })

  it('leaves the twin alone while there is no usable price', () => {
    expect(syncPair({ usdt: '1000', btc: '0.02', price: '' }, keys, 'quote').btc).toBe('0.02')
    expect(syncPair({ usdt: '1000', btc: '0.02', price: '0' }, keys, 'quote').btc).toBe('0.02')
  })

  it('leaves the twin alone mid-keystroke', () => {
    expect(syncPair({ usdt: '-', btc: '0.02', price: '50000' }, keys, 'quote').btc).toBe('0.02')
  })
})
