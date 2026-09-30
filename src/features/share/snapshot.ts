import type { FuturesInputs } from '@/features/calculator/futures-state'
import { parseNumber, sanitizeNumberInput } from '@/features/calculator/math'
import type { SpotInputs } from '@/features/spot/spot-state'

/**
 * One calculation as data: which calculator, which coin, and the inputs that
 * reproduce it. Share links and saved calculations both use this, encoded as a
 * query string, so there is a single format to validate.
 */

export type Mode = 'futures' | 'spot'

export type Snapshot =
  | { mode: 'futures'; asset: string | null; futures: FuturesInputs }
  | { mode: 'spot'; asset: string | null; spot: SpotInputs }

/** Binance base assets are short upper-case alphanumerics (BTC, 1INCH, PEPE). */
const ASSET_PATTERN = /^[A-Z0-9]{1,15}$/

export function isAsset(value: string): boolean {
  return ASSET_PATTERN.test(value)
}

/**
 * Query keys. Short but still readable in a pasted link. Each margin/holding
 * amount appears under exactly one of two keys, and which one says whether the
 * user entered it in USDT or in units.
 */
const KEY = {
  mode: 'mode',
  asset: 'asset',
  side: 'side',
  usdt: 'usdt',
  qty: 'qty',
  open: 'open',
  close: 'close',
  leverage: 'lev',
  invested: 'invested',
  average: 'avg',
  buyQty: 'buyQty',
  buyCost: 'buyCost',
  buyPrice: 'buyPrice',
  sell: 'sell',
} as const

export function readMode(params: URLSearchParams): Mode {
  return params.get(KEY.mode) === 'spot' ? 'spot' : 'futures'
}

export function encodeSnapshot(snapshot: Snapshot): URLSearchParams {
  const params = new URLSearchParams()
  if (snapshot.mode === 'spot') params.set(KEY.mode, 'spot')
  if (snapshot.asset) params.set(KEY.asset, snapshot.asset)

  if (snapshot.mode === 'futures') {
    const f = snapshot.futures
    params.set(KEY.side, f.direction)
    params.set(f.amountSource === 'quote' ? KEY.usdt : KEY.qty, f.amount)
    params.set(KEY.open, f.openPrice)
    params.set(KEY.close, f.closePrice)
    params.set(KEY.leverage, f.leverage)
  } else {
    const s = snapshot.spot
    params.set(s.holdingSource === 'units' ? KEY.qty : KEY.invested, s.holding)
    params.set(KEY.average, s.averagePrice)
    params.set(s.buySource === 'units' ? KEY.buyQty : KEY.buyCost, s.buy)
    params.set(KEY.buyPrice, s.buyPrice)
    params.set(KEY.sell, s.salePrice)
  }
  return params
}

/**
 * A number exactly as the fields would accept it, or null. Links are user input
 * from elsewhere, so they go through the same gate as typing does.
 */
function readNumber(params: URLSearchParams, key: string): string | null {
  const raw = params.get(key)
  if (raw === null) return null
  const clean = sanitizeNumberInput(raw)
  return clean !== null && parseNumber(clean) !== null ? clean : null
}

/** One of a pair of keys; the one present decides the source side. */
function readPair<S extends string>(
  params: URLSearchParams,
  options: [key: string, side: S][],
): { side: S; value: string } | null {
  for (const [key, side] of options) {
    const value = readNumber(params, key)
    if (value !== null) return { side, value }
  }
  return null
}

/**
 * Parse a snapshot from a query string. Returns null unless every input is
 * present and valid: a half-filled calculator from a mangled link would look
 * like a real result, which is worse than just opening the defaults.
 */
export function decodeSnapshot(params: URLSearchParams): Snapshot | null {
  const mode = readMode(params)
  const rawAsset = params.get(KEY.asset)
  const asset = rawAsset !== null && isAsset(rawAsset) ? rawAsset : null

  if (mode === 'futures') {
    const side = params.get(KEY.side)
    const amount = readPair(params, [
      [KEY.usdt, 'quote'],
      [KEY.qty, 'units'],
    ] as const)
    const openPrice = readNumber(params, KEY.open)
    const closePrice = readNumber(params, KEY.close)
    const leverage = readNumber(params, KEY.leverage)
    if (
      (side !== 'long' && side !== 'short') ||
      !amount ||
      !openPrice ||
      !closePrice ||
      !leverage
    ) {
      return null
    }
    return {
      mode,
      asset,
      futures: {
        direction: side,
        amountSource: amount.side,
        amount: amount.value,
        openPrice,
        closePrice,
        leverage,
      },
    }
  }

  const holding = readPair(params, [
    [KEY.qty, 'units'],
    [KEY.invested, 'quote'],
  ] as const)
  const buy = readPair(params, [
    [KEY.buyQty, 'units'],
    [KEY.buyCost, 'quote'],
  ] as const)
  const averagePrice = readNumber(params, KEY.average)
  const buyPrice = readNumber(params, KEY.buyPrice)
  const salePrice = readNumber(params, KEY.sell)
  if (!holding || !buy || !averagePrice || !buyPrice || !salePrice) return null

  return {
    mode,
    asset,
    spot: {
      holdingSource: holding.side,
      holding: holding.value,
      averagePrice,
      buySource: buy.side,
      buy: buy.value,
      buyPrice,
      salePrice,
    },
  }
}

/** An absolute link to this page that reopens the snapshot. */
export function shareUrl(snapshot: Snapshot): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}?${encodeSnapshot(snapshot)}`
}
