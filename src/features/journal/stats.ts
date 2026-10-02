import { Big } from 'big.js'

import type { Side, Trade } from './csv'

/**
 * Per-pair and portfolio statistics over normalised trades.
 *
 * Cost basis is the weighted average (the same method the spot calculator
 * uses), not FIFO:
 *
 *   buy:  avg = (position × avg + qty × price) / (position + qty)
 *   sell: avg unchanged, position shrinks; realised PnL = (price − avg) × qty
 *   position back to 0: avg resets, the next buy starts a fresh basis
 *
 * Pairs are kept apart by quote asset (BTC/USDT and BTC/EUR are two rows):
 * averaging prices in different currencies without conversion is meaningless.
 * All money is big.js; numbers only appear at the edges, for charts.
 */

export type PairKey = string

export function pairKey(base: string, quote: string): PairKey {
  return `${base}/${quote}`
}

export type TimelinePoint = {
  time: number
  side: Side
  price: number
  qty: number
  /** What the trade cost or brought in, in the quote asset, as the file reports it. */
  total: number
  /** Position right after this trade. */
  position: number
  /** Average entry after this trade; null while flat. */
  avgPrice: number | null
}

export type SellResult = { trade: Trade; pnl: Big }

export type PairStats = {
  key: PairKey
  base: string
  quote: string
  /** Oldest first. */
  trades: Trade[]
  buyCount: number
  sellCount: number
  boughtQty: Big
  soldQty: Big
  position: Big
  /** Average entry of the open position; null when flat. */
  avgPrice: Big | null
  /** What the open position cost at that average. */
  costBasis: Big
  /** Quote spent on buys. */
  invested: Big
  /** Quote received from sells. */
  received: Big
  realizedPnl: Big
  /**
   * Units sold beyond what the file shows being bought (e.g. coins that came
   * in by deposit). Their cost is unknown, so they are left out of the PnL.
   */
  unmatchedSellQty: Big
  /** Keyed by fee asset: fees are often paid in BNB, not the pair's assets. */
  fees: Map<string, Big>
  firstTime: number
  lastTime: number
  /** Average quote amount per buy. */
  avgBuySize: Big | null
  largestBuy: Trade | null
  bestSell: SellResult | null
  worstSell: SellResult | null
  timeline: TimelinePoint[]
}

const ZERO = new Big(0)

function addFee(fees: Map<string, Big>, asset: string, amount: Big) {
  if (amount.eq(0)) return
  fees.set(asset, (fees.get(asset) ?? ZERO).plus(amount))
}

/** Statistics for one pair. `trades` must all be that pair, oldest first. */
export function computePairStats(trades: readonly Trade[]): PairStats {
  const first = trades[0]
  if (!first) throw new Error('computePairStats needs at least one trade')

  let position = ZERO
  let avg: Big | null = null
  let boughtQty = ZERO
  let soldQty = ZERO
  let invested = ZERO
  let received = ZERO
  let realizedPnl = ZERO
  let unmatchedSellQty = ZERO
  let buyCount = 0
  let sellCount = 0
  let largestBuy: Trade | null = null
  let bestSell: SellResult | null = null
  let worstSell: SellResult | null = null
  const fees = new Map<string, Big>()
  const timeline: TimelinePoint[] = []

  for (const trade of trades) {
    const qty = new Big(trade.qty)
    const price = new Big(trade.price)
    const total = new Big(trade.total)
    addFee(fees, trade.feeAsset, new Big(trade.fee))

    if (trade.side === 'buy') {
      buyCount++
      boughtQty = boughtQty.plus(qty)
      invested = invested.plus(total)
      avg =
        position.eq(0) || avg === null
          ? price
          : position.times(avg).plus(qty.times(price)).div(position.plus(qty))
      position = position.plus(qty)
      if (!largestBuy || total.gt(largestBuy.total)) largestBuy = trade
    } else {
      sellCount++
      soldQty = soldQty.plus(qty)
      received = received.plus(total)
      // Only what the file shows being bought has a known cost.
      const matched = qty.gt(position) ? position : qty
      unmatchedSellQty = unmatchedSellQty.plus(qty.minus(matched))
      if (matched.gt(0) && avg !== null) {
        const pnl = price.minus(avg).times(matched)
        realizedPnl = realizedPnl.plus(pnl)
        if (!bestSell || pnl.gt(bestSell.pnl)) bestSell = { trade, pnl }
        if (!worstSell || pnl.lt(worstSell.pnl)) worstSell = { trade, pnl }
      }
      position = position.minus(matched)
      if (position.eq(0)) avg = null
    }

    timeline.push({
      time: trade.time,
      side: trade.side,
      price: price.toNumber(),
      qty: qty.toNumber(),
      total: total.toNumber(),
      position: position.toNumber(),
      avgPrice: avg?.toNumber() ?? null,
    })
  }

  const last = trades[trades.length - 1] as Trade
  return {
    key: pairKey(first.base, first.quote),
    base: first.base,
    quote: first.quote,
    trades: [...trades],
    buyCount,
    sellCount,
    boughtQty,
    soldQty,
    position,
    avgPrice: avg,
    costBasis: avg ? avg.times(position) : ZERO,
    invested,
    received,
    realizedPnl,
    unmatchedSellQty,
    fees,
    firstTime: first.time,
    lastTime: last.time,
    avgBuySize: buyCount > 0 ? invested.div(buyCount) : null,
    largestBuy,
    // A single profitable sell is the best and not also "the worst".
    bestSell: bestSell && bestSell.pnl.gt(0) ? bestSell : null,
    worstSell: worstSell && worstSell.pnl.lt(0) ? worstSell : null,
    timeline,
  }
}

