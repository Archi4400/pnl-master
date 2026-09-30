/**
 * Prices from Binance's public market-data API.
 *
 * data-api.binance.vision serves the same /api/v3 market endpoints as
 * api.binance.com, but it is meant for public data: no key, CORS open to any
 * origin, and not geo-blocked the way the trading host is in some countries.
 * Everything is quoted in USDT, which is what the calculators label amounts in.
 */

const API = 'https://data-api.binance.vision/api/v3'

export const QUOTE_ASSET = 'USDT'

/** Shown before the user types a search, roughly by market cap. */
export const POPULAR_ASSETS = [
  'BTC',
  'ETH',
  'BNB',
  'SOL',
  'XRP',
  'DOGE',
  'TON',
  'ADA',
  'TRX',
  'AVAX',
  'LINK',
  'SUI',
] as const

type TickerPrice = { symbol: string; price: string }

function isTickerPrice(value: unknown): value is TickerPrice {
  if (typeof value !== 'object' || value === null) return false
  const ticker = value as Record<string, unknown>
  return typeof ticker.symbol === 'string' && typeof ticker.price === 'string'
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Binance responded ${response.status}`)
  return response.json()
}

/**
 * Every USDT pair's last price, keyed by base asset (BTC → 64000).
 *
 * One request (~160 KB) feeds both the coin search and its prices, which beats
 * fetching exchangeInfo (several MB) just to list symbols.
 */
export async function fetchUsdtPrices(signal?: AbortSignal): Promise<Map<string, number>> {
  const data = await getJson(`${API}/ticker/price`, signal)
  if (!Array.isArray(data)) throw new Error('Unexpected ticker list')

  const prices = new Map<string, number>()
  for (const ticker of data) {
    if (!isTickerPrice(ticker) || !ticker.symbol.endsWith(QUOTE_ASSET)) continue
    const base = ticker.symbol.slice(0, -QUOTE_ASSET.length)
    const price = Number(ticker.price)
    // Delisted pairs linger in the list with a zero price.
    if (base && Number.isFinite(price) && price > 0) prices.set(base, price)
  }

  // Retired leveraged tokens (ETHUP, BTCDOWN…) still report a price. A suffix
  // alone would also catch real coins like JUP, so a token only goes when its
  // underlying (ETH for ETHUP) is listed too.
  for (const base of [...prices.keys()]) {
    const underlying = base.replace(/(UP|DOWN|BULL|BEAR)$/, '')
    if (underlying !== base && prices.has(underlying)) prices.delete(base)
  }
  return prices
}

/** Last price and the move over the last 24 hours, which colours it. */
export type CoinStats = { price: number; changePct: number }

type MiniTicker = { symbol: string; openPrice: string; lastPrice: string }

function isMiniTicker(value: unknown): value is MiniTicker {
  if (typeof value !== 'object' || value === null) return false
  const ticker = value as Record<string, unknown>
  return (
    typeof ticker.symbol === 'string' &&
    typeof ticker.openPrice === 'string' &&
    typeof ticker.lastPrice === 'string'
  )
}

function toStats(ticker: MiniTicker): CoinStats | null {
  const price = Number(ticker.lastPrice)
  const open = Number(ticker.openPrice)
  if (!Number.isFinite(price) || price <= 0) return null
  const changePct = Number.isFinite(open) && open > 0 ? ((price - open) / open) * 100 : 0
  return { price, changePct }
}

/**
 * 24h stats for one coin. type=MINI drops the fields we do not show (high,
 * low, trade ids…), which roughly halves the payload.
 */
export async function fetchStats(asset: string, signal?: AbortSignal): Promise<CoinStats> {
  const symbol = encodeURIComponent(`${asset}${QUOTE_ASSET}`)
  const data = await getJson(`${API}/ticker/24hr?symbol=${symbol}&type=MINI`, signal)
  const stats = isMiniTicker(data) ? toStats(data) : null
  if (!stats) throw new Error('No price')
  return stats
}

/**
 * 24h stats for a batch of coins, keyed by base asset.
 *
 * The all-symbols variant of this endpoint is ~1 MB and slow, so the picker
 * asks only for the rows it is showing. Note that Binance rejects the whole
 * batch if any one symbol is unknown; the symbols here come from Binance's own
 * price list, so that should not happen, and a failed batch only loses colour.
 */
export async function fetchStatsBatch(
  assets: readonly string[],
  signal?: AbortSignal,
): Promise<Map<string, CoinStats>> {
  const symbols = JSON.stringify(assets.map((asset) => `${asset}${QUOTE_ASSET}`))
  const query = new URLSearchParams({ symbols, type: 'MINI' })
  const data = await getJson(`${API}/ticker/24hr?${query}`, signal)
  if (!Array.isArray(data)) throw new Error('Unexpected ticker list')

  const stats = new Map<string, CoinStats>()
  for (const ticker of data) {
    if (!isMiniTicker(ticker)) continue
    const entry = toStats(ticker)
    if (entry) stats.set(ticker.symbol.slice(0, -QUOTE_ASSET.length), entry)
  }
  return stats
}
