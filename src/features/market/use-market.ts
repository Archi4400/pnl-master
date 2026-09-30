import { queryOptions, useQueries, useQuery } from '@tanstack/react-query'

import { fetchStats, fetchStatsBatch, fetchUsdtPrices, type CoinStats } from './binance'

/** How often a selected coin's price refreshes while the tab is visible. */
const PRICE_REFRESH_MS = 10_000
/** List colours only need to be roughly current; the list is browsed, not traded. */
const BATCH_STALE_MS = 30_000

export const usdtPricesQuery = queryOptions({
  queryKey: ['binance', 'usdt-prices'],
  queryFn: ({ signal }) => fetchUsdtPrices(signal),
  // Only the coin list matters here; live prices come from useStats.
  staleTime: 5 * 60_000,
})

/**
 * All USDT pairs, for the coin search. `enabled` lets the picker fetch the list
 * only once it is opened, so a visitor who never picks a coin never pays for it.
 */
export function useUsdtPrices(enabled: boolean) {
  return useQuery({ ...usdtPricesQuery, enabled })
}

/**
 * Live price and 24h change of one coin, or nothing when no coin is picked.
 * Every place showing it shares this query, so they agree and cost one request.
 */
export function useStats(asset: string | null) {
  return useQuery({
    queryKey: ['binance', 'stats', asset],
    queryFn: ({ signal }) => fetchStats(asset as string, signal),
    enabled: asset !== null,
    refetchInterval: PRICE_REFRESH_MS,
    staleTime: PRICE_REFRESH_MS / 2,
  })
}

/**
 * 24h stats for the batches the picker is currently showing, merged into one
 * lookup. Each batch is its own cached query, so scrolling back up reuses what
 * was already loaded instead of asking again.
 */
export function useStatsBatches(batches: readonly (readonly string[])[]) {
  return useQueries({
    queries: batches.map((assets) => ({
      queryKey: ['binance', 'stats-batch', assets.join(',')],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchStatsBatch(assets, signal),
      staleTime: BATCH_STALE_MS,
    })),
    combine: (results) => {
      const merged = new Map<string, CoinStats>()
      for (const result of results) {
        result.data?.forEach((stats, asset) => merged.set(asset, stats))
      }
      return merged
    },
  })
}