/** Every pair in the trades, largest invested amount first. */
export function computeAllPairs(trades: readonly Trade[]): PairStats[] {
  const byPair = new Map<PairKey, Trade[]>()
  for (const trade of trades) {
    const key = pairKey(trade.base, trade.quote)
    const list = byPair.get(key)
    if (list) list.push(trade)
    else byPair.set(key, [trade])
  }
  return [...byPair.values()]
    .map((list) => computePairStats([...list].sort((a, b) => a.time - b.time)))
    .sort((a, b) => b.invested.cmp(a.invested))
}

export type MonthVolume = { month: string; buy: number; sell: number }

export type PortfolioStats = {
  /** Quote assets present, most traded first; every figure below is in `quote`. */
  quotes: string[]
  quote: string
  pairs: PairStats[]
  tradeCount: number
  invested: Big
  received: Big
  realizedPnl: Big
  /** Across all pairs, by fee asset. */
  fees: Map<string, Big>
  /**
   * Per base asset: what was spent on it (quote) and how many coins that
   * bought, for the allocation chart.
   */
  allocation: { asset: string; invested: number; qty: number }[]
  /** Local-time months, oldest first, with no gaps. */
  monthly: MonthVolume[]
}

/** "2024-03" in the viewer's time zone, since that is how they think of months. */
export function monthKey(time: number): string {
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthsBetween(from: string, to: string): string[] {
  const months: string[] = []
  let [year, month] = from.split('-').map(Number) as [number, number]
  const [endYear, endMonth] = to.split('-').map(Number) as [number, number]
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`)
    month++
    if (month > 12) {
      month = 1
      year++
    }
  }
  return months
}

/** Quote assets by how much was traded in them, most first. */
export function quoteAssets(pairs: readonly PairStats[]): string[] {
  const volume = new Map<string, number>()
  for (const pair of pairs) {
    volume.set(pair.quote, (volume.get(pair.quote) ?? 0) + pair.trades.length)
  }
  return [...volume.entries()].sort((a, b) => b[1] - a[1]).map(([quote]) => quote)
}

/** Portfolio-wide figures for the pairs quoted in one asset. */
export function computePortfolio(allPairs: readonly PairStats[], quote: string): PortfolioStats {
  const pairs = allPairs.filter((pair) => pair.quote === quote)
  const fees = new Map<string, Big>()
  let invested = ZERO
  let received = ZERO
  let realizedPnl = ZERO
  const volume = new Map<string, { buy: Big; sell: Big }>()

  for (const pair of pairs) {
    invested = invested.plus(pair.invested)
    received = received.plus(pair.received)
    realizedPnl = realizedPnl.plus(pair.realizedPnl)
    pair.fees.forEach((amount, asset) => addFee(fees, asset, amount))
    for (const trade of pair.trades) {
      const month = monthKey(trade.time)
      const entry = volume.get(month) ?? { buy: ZERO, sell: ZERO }
      entry[trade.side] = entry[trade.side].plus(trade.total)
      volume.set(month, entry)
    }
  }

  const months = [...volume.keys()].sort()
  const monthly =
    months.length === 0
      ? []
      : monthsBetween(months[0] as string, months[months.length - 1] as string).map((month) => ({
          month,
          buy: volume.get(month)?.buy.toNumber() ?? 0,
          sell: volume.get(month)?.sell.toNumber() ?? 0,
        }))

  return {
    quotes: quoteAssets(allPairs),
    quote,
    pairs,
    tradeCount: pairs.reduce((sum, pair) => sum + pair.trades.length, 0),
    invested,
    received,
    realizedPnl,
    fees,
    allocation: pairs
      .filter((pair) => pair.invested.gt(0))
      .map((pair) => ({
        asset: pair.base,
        invested: pair.invested.toNumber(),
        qty: pair.boughtQty.toNumber(),
      })),
    monthly,
  }
}

/** Open-position PnL at a market price; null when flat or unpriced. */
export function unrealizedPnl(pair: PairStats, price: number | undefined): Big | null {
  if (price === undefined || pair.avgPrice === null || pair.position.eq(0)) return null
  return new Big(price).minus(pair.avgPrice).times(pair.position)
}

/** The same mark-to-market as a percentage of the open position's average entry. */
export function unrealizedPct(pair: PairStats, price: number | undefined): Big | null {
  if (price === undefined || pair.avgPrice === null || pair.position.eq(0)) return null
  if (pair.avgPrice.eq(0)) return null
  return new Big(price).minus(pair.avgPrice).div(pair.avgPrice).times(100)
}

/**
 * One trade measured against the market now. A buy gains when the price has
 * risen since; a sell "gains" when it went for more than the coin is worth
 * today. The percentage is against the trade's own price.
 */
export function tradePnl(
  trade: Pick<Trade, 'side' | 'price' | 'qty'>,
  price: number | undefined,
): { pnl: Big; pct: Big } | null {
  if (price === undefined) return null
  const tradePrice = new Big(trade.price)
  if (tradePrice.eq(0)) return null
  const move = trade.side === 'buy' ? new Big(price).minus(tradePrice) : tradePrice.minus(price)
  return { pnl: move.times(trade.qty), pct: move.div(tradePrice).times(100) }
}
