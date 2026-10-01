import { describe, expect, it } from 'vitest'

import type { Trade } from './csv'
import {
  computeAllPairs,
  computePairStats,
  computePortfolio,
  quoteAssets,
  unrealizedPct,
  unrealizedPnl,
} from './stats'

let clock = Date.UTC(2024, 0, 15, 12)
function trade(
  side: Trade['side'],
  qty: string,
  price: string,
  overrides: Partial<Trade> = {},
): Trade {
  clock += 3_600_000
  const total = (Number(qty) * Number(price)).toString()
  return {
    time: clock,
    base: 'BTC',
    quote: 'USDT',
    side,
    price,
    qty,
    total,
    fee: '0',
    feeAsset: 'USDT',
    ...overrides,
  }
}

describe('computePairStats — average cost', () => {
  // The manual calculation from the acceptance criteria:
  //   buy 1 @ 100            → position 1, avg 100
  //   buy 1 @ 200            → position 2, avg (1×100 + 1×200) / 2 = 150
  //   sell 1 @ 300           → position 1, avg 150, realised +150
  //   sell 1 @ 100           → position 0, avg reset,  realised −50
  //   buy 2 @ 50             → position 2, avg 50 (fresh basis)
  const trades = [
    trade('buy', '1', '100'),
    trade('buy', '1', '200'),
    trade('sell', '1', '300'),
    trade('sell', '1', '100'),
    trade('buy', '2', '50'),
  ]
  const stats = computePairStats(trades)

  it('follows the weighted average through every step', () => {
    expect(stats.timeline.map((point) => [point.position, point.avgPrice])).toEqual([
      [1, 100],
      [2, 150],
      [1, 150],
      [0, null],
      [2, 50],
    ])
  })

  it('ends with the open position and its basis', () => {
    expect(stats.position.toString()).toBe('2')
    expect(stats.avgPrice?.toString()).toBe('50')
    expect(stats.costBasis.toString()).toBe('100')
  })

  it('sums realised PnL at the average', () => {
    expect(stats.realizedPnl.toString()).toBe('100')
  })

  it('totals quantities and money both ways', () => {
    expect(stats.boughtQty.toString()).toBe('4')
    expect(stats.soldQty.toString()).toBe('2')
    expect(stats.invested.toString()).toBe('400')
    expect(stats.received.toString()).toBe('400')
    expect(stats.buyCount).toBe(3)
    expect(stats.sellCount).toBe(2)
    expect(stats.avgBuySize?.toFixed(4)).toBe('133.3333')
  })

  it('finds the largest buy and the best and worst sells', () => {
    expect(stats.largestBuy?.price).toBe('200')
    expect(stats.bestSell?.pnl.toString()).toBe('150')
    expect(stats.worstSell?.pnl.toString()).toBe('-50')
  })

  it('keeps decimals exact where floats would drift', () => {
    const exact = computePairStats([
      trade('buy', '0.1', '0.3'),
      trade('buy', '0.2', '0.3'),
      trade('sell', '0.3', '0.4'),
    ])
    expect(exact.realizedPnl.toString()).toBe('0.03')
    expect(exact.position.toString()).toBe('0')
  })
})

describe('computePairStats — edge cases', () => {
  it('leaves sells beyond the recorded buys out of the PnL', () => {
    const stats = computePairStats([trade('buy', '1', '100'), trade('sell', '3', '150')])
    expect(stats.realizedPnl.toString()).toBe('50')
    expect(stats.unmatchedSellQty.toString()).toBe('2')
    expect(stats.position.toString()).toBe('0')
  })

  it('has no best or worst sell when there is nothing to compare', () => {
    const stats = computePairStats([trade('buy', '1', '100'), trade('sell', '1', '120')])
    expect(stats.bestSell?.pnl.toString()).toBe('20')
    expect(stats.worstSell).toBeNull()
  })

  it('sums fees by the asset they were paid in', () => {
    const stats = computePairStats([
      trade('buy', '1', '100', { fee: '0.001', feeAsset: 'BNB' }),
      trade('buy', '1', '100', { fee: '0.002', feeAsset: 'BNB' }),
      trade('sell', '1', '100', { fee: '0.1', feeAsset: 'USDT' }),
    ])
    expect(
      Object.fromEntries([...stats.fees].map(([asset, sum]) => [asset, sum.toString()])),
    ).toEqual({
      BNB: '0.003',
      USDT: '0.1',
    })
  })
})

describe('computeAllPairs / computePortfolio', () => {
  const trades = [
    trade('buy', '1', '100'),
    trade('buy', '10', '5', { base: 'SOL' }),
    trade('buy', '1', '90', { quote: 'EUR' }),
    trade('sell', '1', '120'),
  ]
  const pairs = computeAllPairs(trades)

  it('keeps the same coin in different quotes apart', () => {
    expect(pairs.map((pair) => pair.key).sort()).toEqual(['BTC/EUR', 'BTC/USDT', 'SOL/USDT'])
  })

  it('orders quote assets by activity', () => {
    expect(quoteAssets(pairs)).toEqual(['USDT', 'EUR'])
  })

  it('adds up one quote asset at a time', () => {
    const portfolio = computePortfolio(pairs, 'USDT')
    expect(portfolio.pairs).toHaveLength(2)
    expect(portfolio.tradeCount).toBe(3)
    expect(portfolio.invested.toString()).toBe('150')
    expect(portfolio.realizedPnl.toString()).toBe('20')
    expect(portfolio.allocation).toEqual([
      { asset: 'BTC', invested: 100, qty: 1 },
      { asset: 'SOL', invested: 50, qty: 10 },
    ])
  })

  it('fills the monthly series without gaps', () => {
    const spread = computeAllPairs([
      trade('buy', '1', '100', { time: new Date(2024, 0, 10).getTime() }),
      trade('sell', '1', '100', { time: new Date(2024, 2, 10).getTime() }),
    ])
    expect(computePortfolio(spread, 'USDT').monthly).toEqual([
      { month: '2024-01', buy: 100, sell: 0 },
      { month: '2024-02', buy: 0, sell: 0 },
      { month: '2024-03', buy: 0, sell: 100 },
    ])
  })
})

describe('unrealizedPnl', () => {
  const open = computePairStats([trade('buy', '2', '100')])

  it('marks the open position to market', () => {
    expect(unrealizedPnl(open, 130)?.toString()).toBe('60')
  })

  it('is empty without a price or a position', () => {
    expect(unrealizedPnl(open, undefined)).toBeNull()
    const flat = computePairStats([trade('buy', '1', '100'), trade('sell', '1', '100')])
    expect(unrealizedPnl(flat, 130)).toBeNull()
  })
})

describe('unrealizedPct', () => {
  const open = computePairStats([trade('buy', '2', '100')])

  it('measures the move from the average entry', () => {
    expect(unrealizedPct(open, 130)?.toString()).toBe('30')
    expect(unrealizedPct(open, 75)?.toString()).toBe('-25')
  })

  it('is empty without a price or a position', () => {
    expect(unrealizedPct(open, undefined)).toBeNull()
    const flat = computePairStats([trade('buy', '1', '100'), trade('sell', '1', '100')])
    expect(unrealizedPct(flat, 130)).toBeNull()
  })
})
