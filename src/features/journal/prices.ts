import type { PairStats } from './stats'

/** Live market prices for the page, refreshed on a timer while trades are loaded. */
export type PriceState = {
  prices: Map<string, number> | undefined
  isFetching: boolean
  isError: boolean
  updatedAt: number
  refresh: () => void
}

/** Market price of a pair from the all-symbols map ("BTC" + "USDT" → BTCUSDT). */
export function pairPrice(prices: Map<string, number> | undefined, pair: PairStats) {
  return prices?.get(`${pair.base}${pair.quote}`)
}
