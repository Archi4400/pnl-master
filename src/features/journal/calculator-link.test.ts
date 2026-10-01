import { describe, expect, it } from 'vitest'

import { decodeSnapshot } from '@/features/share/snapshot'

import { calculatorLink } from './calculator-link'
import type { Trade } from './csv'
import { computePairStats } from './stats'

let clock = Date.UTC(2024, 0, 1)

function trade(side: Trade['side'], qty: string, price: string, quote = 'USDT'): Trade {
  clock += 3_600_000
  return {
    time: clock,
    base: 'BTC',
    quote,
    side,
    price,
    qty,
    total: (Number(qty) * Number(price)).toString(),
    fee: '0',
    feeAsset: quote,
  }
}

/** What the calculator page would read back from the link. */
function decode(link: string) {
  const url = new URL(link, 'https://pnl.example')
  expect(url.pathname).toBe('/')
  expect(url.hash).toBe('#calculator')
  return decodeSnapshot(url.searchParams)
}

describe('calculatorLink', () => {
  it('opens the spot calculator on the open position at market', () => {
    const pair = computePairStats([trade('buy', '1', '100'), trade('buy', '1', '200')])
    expect(decode(calculatorLink(pair, 180)!)).toEqual({
      mode: 'spot',
      asset: 'BTC',
      spot: {
        holdingSource: 'units',
        holding: '2',
        averagePrice: '150',
        buySource: 'units',
        buy: '0',
        buyPrice: '180',
        salePrice: '180',
      },
    })
  })

  it('falls back to the average entry before prices load', () => {
    const pair = computePairStats([trade('buy', '0.5', '60000')])
    const spot = decode(calculatorLink(pair, undefined)!)
    expect(spot).toMatchObject({ spot: { buyPrice: '60000', salePrice: '60000' } })
  })

  it('writes tiny prices as plain decimals the calculator accepts', () => {
    const pair = computePairStats([trade('buy', '1000000', '0.0000092')])
    const spot = decode(calculatorLink(pair, 0.00000095)!)
    expect(spot).toMatchObject({ spot: { averagePrice: '0.0000092', salePrice: '0.00000095' } })
  })

  it('leaves the coin out for pairs not quoted in USDT', () => {
    const pair = computePairStats([trade('buy', '1', '0.05', 'BTC')])
    expect(decode(calculatorLink(pair, 0.06)!)?.asset).toBeNull()
  })

  it('has nothing to open for a flat position', () => {
    const pair = computePairStats([trade('buy', '1', '100'), trade('sell', '1', '120')])
    expect(calculatorLink(pair, 130)).toBeNull()
  })
})
